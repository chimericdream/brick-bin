/* oxlint-disable unicorn/consistent-function-scoping -- fixtures read better next to their tests */
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RateLimitedError, downloadToFile, type FetchLike } from './net';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'bb-net-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const allowed = ['https://cdn.rebrickable.com', 'https://rebrickable.com'];
const base = { userAgent: 'BrickBin/test (+https://brick-bin.app)', allowedOrigins: allowed };

const body = (text: string, status = 200, headers: Record<string, string> = {}) =>
  new Response(text, { status, headers });

describe('downloadToFile', () => {
  it('streams to disk, sends the user agent, and reports validators', async () => {
    const seen: RequestInit[] = [];
    const fetchImpl: FetchLike = async (_u, init) => {
      seen.push(init!);
      return body('hello world', 200, {
        etag: '"abc"',
        'last-modified': 'Mon, 16 Nov 2026 07:18:59 GMT',
      });
    };
    const dest = path.join(dir, 'out', 'f.bin');
    let counted = 0;
    const result = await downloadToFile('https://cdn.rebrickable.com/a.zip', dest, {
      ...base,
      fetchImpl,
      onBytes: (n) => (counted += n),
    });
    expect(result).toEqual({
      status: 'ok',
      bytes: 11,
      etag: '"abc"',
      lastModified: 'Mon, 16 Nov 2026 07:18:59 GMT',
    });
    expect(counted).toBe(11);
    expect(await readFile(dest, 'utf8')).toBe('hello world');
    expect((seen[0]!.headers as Record<string, string>)['User-Agent']).toBe(base.userAgent);
    expect(await readdir(path.join(dir, 'out'))).toEqual(['f.bin']); // no .part left behind
  });

  it('sends conditional headers and handles 304 without writing a file', async () => {
    let headers: Record<string, string> = {};
    const fetchImpl: FetchLike = async (_u, init) => {
      headers = init!.headers as Record<string, string>;
      return new Response(null, { status: 304 });
    };
    const dest = path.join(dir, 'x.zip');
    const result = await downloadToFile('https://cdn.rebrickable.com/x.zip', dest, {
      ...base,
      fetchImpl,
      ifModifiedSince: 'Mon, 16 Nov 2026 07:18:59 GMT',
      ifNoneMatch: '"abc"',
    });
    expect(result).toEqual({ status: 'not-modified' });
    expect(headers['If-Modified-Since']).toContain('2026');
    expect(headers['If-None-Match']).toBe('"abc"');
    await expect(readFile(dest)).rejects.toThrow();
  });

  it('stops with a RateLimitedError on 429 and on server errors', async () => {
    for (const status of [429, 500, 503]) {
      const fetchImpl: FetchLike = async () => body('slow down', status);
      await expect(
        downloadToFile('https://cdn.rebrickable.com/a.zip', path.join(dir, 'a'), {
          ...base,
          fetchImpl,
        }),
      ).rejects.toBeInstanceOf(RateLimitedError);
    }
  });

  it('refuses origins that are not allowed, including redirects to them', async () => {
    const never: FetchLike = async () => {
      throw new Error('should not be called');
    };
    await expect(
      downloadToFile('https://evil.example/a.zip', path.join(dir, 'a'), {
        ...base,
        fetchImpl: never,
      }),
    ).rejects.toThrow(/not an allowed origin/);
    await expect(
      downloadToFile('http://cdn.rebrickable.com/a.zip', path.join(dir, 'a'), {
        ...base,
        fetchImpl: never,
      }),
    ).rejects.toThrow(/not an allowed origin/);

    const redirectOut: FetchLike = async () =>
      new Response(null, { status: 302, headers: { location: 'https://evil.example/steal.zip' } });
    await expect(
      downloadToFile('https://cdn.rebrickable.com/a.zip', path.join(dir, 'a'), {
        ...base,
        fetchImpl: redirectOut,
      }),
    ).rejects.toThrow(/not an allowed origin/);
  });

  it('follows a redirect between allowed origins, but not forever', async () => {
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (u) => {
      calls.push(u);
      return u.includes('rebrickable.com/old')
        ? new Response(null, {
            status: 301,
            headers: { location: 'https://cdn.rebrickable.com/new.zip' },
          })
        : body('moved');
    };
    const dest = path.join(dir, 'm');
    await downloadToFile('https://rebrickable.com/old', dest, { ...base, fetchImpl });
    expect(calls).toEqual(['https://rebrickable.com/old', 'https://cdn.rebrickable.com/new.zip']);
    expect(await readFile(dest, 'utf8')).toBe('moved');

    const loop: FetchLike = async () =>
      new Response(null, {
        status: 302,
        headers: { location: 'https://cdn.rebrickable.com/again' },
      });
    await expect(
      downloadToFile('https://cdn.rebrickable.com/start', path.join(dir, 'l'), {
        ...base,
        fetchImpl: loop,
      }),
    ).rejects.toThrow(/Too many redirects/);
  });

  it('enforces a size cap and leaves no partial file', async () => {
    const fetchImpl: FetchLike = async () => body('x'.repeat(1000));
    const dest = path.join(dir, 'big');
    await expect(
      downloadToFile('https://cdn.rebrickable.com/big.zip', dest, {
        ...base,
        fetchImpl,
        maxBytes: 100,
      }),
    ).rejects.toThrow(/larger than/);
    expect(await readdir(dir)).toEqual([]);
  });

  it('times out a stalled request', async () => {
    const fetchImpl: FetchLike = (_u, init) =>
      new Promise((_resolve, reject) => {
        init!.signal!.addEventListener('abort', () => reject(new Error('aborted')));
      });
    await expect(
      downloadToFile('https://cdn.rebrickable.com/slow', path.join(dir, 's'), {
        ...base,
        fetchImpl,
        timeoutMs: 30,
      }),
    ).rejects.toThrow(/aborted/);
  });
});
