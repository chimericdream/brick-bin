import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { setInstructions, sets } from '../db/schema';
import type { StoredPdf } from '../files';
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
import { assertCanWrite, setVisibilityCondition } from './visibility';

export type Instruction = typeof setInstructions.$inferSelect;

export class DuplicateInstructionError extends Error {
  constructor(public existingLabel: string) {
    super(`This PDF is already stored for this set as "${existingLabel}".`);
    this.name = 'DuplicateInstructionError';
  }
}

const labelInput = z.string().trim().min(1, 'Give it a name').max(120);

const linkInput = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    try {
      return ['http:', 'https:'].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, 'Enter a web address that starts with https://');

/** Live instructions of one visible set, in the order they were arranged. */
export async function listInstructions(ctx: DataContext, setId: string): Promise<Instruction[]> {
  if (!isUuid(setId)) return [];
  const rows = await ctx.db
    .select({ ins: setInstructions })
    .from(setInstructions)
    .innerJoin(sets, eq(sets.id, setInstructions.setId))
    .where(
      and(
        eq(setInstructions.setId, setId),
        eq(setInstructions.householdId, ctx.householdId),
        isNull(setInstructions.deletedAt),
        setVisibilityCondition(ctx),
      ),
    )
    .orderBy(
      asc(setInstructions.sortOrder),
      asc(setInstructions.createdAt),
      asc(setInstructions.id),
    );
  return rows.map((r) => r.ins);
}

/**
 * One instruction this viewer may open: live, in this household, and on a set they can see. A hidden
 * set's PDF answers exactly like an unknown id.
 */
export async function getInstruction(ctx: DataContext, id: string): Promise<Instruction | null> {
  if (!isUuid(id)) return null;
  const [row] = await ctx.db
    .select({ ins: setInstructions })
    .from(setInstructions)
    .innerJoin(sets, eq(sets.id, setInstructions.setId))
    .where(
      and(
        eq(setInstructions.id, id),
        eq(setInstructions.householdId, ctx.householdId),
        isNull(setInstructions.deletedAt),
        setVisibilityCondition(ctx),
      ),
    );
  return row?.ins ?? null;
}

async function nextOrder(tx: DataContext['db'], setId: string): Promise<number> {
  const [row] = await tx
    .select({ max: sql<number>`coalesce(max(${setInstructions.sortOrder}), -1)::int` })
    .from(setInstructions)
    .where(and(eq(setInstructions.setId, setId), isNull(setInstructions.deletedAt)));
  return (row?.max ?? -1) + 1;
}

async function assertVisibleSet(ctx: DataContext, setId: string) {
  const [set] = await ctx.db
    .select({ id: sets.id })
    .from(sets)
    .where(and(eq(sets.id, setId), setVisibilityCondition(ctx)));
  if (!set) throw new Error('Set not found');
}

/**
 * Records a PDF that is already on disk. Returns the row. If the same bytes are already stored for
 * this set (live), throws and leaves the file alone, because both rows would share one path.
 */
export async function addFileInstruction(
  ctx: DataContext,
  setId: string,
  input: { label: string; stored: StoredPdf; sourceUrl?: string | null },
): Promise<Instruction> {
  assertCanWrite(ctx);
  const label = labelInput.parse(input.label);
  await assertVisibleSet(ctx, setId);
  return ctx.db.transaction(async (tx) => {
    const [dupe] = await tx
      .select({ label: setInstructions.label })
      .from(setInstructions)
      .where(
        and(
          eq(setInstructions.setId, setId),
          eq(setInstructions.sha256, input.stored.sha256),
          isNull(setInstructions.deletedAt),
        ),
      );
    if (dupe) throw new DuplicateInstructionError(dupe.label);
    const [row] = await tx
      .insert(setInstructions)
      .values({
        householdId: ctx.householdId,
        setId,
        kind: 'file',
        label,
        filePath: input.stored.relPath,
        fileBytes: input.stored.bytes,
        sha256: input.stored.sha256,
        sourceUrl: input.sourceUrl ?? null,
        sortOrder: await nextOrder(tx, setId),
        ...stampCreate(ctx),
      })
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'instruction',
      entityId: row!.id,
      action: 'create',
      changes: createdFields({
        setId,
        kind: 'file',
        label,
        fileBytes: row!.fileBytes,
        sourceUrl: row!.sourceUrl,
      }),
    });
    return row!;
  });
}

