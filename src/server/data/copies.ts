import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { copies, locations, sets, users } from '../db/schema';
import {
  createdFields,
  diffFields,
  recordAudit,
  stampCreate,
  stampTrash,
  stampUpdate,
  trashedFields,
} from './audit';
import { BUILD_STATES, completenessOf, type BuildState } from './completeness';
import type { DataContext } from './context';
import { isUuid } from './ids';
import { openMissingByCopy } from './missing';
import {
  assertCanWrite,
  copyVisibilityCondition,
  redactCopy,
  setVisibilityCondition,
} from './visibility';

const optionalMoneyCents = z
  .preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).max(100_000_000).nullable(),
  )
  .default(null);

const optionalDate = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null))
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-03-14')
      .nullable(),
  );

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const copyInput = z.object({
  ownerUserId: z
    .uuid()
    .nullish()
    .transform((v) => v ?? null),
  locationId: z
    .uuid()
    .nullish()
    .transform((v) => v ?? null),
  buildState: z.enum(BUILD_STATES as [BuildState, ...BuildState[]]).default('sealed'),
  piecesCheckedOn: optionalDate,
  hasBox: z.boolean().default(true),
  hasInstructions: z.boolean().default(true),
  conditionNotes: optionalText(2000),
  acquiredOn: optionalDate,
  pricePaidCents: optionalMoneyCents,
  estimatedValueCents: optionalMoneyCents,
  valuedOn: optionalDate,
  notes: optionalText(2000),
});
export type CopyInput = z.input<typeof copyInput>;

const AUDITED = [
  'ownerUserId',
  'locationId',
  'buildState',
  'piecesCheckedOn',
  'hasBox',
  'hasInstructions',
  'conditionNotes',
  'acquiredOn',
  'pricePaidCents',
  'estimatedValueCents',
  'valuedOn',
  'notes',
] as const;

const pickAudited = (row: Record<string, unknown>) =>
  Object.fromEntries(AUDITED.map((k) => [k, row[k] ?? null]));

async function assertRefs(
  ctx: DataContext,
  input: { ownerUserId: string | null; locationId: string | null },
) {
  if (input.ownerUserId) {
    const [u] = await ctx.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, input.ownerUserId), eq(users.householdId, ctx.householdId)));
    if (!u) throw new Error('Unknown owner');
  }
  if (input.locationId) {
    const [l] = await ctx.db
      .select({ id: locations.id })
      .from(locations)
      .where(
        and(
          eq(locations.id, input.locationId),
          eq(locations.householdId, ctx.householdId),
          isNull(locations.deletedAt),
        ),
      );
    if (!l) throw new Error('Unknown place');
  }
}

export const MAX_COPIES_AT_ONCE = 50;

/** Adds `quantity` identical copies in one transaction ("How many?"). */
export async function addCopies(ctx: DataContext, setId: string, raw: CopyInput, quantity = 1) {
  assertCanWrite(ctx);
  const n = z.number().int().min(1).max(MAX_COPIES_AT_ONCE).parse(quantity);
  const input = copyInput.parse(raw);
  await assertRefs(ctx, input);
  return ctx.db.transaction(async (tx) => {
    const [set] = await tx
      .select({ id: sets.id })
      .from(sets)
      .where(and(eq(sets.id, setId), setVisibilityCondition(ctx)));
    if (!set) throw new Error('Set not found');
    const now = Date.now();
    const rows = await tx
      .insert(copies)
      .values(
        Array.from({ length: n }, (_, i) => ({
          householdId: ctx.householdId,
          setId,
          ...input,
          ...stampCreate(ctx),
          // Distinct stamps keep "copy 1 of 3" ordering stable within one batch.
          createdAt: new Date(now + i),
        })),
      )
      .returning();
    for (const row of rows) {
      await recordAudit(tx, ctx, {
        entityType: 'copy',
        entityId: row.id,
        action: 'create',
        changes: createdFields({ setId, ...pickAudited(row) }),
      });
    }
    return rows;
  });
}

async function loadCopy(tx: DataContext['db'], ctx: DataContext, id: string) {
  const [row] = await tx
    .select({ copy: copies })
    .from(copies)
    .innerJoin(sets, eq(sets.id, copies.setId))
    .where(and(eq(copies.id, id), copyVisibilityCondition(ctx)));
  return row?.copy ?? null;
}

