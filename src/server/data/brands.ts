import { and, asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { brands, sets } from '../db/schema';
import {
  createdFields,
  deletedFields,
  diffFields,
  recordAudit,
  stampCreate,
  stampUpdate,
} from './audit';
import type { DataContext } from './context';
import { assertCanWrite } from './visibility';

export const brandInput = z.object({
  name: z.string().trim().min(1).max(100),
  websiteUrl: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((v) => v || null)
    .pipe(z.url().nullable()),
  notes: z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((v) => v || null),
});
export type BrandInput = z.input<typeof brandInput>;

export async function listBrands(ctx: DataContext) {
  return ctx.db
    .select()
    .from(brands)
    .where(eq(brands.householdId, ctx.householdId))
    .orderBy(asc(sql`lower(${brands.name})`));
}

/** Brands with how many live sets use each one (for the settings list and the delete guard). */
export async function listBrandsWithCounts(ctx: DataContext) {
  return ctx.db
    .select({
      id: brands.id,
      name: brands.name,
      isLego: brands.isLego,
      websiteUrl: brands.websiteUrl,
      notes: brands.notes,
      sets: sql<number>`(select count(*)::int from ${sets} s where s.brand_id = ${brands.id} and s.deleted_at is null)`,
    })
    .from(brands)
    .where(eq(brands.householdId, ctx.householdId))
    .orderBy(asc(sql`lower(${brands.name})`));
}

export async function createBrand(
  ctx: DataContext,
  raw: BrandInput,
  opts: { isLego?: boolean } = {},
) {
  assertCanWrite(ctx);
  const input = brandInput.parse(raw);
  const [dupe] = await ctx.db
    .select({ id: brands.id })
    .from(brands)
    .where(
      and(
        eq(brands.householdId, ctx.householdId),
        sql`lower(${brands.name}) = lower(${input.name})`,
      ),
    );
  if (dupe) throw new Error(`A brand named "${input.name}" already exists`);
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(brands)
      .values({
        householdId: ctx.householdId,
        name: input.name,
        websiteUrl: input.websiteUrl,
        notes: input.notes,
        isLego: opts.isLego ?? false,
        ...stampCreate(ctx),
      })
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'brand',
      entityId: row!.id,
      action: 'create',
      changes: createdFields({ name: row!.name, websiteUrl: row!.websiteUrl }),
    });
    return row!;
  });
}

export async function updateBrand(ctx: DataContext, id: string, raw: BrandInput) {
  assertCanWrite(ctx);
  const input = brandInput.parse(raw);
  return ctx.db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.householdId, ctx.householdId)));
    if (!before) throw new Error('Brand not found');
    const changes = diffFields(before, input);
    if (Object.keys(changes).length === 0) return before;
    const [row] = await tx
      .update(brands)
      .set({ ...input, ...stampUpdate(ctx) })
      .where(eq(brands.id, id))
      .returning();
    await recordAudit(tx, ctx, { entityType: 'brand', entityId: id, action: 'update', changes });
    return row!;
  });
}

export type DeleteBrandResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'has_sets'; sets: number };

/** An unused brand is deleted for real (audited). A brand with sets is never deleted. */
export async function deleteBrand(ctx: DataContext, id: string): Promise<DeleteBrandResult> {
  assertCanWrite(ctx);
  return ctx.db.transaction(async (tx) => {
    const [brand] = await tx
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.householdId, ctx.householdId)));
    if (!brand) return { ok: false, reason: 'not_found' } as const;
    // Trashed sets still point at the brand, so they count too.
    const [used] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(sets)
      .where(eq(sets.brandId, id));
    if (used && used.n > 0) return { ok: false, reason: 'has_sets', sets: used.n } as const;
    await tx.delete(brands).where(eq(brands.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'brand',
      entityId: id,
      action: 'delete',
      changes: deletedFields({ name: brand.name }),
    });
    return { ok: true } as const;
  });
}
