import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { getCatalogColor, getCatalogFig, getCatalogPart } from '../catalog/reference';
import { copyMissingItems, copies, sets } from '../db/schema';
import {
  createdFields,
  deletedFields,
  diffFields,
  recordAudit,
  stampCreate,
  stampUpdate,
} from './audit';
import type { DataContext } from './context';
import { isUuid } from './ids';
import { assertCanWrite, copyVisibilityCondition } from './visibility';

export type MissingItem = typeof copyMissingItems.$inferSelect;

const quantity = z.number().int().min(1, 'Quantity must be at least 1').max(9999);

export const missingInput = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('part'),
    partNum: z.string().trim().min(1).max(80),
    colorId: z.number().int(),
    quantity,
    fromInventory: z.boolean().default(false),
    notes: z.string().trim().max(500).nullish(),
  }),
  z.object({
    kind: z.literal('minifig'),
    figNum: z.string().trim().min(1).max(80),
    quantity,
    fromInventory: z.boolean().default(false),
    notes: z.string().trim().max(500).nullish(),
  }),
  z.object({
    kind: z.literal('other'),
    description: z.string().trim().min(1, 'Describe the piece').max(300),
    quantity,
    notes: z.string().trim().max(500).nullish(),
  }),
]);
export type MissingInput = z.input<typeof missingInput>;

async function loadVisibleCopy(ctx: DataContext, copyId: string) {
  if (!isUuid(copyId)) return null;
  const [row] = await ctx.db
    .select({ id: copies.id, setId: copies.setId })
    .from(copies)
    .innerJoin(sets, eq(sets.id, copies.setId))
    .where(and(eq(copies.id, copyId), copyVisibilityCondition(ctx)));
  return row ?? null;
}

async function loadVisibleItem(ctx: DataContext, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await ctx.db
    .select({ item: copyMissingItems })
    .from(copyMissingItems)
    .innerJoin(copies, eq(copies.id, copyMissingItems.copyId))
    .innerJoin(sets, eq(sets.id, copies.setId))
    .where(and(eq(copyMissingItems.id, id), copyVisibilityCondition(ctx)));
  return row?.item ?? null;
}

/**
 * Open and resolved items of one copy this viewer can see. Kid profiles can read the list (no money
 * is involved) but not change it.
 */
export async function listMissing(
  ctx: DataContext,
  copyId: string,
): Promise<{ open: MissingItem[]; resolved: MissingItem[] }> {
  if (!(await loadVisibleCopy(ctx, copyId))) return { open: [], resolved: [] };
  const rows = await ctx.db
    .select()
    .from(copyMissingItems)
    .where(
      and(eq(copyMissingItems.copyId, copyId), eq(copyMissingItems.householdId, ctx.householdId)),
    )
    .orderBy(asc(copyMissingItems.createdAt), asc(copyMissingItems.id));
  return {
    open: rows.filter((r) => r.resolvedAt === null),
    resolved: rows.filter((r) => r.resolvedAt !== null).toReversed(),
  };
}

/** Total open missing pieces per copy (sum of quantities), for completeness. */
export async function openMissingByCopy(
  ctx: DataContext,
  copyIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (copyIds.length === 0) return out;
  const rows = await ctx.db
    .select({
      copyId: copyMissingItems.copyId,
      n: sql<number>`sum(${copyMissingItems.quantity})::int`,
    })
    .from(copyMissingItems)
    .where(
      and(
        eq(copyMissingItems.householdId, ctx.householdId),
        isNull(copyMissingItems.resolvedAt),
        inArray(copyMissingItems.copyId, copyIds),
      ),
    )
    .groupBy(copyMissingItems.copyId);
  for (const r of rows) out.set(r.copyId, r.n);
  return out;
}

export class UnknownCatalogItemError extends Error {
  constructor(what: string) {
    super(`${what} is not in the catalog. Import the catalog first, or add it as "Other".`);
    this.name = 'UnknownCatalogItemError';
  }
}

/**
 * Adds a missing piece. The same part in the same colour on the same copy raises the quantity of the
 * open row instead of making a second one. Names are copied from the catalog now, so the row still
 * reads well later.
 */
