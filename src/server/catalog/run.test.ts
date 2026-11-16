import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createWorld, type TestWorld } from '../data/test-helpers';
import {
  auditLog,
  catalogFiles,
  catalogPartImages,
  catalogRuns,
  rbParts,
  rbSets,
} from '../db/schema';
import { SVG, buildArchive, buildLdrawZip } from './archive-fixture';
import { catalogConfig, catalogPaths, type CatalogConfig } from './config';
import { parseDownloadsPage } from './downloads-page';
import { buildDownloadsPage, fixtureColors } from './fixtures';
import type { FetchLike } from './net';
import { executeRun, type RunDeps } from './run';
import {
  ImportUnavailableError,
  catalogStatus,
  getAvailability,
  listRuns,
  markInterruptedRuns,
  startRun,
} from './runs';

let w: TestWorld;
let dataDir: string;
let config: CatalogConfig;

beforeEach(async () => {
  w = await createWorld();
  dataDir = await mkdtemp(path.join(tmpdir(), 'bb-run-'));
  config = { ...catalogConfig({ DATA_DIR: dataDir }), userAgent: 'BrickBin/test' };
});
afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

const listing = (n = 120, date = '2026-11-10') =>
  parseDownloadsPage(buildDownloadsPage({ colors: fixtureColors(n, date) }), {
    pageUrl: 'https://rebrickable.com/downloads/',
    allowedOrigins: config.allowedOrigins,
  });

interface Mock {
  fetchImpl: FetchLike;
  calls: string[];
  failLdraw?: number;
  archive?: Buffer;
}

async function mockRebrickable(
  opts: { archive?: Buffer; ldrawStatus?: number } = {},
): Promise<Mock> {
  const calls: string[] = [];
  const archive = opts.archive ?? (await buildArchive());
  const ldraw = await buildLdrawZip();
  const mock: Mock = {
    calls,
    archive,
    fetchImpl: async (url) => {
      calls.push(url);
      if (url.includes('all_downloads.zip'))
        return new Response(new Uint8Array(mock.archive!), { headers: { etag: '"a1"' } });
      if (url.includes('downloads_schema')) return new Response(SVG);
      if (url.includes('/ldraw/')) {
        if (opts.ldrawStatus) return new Response('no', { status: opts.ldrawStatus });
        return new Response(new Uint8Array(ldraw), {
          headers: { etag: '"l1"', 'last-modified': 'Tue, 10 Nov 2026 00:00:00 GMT' },
        });
      }
      return new Response('nope', { status: 404 });
    },
  };
  return mock;
}

const actor = () => ({ householdId: w.admin.householdId, userId: w.admin.viewer.userId });
const deps = (mock: Mock, now = new Date('2026-11-16T12:00:00Z')): RunDeps => ({
  db: w.db,
  config,
  fetchImpl: mock.fetchImpl,
  now: () => now,
});

const begin = (now = new Date('2026-11-16T12:00:00Z')) =>
  startRun(w.db, { userId: w.admin.viewer.userId, source: 'pasted', now });

