import { describe, expect, it } from 'vitest';

import type { DownloadsListing, LdrawLink } from './downloads-page';
import {
  changedLdraw,
  fetchedRecently,
  importAvailability,
  isStalePaste,
  nextFetchAllowed,
  planRun,
  sizeToBytes,
  type KnownFile,
  type RunSummary,
} from './rules';

const at = (s: string) => new Date(s);
const run = (status: RunSummary['status'], start: string, end: string | null): RunSummary => ({
  status,
  startedAt: at(start),
  finishedAt: end ? at(end) : null,
});

describe('importAvailability', () => {
  const now = at('2026-11-17T12:00:00Z');

  it('is available with no runs', () => {
    expect(importAvailability([], now)).toEqual({ available: true });
  });

  it('locks for 48 hours after the last successful run, to the minute', () => {
    const ok = run('succeeded', '2026-11-15T07:00:00Z', '2026-11-15T07:18:00Z');
    expect(importAvailability([ok], at('2026-11-16T12:00:00Z'))).toEqual({
      available: false,
      reason: 'locked',
      availableAt: at('2026-11-17T07:18:00Z'),
    });
  });

  it('is available once 48 hours have passed', () => {
    const ok = run('succeeded', '2026-11-15T07:00:00Z', '2026-11-15T07:18:00Z');
    expect(importAvailability([ok], at('2026-11-17T07:18:00Z'))).toEqual({ available: true });
    expect(importAvailability([ok], at('2026-11-17T07:17:59Z'))).toMatchObject({
      reason: 'locked',
    });
  });

  it('is not locked by a failed run, so it can be retried', () => {
    const failed = run('failed', '2026-11-17T11:00:00Z', '2026-11-17T11:05:00Z');
    expect(importAvailability([failed], now)).toEqual({ available: true });
  });

  it('uses the newest success, not the newest run', () => {
    const old = run('succeeded', '2026-11-01T00:00:00Z', '2026-11-01T00:10:00Z');
    const newer = run('succeeded', '2026-11-16T10:00:00Z', '2026-11-16T10:10:00Z');
    expect(importAvailability([old, newer], now)).toMatchObject({
      reason: 'locked',
      availableAt: at('2026-11-18T10:10:00Z'),
    });
  });

  it('is blocked while a run is in progress', () => {
    expect(importAvailability([run('running', '2026-11-17T11:59:00Z', null)], now)).toEqual({
      available: false,
      reason: 'running',
    });
  });
});

describe('per-URL limit', () => {
  const now = at('2026-11-17T12:00:00Z');
  const file = (fetchedAt: string | null): KnownFile => ({
    url: 'u',
    remoteDate: null,
    fetchedAt: fetchedAt ? at(fetchedAt) : null,
    extractedAt: null,
  });

  it('blocks a second fetch within 24 hours and says when it is allowed', () => {
    expect(fetchedRecently(file('2026-11-17T00:00:01Z'), now)).toBe(true);
    expect(nextFetchAllowed(file('2026-11-17T00:00:01Z'), now)).toEqual(at('2026-11-18T00:00:01Z'));
    expect(fetchedRecently(file('2026-11-16T12:00:00Z'), now)).toBe(false);
    expect(fetchedRecently(file(null), now)).toBe(false);
    expect(fetchedRecently(undefined, now)).toBe(false);
    expect(nextFetchAllowed(undefined, now)).toBeNull();
  });
});

const link = (colorId: number, date: string | null, size = '1.0 MB · ZIP'): LdrawLink => ({
  url: `https://cdn.rebrickable.com/media/downloads/ldraw/parts_${colorId}.zip`,
  colorId,
  colorName: `C${colorId}`,
  date: date ? at(date) : null,
  sizeText: size,
});

const known = (rows: [LdrawLink, string | null, string | null][]) =>
  new Map(
    rows.map(([l, remote, extracted]) => [
      l.url,
      {
        url: l.url,
        remoteDate: remote ? at(remote) : null,
        fetchedAt: null,
        extractedAt: extracted ? at(extracted) : null,
      } satisfies KnownFile,
    ]),
  );

describe('changedLdraw', () => {
  it('takes new colours, never-extracted ones and ones whose date moved forward', () => {
    const a = link(1, '2026-11-10');
    const b = link(2, '2026-11-10');
    const c = link(3, '2026-11-12');
    const d = link(4, '2026-11-10');
    const k = known([
      [b, '2026-11-10', '2026-11-11'], // unchanged
      [c, '2026-11-10', '2026-11-11'], // newer on the page
      [d, '2026-11-10', null], // downloaded but never extracted
    ]);
    expect(changedLdraw([a, b, c, d], k).map((l) => l.colorId)).toEqual([1, 3, 4]);
  });

  it('skips an extracted colour whose link has no date', () => {
    const a = link(1, null);
    const k = known([[a, null, '2026-11-11']]);
    expect(changedLdraw([a], k)).toEqual([]);
  });

  it('refetches when we never recorded the remote date', () => {
    const a = link(1, '2026-11-10');
    expect(changedLdraw([a], known([[a, null, '2026-11-11']])).length).toBe(1);
  });
});

describe('planRun and helpers', () => {
  it('sums sizes for the preview', () => {
    expect(sizeToBytes('1.4 MB · ZIP')).toBe(1_400_000);
    expect(sizeToBytes('220 MB')).toBe(220_000_000);
    expect(sizeToBytes('1.5 GB')).toBe(1_500_000_000);
    expect(sizeToBytes(null)).toBe(0);
    const listing: DownloadsListing = {
      csvArchive: {
        url: 'https://cdn.rebrickable.com/media/downloads/all_downloads.zip?1',
        updated: null,
      },
      schemaSvg: { url: 'https://rebrickable.com/static/img/diagrams/downloads_schema_v4.svg' },
      ldraw: [link(1, '2026-11-10', '2.0 MB · ZIP'), link(2, '2026-11-10', '3.0 MB · ZIP')],
      dropped: [],
      unknownZips: [],
      problems: [],
    };
    const plan = planRun(listing, new Map());
    expect(plan.ldrawToFetch).toHaveLength(2);
    expect(plan.ldrawBytes).toBe(5_000_000);
    expect(plan.ldrawUnchanged).toBe(0);
  });

  it('flags a stale paste only when the page is older than the last import', () => {
    expect(isStalePaste(at('2026-11-10'), at('2026-11-15'))).toBe(true);
    expect(isStalePaste(at('2026-11-16'), at('2026-11-15'))).toBe(false);
    expect(isStalePaste(null, at('2026-11-15'))).toBe(false);
    expect(isStalePaste(at('2026-11-10'), null)).toBe(false);
  });
});