export async function addMissing(
  ctx: DataContext,
  copyId: string,
  raw: MissingInput,
): Promise<MissingItem> {
  assertCanWrite(ctx);
  const input = missingInput.parse(raw);
  if (!(await loadVisibleCopy(ctx, copyId))) throw new Error('Copy not found');

  type Snapshot = {
    partNum: string | null;
    colorId: number | null;
    figNum: string | null;
    name: string | null;
    colorName: string | null;
    image: string | null;
    description: string | null;
  };
  let snap: Snapshot = {
    partNum: null,
    colorId: null,
    figNum: null,
    name: null,
    colorName: null,
    image: null,
    description: null,
  };
  if (input.kind === 'part') {
    const [part, color] = await Promise.all([
      getCatalogPart(ctx.db, input.partNum),
      getCatalogColor(ctx.db, input.colorId),
    ]);
    if (!part) throw new UnknownCatalogItemError(`Part ${input.partNum}`);
    if (!color) throw new UnknownCatalogItemError(`Colour ${input.colorId}`);
    snap = {
      ...snap,
      partNum: part.partNum,
      colorId: color.id,
      name: part.name,
      colorName: color.name,
    };
  } else if (input.kind === 'minifig') {
    const fig = await getCatalogFig(ctx.db, input.figNum);
    if (!fig) throw new UnknownCatalogItemError(`Minifigure ${input.figNum}`);
    snap = { ...snap, figNum: fig.figNum, name: fig.name, image: fig.imgUrl };
  } else {
    snap = { ...snap, description: input.description };
  }
  const fromInventory = input.kind === 'other' ? false : input.fromInventory;

  return ctx.db.transaction(async (tx) => {
    if (input.kind !== 'other') {
      const [existing] = await tx
        .select()
        .from(copyMissingItems)
        .where(
          and(
            eq(copyMissingItems.copyId, copyId),
            eq(copyMissingItems.kind, input.kind),
            isNull(copyMissingItems.resolvedAt),
            snap.partNum === null
              ? isNull(copyMissingItems.rbPartNum)
              : eq(copyMissingItems.rbPartNum, snap.partNum),
            snap.colorId === null
              ? isNull(copyMissingItems.rbColorId)
              : eq(copyMissingItems.rbColorId, snap.colorId),
            snap.figNum === null
              ? isNull(copyMissingItems.rbFigNum)
              : eq(copyMissingItems.rbFigNum, snap.figNum),
          ),
        );
      if (existing) {
        const next = existing.quantity + input.quantity;
        const [row] = await tx
          .update(copyMissingItems)
          .set({ quantity: next, ...stampUpdate(ctx) })
          .where(eq(copyMissingItems.id, existing.id))
          .returning();
        await recordAudit(tx, ctx, {
          entityType: 'missing_item',
          entityId: existing.id,
          action: 'update',
          changes: { quantity: [existing.quantity, next] },
        });
        return row!;
      }
    }
    const [row] = await tx
      .insert(copyMissingItems)
      .values({
        householdId: ctx.householdId,
        copyId,
        kind: input.kind,
        rbPartNum: snap.partNum,
        rbColorId: snap.colorId,
        rbFigNum: snap.figNum,
        quantity: input.quantity,
        snapshotName: snap.name,
        snapshotColorName: snap.colorName,
        snapshotImage: snap.image,
        description: snap.description,
        fromInventory,
        notes: input.notes ?? null,
        ...stampCreate(ctx),
      })
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'missing_item',
      entityId: row!.id,
      action: 'create',
      changes: createdFields({
        copyId,
        kind: row!.kind,
        part: row!.rbPartNum,
        color: row!.snapshotColorName,
        figure: row!.rbFigNum,
        name: row!.snapshotName ?? row!.description,
        quantity: row!.quantity,
      }),
    });
    return row!;
  });
}

/** Sets the open quantity of a row (at least 1; to remove it, use `removeMissing`). */
export async function setMissingQuantity(
  ctx: DataContext,
  id: string,
  raw: number,
): Promise<MissingItem> {
  assertCanWrite(ctx);
  const q = quantity.parse(raw);
  const item = await loadVisibleItem(ctx, id);
  if (!item || item.resolvedAt) throw new Error('That row is not open');
  const changes = diffFields({ quantity: item.quantity }, { quantity: q });
  if (Object.keys(changes).length === 0) return item;
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .update(copyMissingItems)
      .set({ quantity: q, ...stampUpdate(ctx) })
      .where(eq(copyMissingItems.id, id))
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'missing_item',
      entityId: id,
      action: 'update',
      changes,
    });
    return row!;
  });
}