export async function addLinkInstruction(
  ctx: DataContext,
  setId: string,
  input: { label: string; url: string },
): Promise<Instruction> {
  assertCanWrite(ctx);
  const label = labelInput.parse(input.label);
  const url = linkInput.parse(input.url);
  await assertVisibleSet(ctx, setId);
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(setInstructions)
      .values({
        householdId: ctx.householdId,
        setId,
        kind: 'link',
        label,
        url,
        sortOrder: await nextOrder(tx, setId),
        ...stampCreate(ctx),
      })
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'instruction',
      entityId: row!.id,
      action: 'create',
      changes: createdFields({ setId, kind: 'link', label, url }),
    });
    return row!;
  });
}

export async function renameInstruction(ctx: DataContext, id: string, rawLabel: string) {
  assertCanWrite(ctx);
  const label = labelInput.parse(rawLabel);
  const before = await getInstruction(ctx, id);
  if (!before) throw new Error('Instructions not found');
  const changes = diffFields({ label: before.label }, { label });
  if (Object.keys(changes).length === 0) return before;
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .update(setInstructions)
      .set({ label, ...stampUpdate(ctx) })
      .where(eq(setInstructions.id, id))
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'instruction',
      entityId: id,
      action: 'update',
      changes,
    });
    return row!;
  });
}

/** Moves one instruction up or down by swapping its place with its neighbour's. */
export async function moveInstruction(ctx: DataContext, id: string, direction: 'up' | 'down') {
  assertCanWrite(ctx);
  const target = await getInstruction(ctx, id);
  if (!target) throw new Error('Instructions not found');
  const list = await listInstructions(ctx, target.setId);
  const i = list.findIndex((x) => x.id === id);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return;
  const order = list.map((x) => x.id);
  [order[i], order[j]] = [order[j]!, order[i]!];
  await ctx.db.transaction(async (tx) => {
    for (const [index, itemId] of order.entries()) {
      await tx
        .update(setInstructions)
        .set({ sortOrder: index })
        .where(eq(setInstructions.id, itemId));
    }
    await recordAudit(tx, ctx, {
      entityType: 'instruction',
      entityId: id,
      action: 'update',
      changes: { sortOrder: [i, j] },
    });
  });
}

/** Moves to the trash. The file stays on disk until the row is purged. */
export async function trashInstruction(ctx: DataContext, id: string): Promise<boolean> {
  assertCanWrite(ctx);
  const before = await getInstruction(ctx, id);
  if (!before) return false;
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(setInstructions)
      .set({ ...stampTrash(ctx), ...stampUpdate(ctx) })
      .where(eq(setInstructions.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'instruction',
      entityId: id,
      action: 'delete',
      changes: trashedFields({ label: before.label, setId: before.setId }),
    });
  });
  return true;
}

/** How many live instructions each set has, for the library tiles and filter. */
export async function instructionCounts(
  ctx: DataContext,
  setIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (setIds.length === 0) return out;
  const rows = await ctx.db
    .select({ setId: setInstructions.setId, n: sql<number>`count(*)::int` })
    .from(setInstructions)
    .where(
      and(
        eq(setInstructions.householdId, ctx.householdId),
        isNull(setInstructions.deletedAt),
        sql`${setInstructions.setId} in ${setIds}`,
      ),
    )
    .groupBy(setInstructions.setId);
  for (const r of rows) out.set(r.setId, r.n);
  return out;
}
