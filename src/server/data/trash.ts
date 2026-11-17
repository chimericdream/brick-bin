import { and, eq, inArray, isNotNull, lt, sql } from 'drizzle-orm';

import type { Db } from '../db/client';
import { auditLog, copies, locations, setInstructions, sets, users } from '../db/schema';
import { deletedFields, recordAudit, restoredFields, stampUpdate } from './audit';
import type { DataContext } from './context';
import { isUuid } from './ids';
import { assertNotRestricted, isAdmin } from './visibility';

/**
 * The trash. Every "delete" in the app is a soft delete: the row keeps its data but is hidden
 * (`deleted_at` is set) until someone restores it, an admin deletes it for good, or it has been
 * in the trash longer than the retention period.
 *
 * Who can do what: the person who deleted something can restore it; admins can restore anything
 * and are the only ones who can delete permanently. Instructions and wishlist items join the
 * `TRASH_KINDS` list with their own tables (Phases 6 and 10).
 */
export const TRASH_KINDS = ['set', 'copy', 'location', 'instruction'] as const;
export type TrashKind = (typeof TRASH_KINDS)[number];

export const isTrashKind = (v: unknown): v is TrashKind =>
  typeof v === 'string' && (TRASH_KINDS as readonly string[]).includes(v);

// Every trashable table has the same columns, so one table type stands in for all of them.
const TABLES = {
  set: sets,
  copy: copies,
  location: locations,
  instruction: setInstructions,
} as const;
const table = (kind: TrashKind) => TABLES[kind] as typeof sets;

export const DEFAULT_RETENTION_DAYS = 30;

/** Days an item stays in the trash before it is purged. `0` keeps everything until an admin acts. */
export function retentionDays(env: Record<string, string | undefined> = process.env): number {
  const raw = env.TRASH_RETENTION_DAYS?.trim();
  if (!raw) return DEFAULT_RETENTION_DAYS;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_RETENTION_DAYS;
}

/** When an item deleted at `deletedAt` is purged automatically, or null if that is switched off. */
export function purgeDate(deletedAt: Date, days = retentionDays()): Date | null {
  return days > 0 ? new Date(deletedAt.getTime() + days * 86_400_000) : null;
}

export interface TrashItem {
  kind: TrashKind;
  id: string;
  title: string;
  detail: string | null;
  deletedAt: Date;
  deletedByName: string | null;
  /** The viewer may bring it back (they deleted it, or they are an admin). */
  canRestore: boolean;
}

const who = (t: typeof sets) => ({
  deletedAt: t.deletedAt,
  deletedBy: t.deletedByUserId,
  deletedByName: users.name,
});

/**
 * What is in the trash, most recently deleted first. Admins see everything; everyone else sees
 * only what they deleted themselves. Restricted profiles have no trash.
 */
export async function listTrash(ctx: DataContext): Promise<TrashItem[]> {
  assertNotRestricted(ctx, 'the trash');
  const mine = (t: typeof sets) =>
    and(
      eq(t.householdId, ctx.householdId),
      isNotNull(t.deletedAt),
      isAdmin(ctx) ? undefined : eq(t.deletedByUserId, ctx.viewer.userId),
    );

  const [setRows, copyRows, locationRows, instructionRows] = await Promise.all([
    ctx.db
      .select({ id: sets.id, name: sets.name, setNumber: sets.setNumber, ...who(sets) })
      .from(sets)
      .leftJoin(users, eq(users.id, sets.deletedByUserId))
      .where(mine(sets)),
    ctx.db
      .select({
        id: copies.id,
        name: sets.name,
        setDeleted: sets.deletedAt,
        ...who(copies as unknown as typeof sets),
      })
      .from(copies)
      .innerJoin(sets, eq(sets.id, copies.setId))
      .leftJoin(users, eq(users.id, copies.deletedByUserId))
      .where(mine(copies as unknown as typeof sets)),
    ctx.db
      .select({
        id: locations.id,
        name: locations.name,
        ...who(locations as unknown as typeof sets),
      })
      .from(locations)
      .leftJoin(users, eq(users.id, locations.deletedByUserId))
      .where(mine(locations as unknown as typeof sets)),
    ctx.db
      .select({
        id: setInstructions.id,
        name: setInstructions.label,
        setName: sets.name,
        setDeleted: sets.deletedAt,
        ...who(setInstructions as unknown as typeof sets),
      })
      .from(setInstructions)
      .innerJoin(sets, eq(sets.id, setInstructions.setId))
      .leftJoin(users, eq(users.id, setInstructions.deletedByUserId))
      .where(mine(setInstructions as unknown as typeof sets)),
  ]);

  const item = (
    kind: TrashKind,
    r: {
      id: string;
      deletedAt: Date | null;
      deletedBy: string | null;
      deletedByName: string | null;
    },
    title: string,
    detail: string | null,
  ): TrashItem => ({
    kind,
    id: r.id,
    title,
    detail,
    deletedAt: r.deletedAt!,
    deletedByName: r.deletedByName,
    canRestore: isAdmin(ctx) || r.deletedBy === ctx.viewer.userId,
  });

  return [
    ...setRows.map((r) => item('set', r, r.name, r.setNumber ? `Set ${r.setNumber}` : 'Set')),
    ...copyRows.map((r) =>
      item(
        'copy',
        r,
        r.name,
        ['Copy', r.setDeleted ? 'set is in the trash' : null].filter(Boolean).join(' · '),
      ),
    ),
    ...locationRows.map((r) => item('location', r, r.name, 'Place')),
    ...instructionRows.map((r) =>
      item(
        'instruction',
        r,
        r.name,
        ['Instructions', r.setName, r.setDeleted ? 'set is in the trash' : null]
          .filter(Boolean)
          .join(' · '),
      ),
    ),
  ].toSorted((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime() || a.id.localeCompare(b.id));
}

/** The fields that name a row in the activity feed. */
function labelFields(kind: TrashKind, row: Record<string, unknown>): Record<string, unknown> {
  switch (kind) {
    case 'set':
      return { name: row.name, setNumber: row.setNumber };
    case 'copy':
      return { setId: row.setId, buildState: row.buildState };
    case 'location':
      return { name: row.name, parentId: row.parentId };
    case 'instruction':
      return { label: row.label, setId: row.setId };
  }
}

export type RestoreResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      /** The caller may retry with `withoutLocation`. */ canDropLocation?: boolean;
    };