describe('a full import', () => {
  it('loads the catalog, extracts images, records files and audits the run', async () => {
    const mock = await mockRebrickable();
    const runId = await begin();
    await executeRun(deps(mock), runId, listing(), actor());

    const [run] = await w.db.select().from(catalogRuns).where(eq(catalogRuns.id, runId));
    expect(run).toMatchObject({
      status: 'succeeded',
      error: null,
      filesTotal: 122,
      filesDownloaded: 122,
    });
    expect(run!.rowsLoaded).toBeGreaterThan(20);
    expect(run!.notes.join(' ')).toMatch(/do not match a part number/); // 9999zz is not in rb_parts

    expect((await w.db.select().from(rbSets)).map((s) => s.setNum).toSorted()).toEqual([
      '10294-1',
      '42100-1',
    ]);
    expect((await w.db.select().from(rbParts)).length).toBe(3);

    const paths = catalogPaths(dataDir);
    expect((await readdir(path.join(paths.ldraw, '0'))).toSorted()).toEqual([
      '3001.png',
      '3023.png',
      '9999zz.png',
    ]);
    expect(await readFile(paths.schema, 'utf8')).toContain('<svg');
    // Neither the archive nor any colour ZIP is kept.
    expect(await readdir(paths.tmp)).toEqual([]);

    const images = await w.db.select().from(catalogPartImages);
    expect(images.length).toBe(120 * 3);
    const files = await w.db.select().from(catalogFiles);
    expect(files.filter((f) => f.kind === 'ldraw_zip' && f.extractedAt)).toHaveLength(120);
    expect(files.find((f) => f.kind === 'csv_archive')).toMatchObject({
      url: 'https://cdn.rebrickable.com/media/downloads/all_downloads.zip', // the cache-busting query is not part of the key
      etag: '"a1"',
    });

    const audits = await w.db.select().from(auditLog).where(eq(auditLog.entityId, runId));
    expect(audits).toHaveLength(1);
    expect(audits[0]!.entityType).toBe('catalog_run');

    const status = await catalogStatus(w.db);
    expect(status).toMatchObject({ sets: 2, parts: 3, colors: 3 });
    expect(status.lastImportedAt).not.toBeNull();
  });

  it('sends one request at a time with the user agent and only to allowed hosts', async () => {
    const mock = await mockRebrickable();
    await executeRun(deps(mock), await begin(), listing(), actor());
    expect(mock.calls.every((u) => /^https:\/\/(cdn\.)?rebrickable\.com\//.test(u))).toBe(true);
    expect(mock.calls[0]).toContain('all_downloads.zip?1731740339'); // the real link, query included
  });

  it('a second import after the lock only fetches changed colours', async () => {
    const first = await mockRebrickable();
    await executeRun(deps(first), await begin(), listing(120, '2026-11-10'), actor());

    const later = new Date('2026-11-18T13:00:00Z'); // past the 48h lock and the 24h URL limit
    const second = await mockRebrickable();
    const runId = await begin(later);
    // Three colours have a newer date on the page.
    const next = listing(120, '2026-11-10');
    for (const l of next.ldraw.slice(0, 3)) l.date = new Date('2026-11-17');
    await executeRun(deps(second, later), runId, next, actor());

    const ldrawCalls = second.calls.filter((u) => u.includes('/ldraw/'));
    expect(ldrawCalls).toHaveLength(3);
    const [run] = await w.db.select().from(catalogRuns).where(eq(catalogRuns.id, runId));
    expect(run).toMatchObject({ status: 'succeeded', filesSkipped: 117 });
  });
});

describe('failures leave the old catalog alone', () => {
  const seedOld = () => w.db.insert(rbSets).values({ setNum: 'OLD-1', name: 'Old set' });

  it('an archive missing a file fails the run before anything is swapped', async () => {
    await seedOld();
    const mock = await mockRebrickable({ archive: await buildArchive({ 'minifigs.csv': null }) });
    const runId = await begin();
    await executeRun(deps(mock), runId, listing(), actor());
    const [run] = await w.db.select().from(catalogRuns).where(eq(catalogRuns.id, runId));
    expect(run!.status).toBe('failed');
    expect(run!.error).toMatch(/missing: minifigs\.csv/);
    expect((await w.db.select().from(rbSets)).map((s) => s.setNum)).toEqual(['OLD-1']);
    expect(mock.calls.some((u) => u.includes('/ldraw/'))).toBe(false); // no image downloads after a bad archive
  });

  it('a bad row fails with the file and line, and drops the staging tables', async () => {
    await seedOld();
    const mock = await mockRebrickable({
      archive: await buildArchive({
        'sets.csv':
          'set_num,name,year,theme_id,num_parts,img_url\n1-1,Ok,2020,1,5,\n2-1,Bad,twenty,1,5,\n',
      }),
    });
    const runId = await begin();
    await executeRun(deps(mock), runId, listing(), actor());
    const [run] = await w.db.select().from(catalogRuns).where(eq(catalogRuns.id, runId));
    expect(run!.error).toMatch(/sets\.csv line 3: year is not a whole number/);
    expect((await w.db.select().from(rbSets)).map((s) => s.setNum)).toEqual(['OLD-1']);
    await expect(w.db.execute(`select 1 from rb_sets_next` as never)).rejects.toThrow();
  });

  it('a 429 stops the run and marks it failed; a failed run does not lock the button', async () => {
    const mock = await mockRebrickable({ ldrawStatus: 429 });
    const runId = await begin();
    await executeRun(deps(mock), runId, listing(), actor());
    const [run] = await w.db.select().from(catalogRuns).where(eq(catalogRuns.id, runId));
    expect(run!.status).toBe('failed');
    expect(run!.error).toMatch(/429/);
    expect(mock.calls.filter((u) => u.includes('/ldraw/'))).toHaveLength(1); // stopped at the first one
    expect(await getAvailability(w.db, new Date('2026-11-16T12:05:00Z'))).toEqual({
      available: true,
    });
  });

  it('a retry the same day reuses the downloaded archive instead of fetching it again', async () => {
    const failing = await mockRebrickable({ ldrawStatus: 503 });
    await executeRun(deps(failing), await begin(), listing(), actor());

    const retryAt = new Date('2026-11-16T13:00:00Z');
    const retry = await mockRebrickable();
    await executeRun(deps(retry, retryAt), await begin(retryAt), listing(), actor());
    // The archive and the diagram came from disk; only colour ZIPs went over the network.
    expect(retry.calls.some((u) => u.includes('all_downloads.zip'))).toBe(false);
    expect(retry.calls.some((u) => u.includes('downloads_schema'))).toBe(false);
    const [last] = (await listRuns(w.db)).slice(0, 1);
    expect(last!.status).toBe('succeeded');
  });

  it('refuses to refetch a file fetched less than a day ago when no copy is on disk', async () => {
    const first = await mockRebrickable({ archive: await buildArchive({ 'minifigs.csv': null }) });
    await executeRun(deps(first), await begin(), listing(), actor());
    await rm(catalogPaths(dataDir).tmp, { recursive: true, force: true }); // the saved archive is gone

    const retryAt = new Date('2026-11-16T14:00:00Z');
    const retry = await mockRebrickable();
    const runId = await begin(retryAt);
    await executeRun(deps(retry, retryAt), runId, listing(), actor());
    const [run] = await w.db.select().from(catalogRuns).where(eq(catalogRuns.id, runId));
    expect(run!.status).toBe('failed');
    expect(run!.error).toMatch(/allows one download a day/);
    expect(retry.calls).toEqual([]);
  });

  it('rejects a colour ZIP with unsafe entries without writing them', async () => {
    const mock = await mockRebrickable();
    const ldraw = await buildLdrawZip(['good']);
    const orig = mock.fetchImpl;
    mock.fetchImpl = async (url, init) =>
      url.includes('/ldraw/') ? new Response(new Uint8Array(ldraw)) : orig(url, init);
    const runId = await begin();
    await executeRun(deps(mock), runId, listing(), actor());
    const [run] = await w.db.select().from(catalogRuns).where(eq(catalogRuns.id, runId));
    expect(run!.status).toBe('succeeded');
    expect(await readdir(path.join(catalogPaths(dataDir).ldraw, '0'))).toEqual(['good.png']);
  });
});

describe('starting a run', () => {
  it('allows one running import at a time', async () => {
    await begin();
    await expect(begin()).rejects.toBeInstanceOf(ImportUnavailableError);
  });

  it('is locked for 48 hours after a success but not after a failure', async () => {
    const mock = await mockRebrickable({ ldrawStatus: 500 });
    await executeRun(deps(mock), await begin(), listing(), actor());
    await begin(new Date('2026-11-16T12:10:00Z')); // fine: the last run failed
    const ok = await mockRebrickable();
    await w.db.delete(catalogRuns);
    await executeRun(deps(ok), await begin(), listing(), actor());
    await expect(begin(new Date('2026-11-17T12:00:00Z'))).rejects.toThrow(/finished recently/);
    await expect(begin(new Date('2026-11-18T12:01:00Z'))).resolves.toBeTypeOf('string');
  });

  it('marks a run left running by a restart as failed', async () => {
    const runId = await begin();
    expect(await markInterruptedRuns(w.db)).toBe(1);
    const [run] = await w.db.select().from(catalogRuns).where(eq(catalogRuns.id, runId));
    expect(run).toMatchObject({ status: 'failed', error: 'Interrupted: the server restarted.' });
    expect(await markInterruptedRuns(w.db)).toBe(0);
    await stat(dataDir);
  });
});