export type Resolution = 'found' | 'bought' | 'substituted';

/**
 * Marks some or all of an open row as found, bought or substituted. Resolving fewer than the row
 * holds ("found 2 of 3") lowers the open quantity and records the found ones as a resolved row.
 */
export async function resolveMissing(
  ctx: DataContext,
  id: string,
  resolution: Resolution,
  count?: number,
): Promise<void> {
  assertCanWrite(ctx);
  z.enum(['found', 'bought', 'substituted']).parse(resolution);
  const item = await loadVisibleItem(ctx, id);
  if (!item || item.resolvedAt) throw new Error('That row is not open');
  const n = count === undefined ? item.quantity : quantity.parse(count);
  if (n > item.quantity)
    throw new Error(`Only ${item.quantity} ${item.quantity === 1 ? 'is' : 'are'} missing`);
  const now = new Date();

  await ctx.db.transaction(async (tx) => {
    if (n === item.quantity) {
      await tx
        .update(copyMissingItems)
        .set({
          resolvedAt: now,
          resolvedByUserId: ctx.viewer.userId,
          resolution,
          ...stampUpdate(ctx),
        })
        .where(eq(copyMissingItems.id, id));
      await recordAudit(tx, ctx, {
        entityType: 'missing_item',
        entityId: id,
        action: 'update',
        changes: { resolution: [null, resolution], resolvedQuantity: [null, n] },
      });
      return;
    }
    // Partly resolved: the open row keeps the rest, and a resolved row records these.
    await tx
      .update(copyMissingItems)
      .set({ quantity: item.quantity - n, ...stampUpdate(ctx) })
      .where(eq(copyMissingItems.id, id));
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = item;
    const [done] = await tx
      .insert(copyMissingItems)
      .values({
        ...rest,
        quantity: n,
        resolvedAt: now,
        resolvedByUserId: ctx.viewer.userId,
        resolution,
        ...stampCreate(ctx),
      })
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'missing_item',
      entityId: id,
      action: 'update',
      changes: {
        quantity: [item.quantity, item.quantity - n],
        resolution: [null, resolution],
        resolvedQuantity: [null, n],
        resolvedRow: [null, done!.id],
      },
    });
  });
}

/** Removing a row entered by mistake is a real delete, with an audit row. */
export async function removeMissing(ctx: DataContext, id: string): Promise<boolean> {
  assertCanWrite(ctx);
  const item = await loadVisibleItem(ctx, id);
  if (!item) return false;
  await ctx.db.transaction(async (tx) => {
    await tx.delete(copyMissingItems).where(eq(copyMissingItems.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'missing_item',
      entityId: id,
      action: 'delete',
      changes: deletedFields({
        copyId: item.copyId,
        name: item.snapshotName ?? item.description,
        quantity: item.quantity,
      }),
    });
  });
  return true;
}

/** "Everything else is here": the copy's pieces were checked today. */
export async function markPiecesChecked(
  ctx: DataContext,
  copyId: string,
  /** The viewer's own calendar day (YYYY-MM-DD). The server's zone may differ from theirs. */
  day?: string,
): Promise<void> {
  assertCanWrite(ctx);
  if (!(await loadVisibleCopy(ctx, copyId))) throw new Error('Copy not found');
  const checked = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(new Date().toISOString().slice(0, 10))
    .parse(day);
  await ctx.db.transaction(async (tx) => {
    const [before] = await tx
      .select({ d: copies.piecesCheckedOn })
      .from(copies)
      .where(eq(copies.id, copyId));
    if (before?.d === checked) return;
    await tx
      .update(copies)
      .set({ piecesCheckedOn: checked, ...stampUpdate(ctx) })
      .where(eq(copies.id, copyId));
    await recordAudit(tx, ctx, {
      entityType: 'copy',
      entityId: copyId,
      action: 'update',
      changes: { piecesCheckedOn: [before?.d ?? null, checked] },
    });
  });
}