/**
 * Brings something back from the trash. A copy needs its set back first, and its place (or
 * `withoutLocation: true` to restore it with no place); a place needs the place it sits in.
 * Otherwise it would reappear hanging off something that is still deleted.
 */
export async function restoreTrashed(
  ctx: DataContext,
  kind: TrashKind,
  id: string,
  opts: { withoutLocation?: boolean } = {},
): Promise<RestoreResult> {
  assertNotRestricted(ctx, 'the trash');
  const gone: RestoreResult = { ok: false, error: 'That is no longer in the trash.' };
  if (!isUuid(id)) return gone;
  const t = table(kind);
  return ctx.db.transaction(async (tx): Promise<RestoreResult> => {
    const [row] = await tx
      .select()
      .from(t)
      .where(and(eq(t.id, id), eq(t.householdId, ctx.householdId), isNotNull(t.deletedAt)));
    if (!row) return gone;
    if (!isAdmin(ctx) && row.deletedByUserId !== ctx.viewer.userId) {
      return { ok: false, error: 'Only an admin can restore something someone else deleted.' };
    }

    const r = row as unknown as Record<string, unknown>;
    let dropLocation = false;
    if (kind === 'copy') {
      const [set] = await tx
        .select({ deletedAt: sets.deletedAt })
        .from(sets)
        .where(eq(sets.id, r.setId as string));
      if (set?.deletedAt) return { ok: false, error: 'Restore the set first.' };
      if (r.locationId) {
        const [place] = await tx
          .select({ deletedAt: locations.deletedAt })
          .from(locations)
          .where(eq(locations.id, r.locationId as string));
        if (place?.deletedAt) {
          if (!opts.withoutLocation) {
            return {
              ok: false,
              error: 'Restore the place it was kept in first, or restore it without a place.',
              canDropLocation: true,
            };
          }
          dropLocation = true;
        }
      }
    }
    if (kind === 'instruction') {
      const [set] = await tx
        .select({ deletedAt: sets.deletedAt })
        .from(sets)
        .where(eq(sets.id, r.setId as string));
      if (set?.deletedAt) return { ok: false, error: 'Restore the set first.' };
      if (r.sha256) {
        const [same] = await tx
          .select({ label: setInstructions.label })
          .from(setInstructions)
          .where(
            and(
              eq(setInstructions.setId, r.setId as string),
              eq(setInstructions.sha256, r.sha256 as string),
              sql`${setInstructions.deletedAt} is null`,
            ),
          );
        if (same) {
          return { ok: false, error: `This PDF is already stored for the set as "${same.label}".` };
        }
      }
    }
    if (kind === 'location' && r.parentId) {
      const [parent] = await tx
        .select({ deletedAt: locations.deletedAt })
        .from(locations)
        .where(eq(locations.id, r.parentId as string));
      if (parent?.deletedAt) return { ok: false, error: 'Restore the place it sits in first.' };
    }

    await tx
      .update(t)
      .set({
        deletedAt: null,
        deletedByUserId: null,
        ...(dropLocation ? { locationId: null } : {}),
        ...stampUpdate(ctx),
      } as Partial<typeof sets.$inferInsert>)
      .where(eq(t.id, id));
    await recordAudit(tx, ctx, {
      entityType: kind,
      entityId: id,
      action: 'update',
      changes: {
        ...restoredFields(labelFields(kind, r)),
        ...(dropLocation ? { locationId: [r.locationId, null] as [unknown, unknown] } : {}),
      },
    });
    return { ok: true };
  });
}

