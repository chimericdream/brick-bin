import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createWorld, type TestWorld } from '../data/test-helpers';
import { catalogRuns } from '../db/schema';
import { SVG, buildArchive, buildLdrawZip } from './archive-fixture';
import { catalogConfig, type CatalogConfig } from './config';
import { buildDownloadsPage, fixtureColors } from './fixtures';
import { ImportRefusedError, previewImport, startImport, type ImportDeps } from './import';
import type { FetchLike } from './net';

let w: TestWorld;
let dir: string;
let config: CatalogConfig;

beforeEach(async () => {
  w = await createWorld();
  dir = await mkdtemp(path.join(tmpdir(), 'bb-import-'));
  config = { ...catalogConfig({ DATA_DIR: dir }), userAgent: 'BrickBin/test' };
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const page = (colors = fixtureColors(120), csvDate = '2026-11-15') =>
  buildDownloadsPage({ colors, csvDate });

async function rebrickable(): Promise<FetchLike> {
  const archive = await buildArchive();
  const ldraw = await buildLdrawZip();
  return async (url) => {
    if (url.includes('all_downloads.zip')) return new Response(new Uint8Array(archive));
    if (url.includes('downloads_schema')) return new Response(SVG);
    if (url.includes('/ldraw/')) return new Response(new Uint8Array(ldraw));
    if (url.endsWith('/downloads/')) return new Response(page());
    return new Response('no', { status: 404 });
  };
}

const waitForRun = async (id: string) => {
  for (let i = 0; i < 200; i++) {
    const [run] = await w.db.select().from(catalogRuns).where(eq(catalogRuns.id, id));
    if (run && run.status !== 'running') return run;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('The run did not finish');
};

describe('previewImport', () => {
  it('only admins can use it', async () => {
    await expect(previewImport(w.member, page(), { config })).rejects.toThrow(/admin/);
    await expect(previewImport(w.kid, page(), { config })).rejects.toThrow(/admin/);
  });

  it('summarises what a run would do', async () => {
    const preview = await previewImport(w.admin, page(), { config });
    expect(preview).toMatchObject({
      source: 'pasted',
      ldrawTotal: 120,
      ldrawChanged: 120,
      schemaSvg: true,
      dropped: 0,
      stale: false,
    });
    expect(preview.catalogUpdated).toEqual(new Date('2026-11-15'));
    expect(preview.ldrawBytes).toBeGreaterThan(0);
  });

  it('refuses a cut-off or unrelated paste and says what is missing', async () => {
    const cut = previewImport(w.admin, page(fixtureColors(30)), { config });
    await expect(cut).rejects.toBeInstanceOf(ImportRefusedError);
    await expect(cut).rejects.toMatchObject({
      problems: [expect.stringContaining('Only 30 LDraw')],
    });
    await expect(
      previewImport(w.admin, '<html><body>hi</body></html>', { config }),
    ).rejects.toMatchObject({
      problems: expect.arrayContaining([expect.stringContaining('all_downloads.zip')]),
    });
  });

  it('refuses a paste over 2 MB', async () => {
    await expect(
      previewImport(w.admin, 'x'.repeat(2 * 1024 * 1024 + 1), { config }),
    ).rejects.toMatchObject({
      code: 'too_large',
    });
  });

  it('does not fetch the page unless that is switched on', async () => {
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (u) => {
      calls.push(u);
      return new Response(page());
    };
    await expect(previewImport(w.admin, null, { config, fetchImpl })).rejects.toMatchObject({
      code: 'fetch_disabled',
    });
    expect(calls).toEqual([]);
  });

  it('fetches the page once when switched on, and not again within a day', async () => {
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (u) => {
      calls.push(u);
      return new Response(page());
    };
    const on = { ...config, pageFetch: true };
    const deps: ImportDeps = { config: on, fetchImpl, now: () => new Date('2026-11-16T12:00:00Z') };
    expect((await previewImport(w.admin, null, deps)).source).toBe('fetched');
    expect(calls).toEqual(['https://rebrickable.com/downloads/']);
    await expect(previewImport(w.admin, null, deps)).rejects.toMatchObject({ code: 'rate' });
    expect(calls).toHaveLength(1);
  });
});

describe('startImport', () => {
  it('returns at once and the run finishes in the background', async () => {
    const deps: ImportDeps = { config, fetchImpl: await rebrickable() };
    const runId = await startImport(w.admin, page(), {}, deps);
    expect(runId).toMatch(/^[0-9a-f-]{36}$/);
    const run = await waitForRun(runId);
    expect(run.status).toBe('succeeded');
    expect(run.source).toBe('pasted');
  });

  it('is locked for 48 hours after a success, enforced on the server', async () => {
    const deps: ImportDeps = { config, fetchImpl: await rebrickable() };
    await waitForRun(await startImport(w.admin, page(), {}, deps));
    await expect(startImport(w.admin, page(), {}, deps)).rejects.toMatchObject({
      code: 'unavailable',
    });
    await expect(previewImport(w.admin, page(), deps)).rejects.toMatchObject({
      code: 'unavailable',
    });
  });

  it('asks before using a page older than the last import', async () => {
    const fetchImpl = await rebrickable();
    const first: ImportDeps = { config, fetchImpl, now: () => new Date('2026-11-10T00:00:00Z') };
    await waitForRun(await startImport(w.admin, page(fixtureColors(120), '2026-11-09'), {}, first));
    const later: ImportDeps = { config, fetchImpl, now: () => new Date('2026-11-20T00:00:00Z') };
    // The page says the catalog was last updated on 8 Nov, before the 10 Nov import.
    const stale = page(fixtureColors(120), '2026-11-08');
    expect((await previewImport(w.admin, stale, later)).stale).toBe(true);
    await expect(startImport(w.admin, stale, {}, later)).rejects.toMatchObject({ code: 'stale' });
    const id = await startImport(w.admin, stale, { confirmStale: true }, later);
    expect((await waitForRun(id)).status).toBe('succeeded');
  });

  it('a bad page starts no run', async () => {
    await expect(startImport(w.admin, '<html></html>', {}, { config })).rejects.toBeInstanceOf(
      ImportRefusedError,
    );
    expect(await w.db.select().from(catalogRuns)).toEqual([]);
  });
});
