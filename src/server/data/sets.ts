import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { brands, copies, sets, themes } from '../db/schema';
import {
  createdFields,
  diffFields,
  recordAudit,
  stampCreate,
  stampTrash,
  stampUpdate,
  trashedFields,
} from './audit';
import type { DataContext } from './context';
import { isUuid } from './ids';
import { replaceSetTags, tagNamesForSets } from './tags';
import { assertCanWrite, redactSet, setVisibilityCondition } from './visibility';

const blankToNull = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));

const optionalInt = (max: number) =>
  z.preprocess(blankToNull, z.number().int().min(0).max(max).nullable()).default(null);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const setInput = z.object({
  brandId: z.uuid(),
  setNumber: optionalText(40),
  name: z.string().trim().min(1).max(200),
  themeId: z
    .uuid()
    .nullish()
    .transform((v) => v ?? null),
  year: optionalInt(2200),
  pieceCount: optionalInt(100000),
  minifigCount: optionalInt(1000),
  minAge: optionalInt(120),
  description: optionalText(5000),
  retailPriceCents: optionalInt(100_000_00),
  designer: optionalText(200),
  notes: optionalText(5000),
  rbSetNum: optionalText(40),
  hiddenFromRestricted: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
export type SetInput = z.input<typeof setInput>;

export class DuplicateSetError extends Error {
  constructor(public existingSetId: string) {
    super('You already have this set');
  }
}

/** The live set with this brand and number, if any, so the form can offer "add another copy". */
export async function findSetByNumber(
  ctx: DataContext,
  brandId: string,
  setNumber: string,
): Promise<{ id: string; name: string } | null> {
  const [row] = await ctx.db
    .select({ id: sets.id, name: sets.name })
    .from(sets)
    .where(
      and(
        setVisibilityCondition(ctx),
        eq(sets.brandId, brandId),
        sql`lower(${sets.setNumber}) = lower(${setNumber.trim()})`,
      ),
    );
  return row ?? null;
}

async function assertRefs(ctx: DataContext, brandId: string, themeId: string | null) {
  const [brand] = await ctx.db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.id, brandId), eq(brands.householdId, ctx.householdId)));
  if (!brand) throw new Error('Unknown brand');
  if (themeId) {
    const [theme] = await ctx.db
      .select({ id: themes.id })
      .from(themes)
      .where(and(eq(themes.id, themeId), eq(themes.householdId, ctx.householdId)));
    if (!theme) throw new Error('Unknown theme');
  }
}

const AUDITED = [
  'brandId',
  'setNumber',
  'name',
  'themeId',
  'year',
  'pieceCount',
  'minifigCount',
  'minAge',
  'description',
  'retailPriceCents',
  'designer',
  'notes',
  'rbSetNum',
  'hiddenFromRestricted',
] as const;

const pickAudited = (row: Record<string, unknown>) =>
  Object.fromEntries(AUDITED.map((k) => [k, row[k] ?? null]));

export async function createSet(ctx: DataContext, raw: SetInput) {
  assertCanWrite(ctx);
  const input = setInput.parse(raw);
  await assertRefs(ctx, input.brandId, input.themeId);
  if (input.setNumber) {
    const dupe = await findSetByNumber(ctx, input.brandId, input.setNumber);
    if (dupe) throw new DuplicateSetError(dupe.id);
  }
  const { tags, ...values } = input;
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(sets)
      .values({ householdId: ctx.householdId, ...values, ...stampCreate(ctx) })
      .returning();
    const tagChange = await replaceSetTags(tx, ctx, row!.id, tags);
    await recordAudit(tx, ctx, {
      entityType: 'set',
      entityId: row!.id,
      action: 'create',
      changes: {
        ...createdFields(pickAudited(row!)),
        ...(tagChange.after.length ? { tags: [null, tagChange.after] as [unknown, unknown] } : {}),
      },
    });
    return row!;
  });
}

export async function updateSet(ctx: DataContext, id: string, raw: SetInput) {
  assertCanWrite(ctx);
  const input = setInput.parse(raw);
  await assertRefs(ctx, input.brandId, input.themeId);
  if (input.setNumber) {
    const dupe = await findSetByNumber(ctx, input.brandId, input.setNumber);
    if (dupe && dupe.id !== id) throw new DuplicateSetError(dupe.id);
  }
  const { tags, ...values } = input;
  return ctx.db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(sets)
      .where(and(eq(sets.id, id), setVisibilityCondition(ctx)));
    if (!before) throw new Error('Set not found');
    const [row] = await tx
      .update(sets)
      .set({ ...values, ...stampUpdate(ctx) })
      .where(eq(sets.id, id))
      .returning();
    const tagChange = await replaceSetTags(tx, ctx, id, tags);
    const changes = diffFields(pickAudited(before), pickAudited(row!));
    if (tagChange.before.join('\n') !== tagChange.after.join('\n')) {
      changes.tags = [tagChange.before, tagChange.after];
    }
    if (Object.keys(changes).length > 0) {
      await recordAudit(tx, ctx, { entityType: 'set', entityId: id, action: 'update', changes });
    }
    return row!;
  });
}

