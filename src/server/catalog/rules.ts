import type { DownloadsListing, LdrawLink } from './downloads-page';

/**
 * Rebrickable's terms allow automated downloads at most once a day. These two limits are constants
 * in code, not settings, so nobody can break the terms by editing an environment file.
 */
export const IMPORT_LOCK_HOURS = 48;
export const URL_LIMIT_HOURS = 24;
const HOUR = 3_600_000;

export interface RunSummary {
  status: 'running' | 'succeeded' | 'failed';
  startedAt: Date;
  finishedAt: Date | null;
}

export type Availability =
  | { available: true }
  | { available: false; reason: 'running' }
  | { available: false; reason: 'locked'; availableAt: Date };

/**
 * Whether an import can start now. The lock starts at the last SUCCESSFUL run: a failed run does not
 * lock the button, so it can be retried (the per-URL limit still protects Rebrickable).
 */
export function importAvailability(runs: RunSummary[], now: Date): Availability {
  if (runs.some((r) => r.status === 'running')) return { available: false, reason: 'running' };
  const lastOk = runs
    .filter((r) => r.status === 'succeeded' && r.finishedAt)
    .map((r) => r.finishedAt!.getTime())
    .toSorted((a, b) => b - a)[0];
  if (lastOk !== undefined) {
    const availableAt = new Date(lastOk + IMPORT_LOCK_HOURS * HOUR);
    if (availableAt.getTime() > now.getTime())
      return { available: false, reason: 'locked', availableAt };
  }
  return { available: true };
}

export interface KnownFile {
  url: string;
  remoteDate: Date | null;
  fetchedAt: Date | null;
  extractedAt: Date | null;
}

/** True if this URL was fetched less than 24 hours ago, so fetching it again would break the limit. */
export function fetchedRecently(file: KnownFile | undefined, now: Date): boolean {
  if (!file?.fetchedAt) return false;
  return now.getTime() - file.fetchedAt.getTime() < URL_LIMIT_HOURS * HOUR;
}

/** When the URL may be fetched again, or null if it may be fetched now. */
export function nextFetchAllowed(file: KnownFile | undefined, now: Date): Date | null {
  if (!fetchedRecently(file, now)) return null;
  return new Date(file!.fetchedAt!.getTime() + URL_LIMIT_HOURS * HOUR);
}

/**
 * Only the LDraw ZIPs that changed: ones we never extracted, or whose page date is newer than the
 * date we last saw. A link with no date is downloaded only if we have never extracted it.
 */
export function changedLdraw(links: LdrawLink[], known: Map<string, KnownFile>): LdrawLink[] {
  return links.filter((l) => {
    const k = known.get(l.url);
    if (!k?.extractedAt) return true;
    if (l.date && (!k.remoteDate || l.date.getTime() > k.remoteDate.getTime())) return true;
    return false;
  });
}

export interface RunPlan {
  csvArchive: { url: string } | null;
  schemaSvg: { url: string } | null;
  ldrawToFetch: LdrawLink[];
  ldrawUnchanged: number;
  /** Rough total for the preview ("12 of 196 colour ZIPs changed (1.1 GB)"). */
  ldrawBytes: number;
}

const UNITS: Record<string, number> = { kb: 1e3, mb: 1e6, gb: 1e9 };

/** "14.8 MB · ZIP" to bytes, for the preview only. Unknown text counts as zero. */
export function sizeToBytes(text: string | null): number {
  const m = /(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i.exec(text ?? '');
  return m ? Math.round(Number(m[1]) * UNITS[m[2]!.toLowerCase()]!) : 0;
}

export function planRun(listing: DownloadsListing, known: Map<string, KnownFile>): RunPlan {
  const toFetch = changedLdraw(listing.ldraw, known);
  return {
    csvArchive: listing.csvArchive ? { url: listing.csvArchive.url } : null,
    schemaSvg: listing.schemaSvg ? { url: listing.schemaSvg.url } : null,
    ldrawToFetch: toFetch,
    ldrawUnchanged: listing.ldraw.length - toFetch.length,
    ldrawBytes: toFetch.reduce((n, l) => n + sizeToBytes(l.sizeText), 0),
  };
}

/** True when the pasted page's catalog date is older than the last import (a stale paste). */
export function isStalePaste(pageUpdated: Date | null, lastImportAt: Date | null): boolean {
  return Boolean(pageUpdated && lastImportAt && pageUpdated.getTime() < lastImportAt.getTime());
}
