import { desc, eq, sql } from 'drizzle-orm';

import type { Db } from '../db/client';
import { catalogFiles, catalogRuns, rbColors, rbParts, rbSets } from '../db/schema';
import { importAvailability, type Availability, type KnownFile } from './rules';

export type RunRow = typeof catalogRuns.$inferSelect;

export async function listRuns(db: Db, limit = 20): Promise<RunRow[]> {
  return db.select().from(catalogRuns).orderBy(desc(catalogRuns.startedAt)).limit(limit);
}

export async function getAvailability(db: Db, now = new Date()): Promise<Availability> {
  const runs = await db
    .select({
      status: catalogRuns.status,
      startedAt: catalogRuns.startedAt,
      finishedAt: catalogRuns.finishedAt,
    })
    .from(catalogRuns);
  return importAvailability(runs, now);
}

export class ImportUnavailableError extends Error {
  constructor(public availability: Exclude<Availability, { available: true }>) {
    super(
      availability.reason === 'running'
        ? 'An import is already running.'
        : `The last import finished recently. It can run again after ${availability.availableAt.toISOString()}.`,
    );
    this.name = 'ImportUnavailableError';
  }
}

/**
 * Creates the `running` row. The server enforces the 48-hour lock itself, whatever the UI showed,
 * and a partial unique index makes a second concurrent run impossible even in a race.
 */
export async function startRun(
  db: Db,
  input: { userId: string; source: 'pasted' | 'fetched'; now?: Date },
): Promise<string> {
  const now = input.now ?? new Date();
  const availability = await getAvailability(db, now);
  if (!availability.available) throw new ImportUnavailableError(availability);
  try {
    const [row] = await db
      .insert(catalogRuns)
      .values({
        startedAt: now,
        startedByUserId: input.userId,
        source: input.source,
        status: 'running',
      })
      .returning({ id: catalogRuns.id });
    return row!.id;
  } catch (e) {
    // The unique index fired: someone else started a run a moment ago.
    if (
      String((e as { message?: string }).message).includes('catalog_runs_one_running') ||
      (e as { code?: string }).code === '23505'
    ) {
      throw new ImportUnavailableError({ available: false, reason: 'running' });
    }
    throw e;
  }
}

export async function updateRun(
  db: Db,
  id: string,
  patch: Partial<typeof catalogRuns.$inferInsert>,
) {
  await db.update(catalogRuns).set(patch).where(eq(catalogRuns.id, id));
}

export async function addNote(db: Db, id: string, note: string) {
  await db
    .update(catalogRuns)
    .set({ notes: sql`${catalogRuns.notes} || ${JSON.stringify([note])}::jsonb` })
    .where(eq(catalogRuns.id, id));
}

export async function finishRun(db: Db, id: string, now = new Date()) {
  await db
    .update(catalogRuns)
    .set({ status: 'succeeded', finishedAt: now, step: null, error: null })
    .where(eq(catalogRuns.id, id));
}

export async function failRun(db: Db, id: string, error: string, now = new Date()) {
  await db
    .update(catalogRuns)
    .set({ status: 'failed', finishedAt: now, step: null, error: error.slice(0, 2000) })
    .where(eq(catalogRuns.id, id));
}

/** At server start: a run still marked running was cut off by a restart, so it failed. */
export async function markInterruptedRuns(db: Db, now = new Date()): Promise<number> {
  const rows = await db
    .update(catalogRuns)
    .set({
      status: 'failed',
      finishedAt: now,
      step: null,
      error: 'Interrupted: the server restarted.',
    })
    .where(eq(catalogRuns.status, 'running'))
    .returning({ id: catalogRuns.id });
  return rows.length;
}

export async function knownFiles(
  db: Db,
): Promise<Map<string, KnownFile & { etag: string | null; lastModified: string | null }>> {
  const rows = await db.select().from(catalogFiles);
  return new Map(
    rows.map((r) => [
      r.url,
      {
        url: r.url,
        remoteDate: r.remoteDate,
        fetchedAt: r.fetchedAt,
        extractedAt: r.extractedAt,
        etag: r.etag,
        lastModified: r.lastModified,
      },
    ]),
  );
}

export interface CatalogStatus {
  lastImportedAt: Date | null;
  /** Rebrickable's own "last updated" date for the catalog, from the page, when known. */
  catalogUpdated: Date | null;
  sets: number;
  parts: number;
  colors: number;
}

export async function catalogStatus(db: Db): Promise<CatalogStatus> {
  const [lastRun] = await db
    .select({ finishedAt: catalogRuns.finishedAt })
    .from(catalogRuns)
    .where(eq(catalogRuns.status, 'succeeded'))
    .orderBy(desc(catalogRuns.finishedAt))
    .limit(1);
  const [csv] = await db
    .select({ remoteDate: catalogFiles.remoteDate })
    .from(catalogFiles)
    .where(eq(catalogFiles.kind, 'csv_archive'))
    .limit(1);
  const count = async (table: typeof rbSets | typeof rbParts | typeof rbColors) => {
    const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(table);
    return r?.n ?? 0;
  };
  return {
    lastImportedAt: lastRun?.finishedAt ?? null,
    catalogUpdated: csv?.remoteDate ?? null,
    sets: await count(rbSets),
    parts: await count(rbParts),
    colors: await count(rbColors),
  };
}
