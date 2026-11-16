import type { DataContext } from '../data/context';
import { assertAdmin } from '../data/visibility';
import { catalogFiles } from '../db/schema';
import { catalogConfig, fileKey, type CatalogConfig } from './config';
import { MAX_PAGE_BYTES, parseDownloadsPage, type DownloadsListing } from './downloads-page';
import type { FetchLike } from './net';
import { executeRun } from './run';
import { catalogStatus, getAvailability, knownFiles, startRun } from './runs';
import { fetchedRecently, isStalePaste, nextFetchAllowed, planRun, type RunPlan } from './rules';

/** Thrown for things the admin can fix: a bad paste, a page that looks cut off, a stale page. */
export class ImportRefusedError extends Error {
  constructor(
    message: string,
    public problems: string[] = [],
    public code:
      | 'invalid'
      | 'stale'
      | 'unavailable'
      | 'too_large'
      | 'fetch_disabled'
      | 'rate' = 'invalid',
  ) {
    super(message);
    this.name = 'ImportRefusedError';
  }
}

export interface ImportDeps {
  config?: CatalogConfig;
  fetchImpl?: FetchLike;
  now?: () => Date;
}

export interface ImportPreview {
  source: 'pasted' | 'fetched';
  catalogUpdated: Date | null;
  schemaSvg: boolean;
  ldrawTotal: number;
  ldrawChanged: number;
  ldrawBytes: number;
  dropped: number;
  unknownZips: number;
  stale: boolean;
}

/** Gets the page's HTML: the one the admin pasted, or (only when switched on) a single fetch. */
async function loadPage(
  ctx: DataContext,
  html: string | null,
  config: CatalogConfig,
  deps: ImportDeps,
): Promise<{ html: string; source: 'pasted' | 'fetched' }> {
  if (html !== null) {
    if (html.length > MAX_PAGE_BYTES) {
      throw new ImportRefusedError(
        'The pasted page is larger than 2 MB. It is probably not the downloads page.',
        [],
        'too_large',
      );
    }
    return { html, source: 'pasted' };
  }
  if (!config.pageFetch) {
    throw new ImportRefusedError(
      'Fetching the page is switched off. Paste the downloads page instead.',
      [],
      'fetch_disabled',
    );
  }
  const now = (deps.now ?? (() => new Date()))();
  const key = fileKey(config.pageUrl);
  const known = (await knownFiles(ctx.db)).get(key);
  if (fetchedRecently(known, now)) {
    throw new ImportRefusedError(
      `The page was fetched less than a day ago. It can be fetched again after ${nextFetchAllowed(known, now)!.toISOString()}.`,
      [],
      'rate',
    );
  }
  const doFetch: FetchLike = deps.fetchImpl ?? ((u, i) => fetch(u, i));
  const res = await doFetch(config.pageUrl, {
    headers: { 'User-Agent': config.userAgent },
    redirect: 'error',
  });
  if (!res.ok) throw new ImportRefusedError(`Rebrickable's downloads page answered ${res.status}.`);
  const text = await res.text();
  await ctx.db
    .insert(catalogFiles)
    .values({ url: key, kind: 'downloads_page', fetchedAt: now })
    .onConflictDoUpdate({ target: catalogFiles.url, set: { fetchedAt: now } });
  return { html: text, source: 'fetched' };
}

async function parseAndCheck(
  ctx: DataContext,
  html: string | null,
  deps: ImportDeps,
): Promise<{
  listing: DownloadsListing;
  plan: RunPlan;
  source: 'pasted' | 'fetched';
  stale: boolean;
}> {
  assertAdmin(ctx);
  const config = deps.config ?? catalogConfig();
  const now = (deps.now ?? (() => new Date()))();

  const availability = await getAvailability(ctx.db, now);
  if (!availability.available) {
    throw new ImportRefusedError(
      availability.reason === 'running'
        ? 'An import is already running.'
        : `The last import finished recently. The next one can start after ${availability.availableAt.toISOString()}.`,
      [],
      'unavailable',
    );
  }

  const page = await loadPage(ctx, html, config, deps);
  const listing = parseDownloadsPage(page.html, {
    pageUrl: config.pageUrl,
    allowedOrigins: config.allowedOrigins,
  });
  // A page that looks cut off or changed fails here, before anything is downloaded or changed.
  if (listing.problems.length > 0) {
    throw new ImportRefusedError(
      'This does not look like the whole Rebrickable downloads page.',
      listing.problems,
    );
  }
  const status = await catalogStatus(ctx.db);
  return {
    listing,
    plan: planRun(listing, await knownFiles(ctx.db)),
    source: page.source,
    stale: isStalePaste(listing.csvArchive?.updated ?? null, status.lastImportedAt),
  };
}

/** What a run would do, without doing it: shown to the admin before they confirm. */
export async function previewImport(
  ctx: DataContext,
  html: string | null,
  deps: ImportDeps = {},
): Promise<ImportPreview> {
  const { listing, plan, source, stale } = await parseAndCheck(ctx, html, deps);
  return {
    source,
    catalogUpdated: listing.csvArchive?.updated ?? null,
    schemaSvg: plan.schemaSvg !== null,
    ldrawTotal: listing.ldraw.length,
    ldrawChanged: plan.ldrawToFetch.length,
    ldrawBytes: plan.ldrawBytes,
    dropped: listing.dropped.length,
    unknownZips: listing.unknownZips.length,
    stale,
  };
}

/**
 * Starts an import and returns at once; the run continues in this process. The 48-hour lock is
 * enforced here, whatever the page showed. A stale paste needs `confirmStale`.
 */
export async function startImport(
  ctx: DataContext,
  html: string | null,
  opts: { confirmStale?: boolean } = {},
  deps: ImportDeps = {},
): Promise<string> {
  const config = deps.config ?? catalogConfig();
  const { listing, source, stale } = await parseAndCheck(ctx, html, deps);
  if (stale && !opts.confirmStale) {
    throw new ImportRefusedError(
      'This page is older than your last import. Copy the page again, or confirm that you want to use it.',
      [],
      'stale',
    );
  }
  const runId = await startRun(ctx.db, { userId: ctx.viewer.userId, source, now: deps.now?.() });
  // Fire and forget: executeRun records its own failures and never throws.
  void executeRun(
    { db: ctx.db, config, fetchImpl: deps.fetchImpl, now: deps.now },
    runId,
    listing,
    { householdId: ctx.householdId, userId: ctx.viewer.userId },
  );
  return runId;
}