export async function updateCopy(ctx: DataContext, id: string, raw: CopyInput) {
  assertCanWrite(ctx);
  const input = copyInput.parse(raw);
  await assertRefs(ctx, input);
  return ctx.db.transaction(async (tx) => {
    const before = await loadCopy(tx, ctx, id);
    if (!before) throw new Error('Copy not found');
    const [row] = await tx
      .update(copies)
      .set({ ...input, ...stampUpdate(ctx) })
      .where(eq(copies.id, id))
      .returning();
    const changes = diffFields(pickAudited(before), pickAudited(row!));
    if (Object.keys(changes).length > 0) {
      await recordAudit(tx, ctx, { entityType: 'copy', entityId: id, action: 'update', changes });
    }
    return row!;
  });
}

/** The one-tap menu on the copy card. Each change is audited, so the trail doubles as build history. */
export async function setBuildState(ctx: DataContext, id: string, state: BuildState) {
  assertCanWrite(ctx);
  const next = z.enum(BUILD_STATES as [BuildState, ...BuildState[]]).parse(state);
  return ctx.db.transaction(async (tx) => {
    const before = await loadCopy(tx, ctx, id);
    if (!before) throw new Error('Copy not found');
    if (before.buildState === next) return before;
    const [row] = await tx
      .update(copies)
      .set({ buildState: next, ...stampUpdate(ctx) })
      .where(eq(copies.id, id))
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'copy',
      entityId: id,
      action: 'update',
      changes: { buildState: [before.buildState, next] },
    });
    return row!;
  });
}

export async function trashCopy(ctx: DataContext, id: string): Promise<boolean> {
  assertCanWrite(ctx);
  return ctx.db.transaction(async (tx) => {
    const before = await loadCopy(tx, ctx, id);
    if (!before) return false;
    await tx
      .update(copies)
      .set({ ...stampTrash(ctx), ...stampUpdate(ctx) })
      .where(eq(copies.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'copy',
      entityId: id,
      action: 'delete',
      changes: trashedFields({ setId: before.setId, buildState: before.buildState }),
    });
    return true;
  });
}

export interface CopyCard {
  copy: typeof copies.$inferSelect;
  ownerName: string | null;
  /** "Attic › Shelf 1", or null when the copy has no place. */
  locationPath: string | null;
  /** Position among the set's copies, 1-based, for "copy 2 of 3". */
  position: number;
  completeness: ReturnType<typeof completenessOf>;
}

/** The set's live copies, oldest first, with owner, place and derived completeness. */
export async function listCopiesForSet(ctx: DataContext, setId: string): Promise<CopyCard[]> {
  if (!isUuid(setId)) return [];
  const rows = await ctx.db
    .select({ copy: copies, ownerName: users.name })
    .from(copies)
    .innerJoin(sets, eq(sets.id, copies.setId))
    .leftJoin(users, eq(users.id, copies.ownerUserId))
    .where(and(eq(copies.setId, setId), copyVisibilityCondition(ctx)))
    .orderBy(asc(copies.createdAt), asc(copies.id));
  const locs = new Map(
    (
      await ctx.db
        .select({ id: locations.id, name: locations.name, parentId: locations.parentId })
        .from(locations)
        .where(eq(locations.householdId, ctx.householdId))
    ).map((l) => [l.id, l]),
  );
  const pathOf = (id: string | null) => {
    const parts: string[] = [];
    const seen = new Set<string>();
    for (let cur = id ? locs.get(id) : undefined; cur && !seen.has(cur.id);) {
      seen.add(cur.id);
      parts.unshift(cur.name);
      cur = cur.parentId ? locs.get(cur.parentId) : undefined;
    }
    return parts.length ? parts.join(' › ') : null;
  };
  const missing = await openMissingByCopy(
    ctx,
    rows.map((r) => r.copy.id),
  );
  return rows.map((r, i) => ({
    copy: redactCopy(r.copy, ctx.viewer),
    ownerName: r.ownerName,
    locationPath: pathOf(r.copy.locationId),
    position: i + 1,
    completeness: completenessOf({
      buildState: r.copy.buildState,
      piecesCheckedOn: r.copy.piecesCheckedOn,
      missingPieces: missing.get(r.copy.id) ?? 0,
    }),
  }));
}
