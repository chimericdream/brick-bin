import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { copies, locations, sets } from '../db/schema';
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
import { assertCanWrite, copyVisibilityCondition } from './visibility';

export async function listLocations(ctx: DataContext) {
  return ctx.db
    .select()
    .from(locations)
    .where(and(eq(locations.householdId, ctx.householdId), isNull(locations.deletedAt)))
    .orderBy(asc(locations.name));
}

type Loc = Awaited<ReturnType<typeof listLocations>>[number];

/** Groups by parent; an orphan (parent missing or trashed) is treated as a root so it never disappears. */
function childrenMap(locs: Loc[]) {
  const ids = new Set(locs.map((l) => l.id));
  const children = new Map<string | null, Loc[]>();
  for (const l of locs) {
    const key = l.parentId && ids.has(l.parentId) ? l.parentId : null;
    children.set(key, [...(children.get(key) ?? []), l]);
  }
  return children;
}

/** Locations as picker options: "Attic › Shelf 1" labels, ordered as a tree. */
export async function listLocationOptions(
  ctx: DataContext,
): Promise<{ value: string; label: string }[]> {
  const children = childrenMap(await listLocations(ctx));
  const out: { value: string; label: string }[] = [];
  const walk = (parent: string | null, prefix: string) => {
    for (const l of children.get(parent) ?? []) {
      const label = prefix ? `${prefix} › ${l.name}` : l.name;
      out.push({ value: l.id, label });
      walk(l.id, label);
    }
  };
  walk(null, '');
  return out;
}

export interface LocationWithCounts {
  id: string;
  name: string;
  parentId: string | null;
  /** Copies kept directly here. */
  copies: number;
  /** Copies here and anywhere underneath. */
  total: number;
}

/**
 * Every location with how many copies it holds, in tree order. Counts only include copies this
 * viewer may see, so a restricted profile never learns that hidden sets exist.
 */
export async function listLocationsWithCounts(ctx: DataContext): Promise<LocationWithCounts[]> {
  const [locs, counts] = await Promise.all([
    listLocations(ctx),
    ctx.db
      .select({ locationId: copies.locationId, n: sql<number>`count(*)::int` })
      .from(copies)
      .innerJoin(sets, eq(sets.id, copies.setId))
      .where(copyVisibilityCondition(ctx))
      .groupBy(copies.locationId),
  ]);
  const direct = new Map(counts.map((c) => [c.locationId, c.n]));
  const children = childrenMap(locs);
  const out: LocationWithCounts[] = [];
  const walk = (parent: string | null): number => {
    let sum = 0;
    for (const l of children.get(parent) ?? []) {
      const index = out.length;
      out.push({
        id: l.id,
        name: l.name,
        parentId: l.parentId,
        copies: direct.get(l.id) ?? 0,
        total: 0,
      });
      const below = walk(l.id);
      out[index]!.total = (direct.get(l.id) ?? 0) + below;
      sum += out[index]!.total;
    }
    return sum;
  };
  walk(null);
  return out;
}

const nameInput = z.string().trim().min(1).max(100);

async function assertParent(
  ctx: DataContext,
  parentId: string | null | undefined,
  selfId?: string,
) {
  if (!parentId) return;
  if (parentId === selfId) throw new Error('A place cannot sit inside itself');
  const byId = new Map((await listLocations(ctx)).map((l) => [l.id, l]));
  if (!byId.has(parentId)) throw new Error('Unknown parent location');
  // Walk up from the new parent: reaching `selfId` would make a loop.
  for (let cur = byId.get(parentId); cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) {
    if (cur.id === selfId) throw new Error('A place cannot sit inside one of its own sub-places');
  }
}

export async function createLocation(ctx: DataContext, name: string, parentId?: string | null) {
  assertCanWrite(ctx);
  const parsed = nameInput.parse(name);
  await assertParent(ctx, parentId);
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(locations)
      .values({
        householdId: ctx.householdId,
        name: parsed,
        parentId: parentId ?? null,
        ...stampCreate(ctx),
      })
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'location',
      entityId: row!.id,
      action: 'create',
      changes: createdFields({ name: row!.name, parentId: row!.parentId }),
    });
    return row!;
  });
}

export async function updateLocation(
  ctx: DataContext,
  id: string,
  patch: { name: string; parentId?: string | null },
) {
  assertCanWrite(ctx);
  const name = nameInput.parse(patch.name);
  await assertParent(ctx, patch.parentId, id);
  return ctx.db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.id, id),
          eq(locations.householdId, ctx.householdId),
          isNull(locations.deletedAt),
        ),
      );
    if (!before) throw new Error('Place not found');
    const next = {
      name,
      parentId: patch.parentId === undefined ? before.parentId : patch.parentId,
    };
    const changes = diffFields(before, next);
    if (Object.keys(changes).length === 0) return before;
    const [row] = await tx
      .update(locations)
      .set({ ...next, ...stampUpdate(ctx) })
      .where(eq(locations.id, id))
      .returning();
    await recordAudit(tx, ctx, { entityType: 'location', entityId: id, action: 'update', changes });
    return row!;
  });
}

export type DeleteLocationResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'has_copies'; copies: number }
  | { ok: false; reason: 'has_children'; children: number };

/**
 * Moves an empty location to the trash. One that holds copies (directly or underneath) or has
 * sub-places is never deleted, so nothing silently loses its place.
 */
export async function deleteLocation(ctx: DataContext, id: string): Promise<DeleteLocationResult> {
  assertCanWrite(ctx);
  const all = await listLocations(ctx);
  const loc = all.find((l) => l.id === id);
  if (!loc) return { ok: false, reason: 'not_found' };
  const children = all.filter((l) => l.parentId === id).length;
  if (children > 0) return { ok: false, reason: 'has_children', children };
  return ctx.db.transaction(async (tx) => {
    // Counted without the visibility filter: a hidden set's copy must also block the delete.
    const [held] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(copies)
      .where(and(eq(copies.locationId, id), isNull(copies.deletedAt)));
    if (held && held.n > 0) return { ok: false, reason: 'has_copies', copies: held.n } as const;
    await tx
      .update(locations)
      .set({ ...stampTrash(ctx), ...stampUpdate(ctx) })
      .where(eq(locations.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'location',
      entityId: id,
      action: 'delete',
      changes: trashedFields({ name: loc.name }),
    });
    return { ok: true } as const;
  });
}