export type PurgeResult =
  | { ok: true; /** Stored files to remove now that the row is gone. */ files: string[] }
  | { ok: false; error: string };

/**
 * Admin only: permanently deletes something that is already in the trash. A set takes its trashed
 * copies with it. File paths are returned so the caller removes them only after the delete
 * commits (never delete a file a live row points at).
 */
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Stored PDFs that go with sets about to be deleted (their instruction rows disappear with them). */
async function instructionFilesOfSets(tx: Tx, setIds: string[]): Promise<string[]> {
  if (setIds.length === 0) return [];
  const rows = await tx
    .select({ path: setInstructions.filePath })
    .from(setInstructions)
    .where(inArray(setInstructions.setId, setIds));
  return rows.flatMap((r) => (r.path ? [r.path] : []));
}

/**
 * Of these candidate files, the ones no remaining row points at. Two rows can share one PDF (an
 * upload, a trashed copy, and the same upload again), so a file is only safe to delete once no row
 * uses it. Never delete a file a live row points at.
 */
async function unreferenced(tx: Tx, candidates: string[]): Promise<string[]> {
  const unique = [...new Set(candidates)];
  if (unique.length === 0) return [];
  const used = await tx
    .select({ path: setInstructions.filePath })
    .from(setInstructions)
    .where(inArray(setInstructions.filePath, unique));
  const inUse = new Set(used.map((u) => u.path));
  return unique.filter((f) => !inUse.has(f));
}

export async function purgeTrashed(
  ctx: DataContext,
  kind: TrashKind,
  id: string,
): Promise<PurgeResult> {
  if (!isAdmin(ctx)) throw new Error('Only an admin can delete permanently');
  if (!isUuid(id)) return { ok: false, error: 'That is no longer in the trash.' };
  const t = table(kind);
  return ctx.db.transaction(async (tx): Promise<PurgeResult> => {
    // A set takes its instruction rows with it, so note their files before the rows go.
    const candidates: string[] = [];
    const [pending] = await tx
      .select({ id: t.id })
      .from(t)
      .where(and(eq(t.id, id), eq(t.householdId, ctx.householdId), isNotNull(t.deletedAt)));
    if (pending && kind === 'set') candidates.push(...(await instructionFilesOfSets(tx, [id])));

    const [row] = await tx
      .delete(t)
      .where(and(eq(t.id, id), eq(t.householdId, ctx.householdId), isNotNull(t.deletedAt)))
      .returning();
    if (!row) return { ok: false, error: 'That is no longer in the trash.' };
    const r = row as unknown as Record<string, unknown>;
    await recordAudit(tx, ctx, {
      entityType: kind,
      entityId: id,
      action: 'delete',
      changes: { ...deletedFields(labelFields(kind, r)), permanent: [null, true] },
    });
    if (kind === 'instruction' && typeof r.filePath === 'string') candidates.push(r.filePath);
    const files = await unreferenced(tx, candidates);
    if (kind === 'set' && typeof r.coverImage === 'string') files.push(r.coverImage);
    return { ok: true, files };
  });
}

/**
 * Permanently deletes everything that has been in the trash longer than the retention period, in
 * every household. Returns how many rows went and the files that no longer have a row.
 */
export async function purgeExpiredTrash(
  db: Db,
  now = new Date(),
  days = retentionDays(),
): Promise<{ purged: number; files: string[] }> {
  if (days <= 0) return { purged: 0, files: [] };
  const cutoff = new Date(now.getTime() - days * 86_400_000);
  return db.transaction(async (tx) => {
    let purged = 0;
    const files: string[] = [];
    const candidates: string[] = [];
    // Sets about to go take their instruction rows with them.
    const dying = await tx
      .select({ id: sets.id })
      .from(sets)
      .where(and(isNotNull(sets.deletedAt), lt(sets.deletedAt, cutoff)));
    candidates.push(
      ...(await instructionFilesOfSets(
        tx,
        dying.map((d) => d.id),
      )),
    );

    // Children before parents, so each trashed row is counted and audited on its own.
    const order: TrashKind[] = ['instruction', 'copy', 'set', 'location'];
    for (const kind of order) {
      const t = table(kind);
      const rows = await tx
        .delete(t)
        .where(and(isNotNull(t.deletedAt), lt(t.deletedAt, cutoff)))
        .returning();
      for (const row of rows) {
        const r = row as unknown as Record<string, unknown>;
        purged++;
        if (kind === 'set' && typeof r.coverImage === 'string') files.push(r.coverImage);
        if (kind === 'instruction' && typeof r.filePath === 'string') candidates.push(r.filePath);
        await tx.insert(auditLog).values({
          householdId: row.householdId,
          actorUserId: null,
          entityType: kind,
          entityId: row.id,
          action: 'delete',
          changes: {
            ...deletedFields(labelFields(kind, r)),
            permanent: [null, true],
            automatic: [null, true],
          },
        });
      }
    }
    files.push(...(await unreferenced(tx, candidates)));
    return { purged, files };
  });
}
