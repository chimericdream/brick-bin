import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { isAllowedUrl } from './origins';

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** Thrown when Rebrickable pushes back (429 or a server error). The run stops and is marked failed. */
export class RateLimitedError extends Error {
  constructor(
    public status: number,
    url: string,
  ) {
    super(`Rebrickable answered ${status} for ${url}. The import stopped; try again later.`);
    this.name = 'RateLimitedError';
  }
}

export interface DownloadOptions {
  fetchImpl?: FetchLike;
  userAgent: string;
  allowedOrigins: string[];
  timeoutMs?: number;
  /** For conditional requests. */
  ifModifiedSince?: string | null;
  ifNoneMatch?: string | null;
  maxBytes?: number;
  onBytes?: (n: number) => void;
}

export type DownloadResult =
  | { status: 'ok'; bytes: number; etag: string | null; lastModified: string | null }
  | { status: 'not-modified' };

const MAX_REDIRECTS = 3;

/** The origin check applies to the first request and to every redirect hop. */
function assertAllowed(url: string, allowed: string[]): URL {
  const u = new URL(url);
  if (!isAllowedUrl(u, allowed)) {
    throw new Error(`Refusing to download from ${u.origin}: it is not an allowed origin.`);
  }
  return u;
}

/**
 * Downloads one file to disk, streaming, one request at a time. The file appears at `dest` only
 * when complete (written to a `.part` file first). Redirects are followed by hand and each hop is
 * checked against the allowed origins.
 */
export async function downloadToFile(
  url: string,
  dest: string,
  opts: DownloadOptions,
): Promise<DownloadResult> {
  const doFetch: FetchLike = opts.fetchImpl ?? ((u, i) => fetch(u, i));
  const timeout = opts.timeoutMs ?? 120_000;
  let current = assertAllowed(url, opts.allowedOrigins).toString();

  for (let hop = 0; ; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const headers: Record<string, string> = { 'User-Agent': opts.userAgent };
      if (opts.ifModifiedSince) headers['If-Modified-Since'] = opts.ifModifiedSince;
      if (opts.ifNoneMatch) headers['If-None-Match'] = opts.ifNoneMatch;
      const res = await doFetch(current, {
        headers,
        redirect: 'manual',
        signal: controller.signal,
      });

      if (res.status >= 300 && res.status < 400 && res.status !== 304) {
        const location = res.headers.get('location');
        if (!location || hop >= MAX_REDIRECTS) throw new Error(`Too many redirects for ${url}`);
        current = assertAllowed(
          new URL(location, current).toString(),
          opts.allowedOrigins,
        ).toString();
        await res.body?.cancel();
        continue;
      }
      if (res.status === 304) return { status: 'not-modified' };
      if (res.status === 429 || res.status >= 500) throw new RateLimitedError(res.status, url);
      if (!res.ok || !res.body)
        throw new Error(`Download of ${url} failed with status ${res.status}`);

      const declared = Number(res.headers.get('content-length') ?? 0);
      if (opts.maxBytes && declared > opts.maxBytes) {
        await res.body.cancel();
        throw new Error(`${url} is larger than the ${opts.maxBytes} byte limit`);
      }

      await mkdir(path.dirname(dest), { recursive: true });
      const part = `${dest}.part`;
      let bytes = 0;
      const source = Readable.fromWeb(res.body as never);
      source.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (opts.maxBytes && bytes > opts.maxBytes) {
          source.destroy(new Error(`${url} is larger than the ${opts.maxBytes} byte limit`));
        }
        opts.onBytes?.(chunk.length);
        // A stalled connection is cut by the timeout; each chunk proves the transfer is alive.
        timer.refresh();
      });
      try {
        await pipeline(source, createWriteStream(part));
      } catch (e) {
        await rm(part, { force: true });
        throw e;
      }
      await rename(part, dest);
      return {
        status: 'ok',
        bytes,
        etag: res.headers.get('etag'),
        lastModified: res.headers.get('last-modified'),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