/** Sets the cover path (an upload or a catalog image). Returns the previous path for cleanup. */
export async function setCoverImage(
  ctx: DataContext,
  id: string,
  path: string | null,
): Promise<string | null> {
  assertCanWrite(ctx);
  return ctx.db.transaction(async (tx) => {
    const [before] = await tx
      .select({ coverImage: sets.coverImage })
      .from(sets)
      .where(and(eq(sets.id, id), setVisibilityCondition(ctx)));
    if (!before) throw new Error('Set not found');
    await tx
      .update(sets)
      .set({ coverImage: path, ...stampUpdate(ctx) })
      .where(eq(sets.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'set',
      entityId: id,
      action: 'update',
      changes: { coverImage: [before.coverImage, path] },
    });
    return before.coverImage;
  });
}

export interface SetDetail {
  set: typeof sets.$inferSelect;
  brand: { id: string; name: string; isLego: boolean };
  themePath: { id: string; name: string }[];
  tags: string[];
}

/** One visible set with its brand, theme breadcrumb and tags. Null for unknown or hidden sets. */
export async function getSet(ctx: DataContext, id: string): Promise<SetDetail | null> {
  if (!isUuid(id)) return null;
  const [row] = await ctx.db
    .select({ set: sets, brand: { id: brands.id, name: brands.name, isLego: brands.isLego } })
    .from(sets)
    .innerJoin(brands, eq(brands.id, sets.brandId))
    .where(and(eq(sets.id, id), setVisibilityCondition(ctx)));
  if (!row) return null;
  const themePath: { id: string; name: string }[] = [];
  if (row.set.themeId) {
    const all = new Map(
      (
        await ctx.db
          .select({ id: themes.id, name: themes.name, parentId: themes.parentId })
          .from(themes)
          .where(eq(themes.householdId, ctx.householdId))
      ).map((t) => [t.id, t]),
    );
    const seen = new Set<string>();
    for (let cur = all.get(row.set.themeId); cur && !seen.has(cur.id);) {
      seen.add(cur.id);
      themePath.unshift({ id: cur.id, name: cur.name });
      cur = cur.parentId ? all.get(cur.parentId) : undefined;
    }
  }
  const tagMap = await tagNamesForSets(ctx, [id]);
  return {
    set: redactSet(row.set, ctx.viewer),
    brand: row.brand,
    themePath,
    tags: tagMap.get(id) ?? [],
  };
}

export type TrashSetResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'has_copies'; copies: number };

/** A set with live copies cannot be deleted (trash or remove its copies first). */
export async function trashSet(ctx: DataContext, id: string): Promise<TrashSetResult> {
  assertCanWrite(ctx);
  return ctx.db.transaction(async (tx) => {
    const [set] = await tx
      .select()
      .from(sets)
      .where(and(eq(sets.id, id), setVisibilityCondition(ctx)));
    if (!set) return { ok: false, reason: 'not_found' } as const;
    const [live] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(copies)
      .where(and(eq(copies.setId, id), isNull(copies.deletedAt)));
    if (live && live.n > 0) return { ok: false, reason: 'has_copies', copies: live.n } as const;
    await tx
      .update(sets)
      .set({ ...stampTrash(ctx), ...stampUpdate(ctx) })
      .where(eq(sets.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'set',
      entityId: id,
      action: 'delete',
      changes: trashedFields({ name: set.name, setNumber: set.setNumber }),
    });
    return { ok: true } as const;
  });
}

export async function listBrandSets(ctx: DataContext, brandId: string) {
  return ctx.db
    .select({ id: sets.id, name: sets.name, setNumber: sets.setNumber })
    .from(sets)
    .where(and(setVisibilityCondition(ctx), eq(sets.brandId, brandId)))
    .orderBy(asc(sets.name));
}

export interface SetSummary {
  id: string;
  name: string;
  setNumber: string | null;
  year: number | null;
  brandName: string;
  hasCover: boolean;
}

/** A plain list of visible sets, newest first. Phase 4 replaces this with the paged library query. */
export async function listSetSummaries(ctx: DataContext, limit = 200): Promise<SetSummary[]> {
  const rows = await ctx.db
    .select({
      id: sets.id,
      name: sets.name,
      setNumber: sets.setNumber,
      year: sets.year,
      brandName: brands.name,
      coverImage: sets.coverImage,
    })
    .from(sets)
    .innerJoin(brands, eq(brands.id, sets.brandId))
    .where(setVisibilityCondition(ctx))
    .orderBy(sql`${sets.createdAt} desc`, asc(sets.name))
    .limit(limit);
  return rows.map(({ coverImage, ...r }) => ({ ...r, hasCover: coverImage !== null }));
}
