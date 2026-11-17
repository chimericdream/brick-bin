import { describe, expect, it } from 'vitest';

import { COVER_MAX_BYTES, fetchCatalogCover, sniffImage } from './cover';
import type { FetchLike } from './net';
import { TINY_PNG } from './test-zip';

const config = { imageOrigin: 'https://cdn.rebrickable.com', userAgent: 'BrickBin/test' };
const serve =
  (body: Uint8Array | string, init: ResponseInit = {}): FetchLike =>
  async () =>
    new Response(typeof body === 'string' ? body : new Uint8Array(body), init);

describe('sniffImage', () => {
  it('reads the type from the bytes', () => {
    expect(sniffImage(TINY_PNG)?.mime).toBe('image/png');
    expect(sniffImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.ext).toBe('jpg');
    const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ');
    expect(sniffImage(webp)?.mime).toBe('image/webp');
    expect(sniffImage(new TextEncoder().encode('<html>'))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe('fetchCatalogCover', () => {
  const url = 'https://cdn.rebrickable.com/media/sets/10294-1.jpg';

  it('returns a File with the sniffed type, whatever the server claims', async () => {
    const file = await fetchCatalogCover(
      url,
      config,
      serve(TINY_PNG, { headers: { 'content-type': 'image/jpeg' } }),
    );
    expect(file).toBeInstanceOf(File);
    expect(file!.type).toBe('image/png');
    expect(file!.name).toBe('cover.png');
  });

  it('sends the user agent and refuses redirects', async () => {
    let init: RequestInit | undefined;
    await fetchCatalogCover(url, config, async (_u, i) => {
      init = i;
      return new Response(new Uint8Array(TINY_PNG));
    });
    expect((init!.headers as Record<string, string>)['User-Agent']).toBe('BrickBin/test');
    expect(init!.redirect).toBe('error');
  });

  it('only fetches from the image origin over https', async () => {
    let called = false;
    const spy: FetchLike = async () => {
      called = true;
      return new Response(new Uint8Array(TINY_PNG));
    };
    for (const bad of [
      'https://evil.example/c.jpg',
      'http://cdn.rebrickable.com/c.jpg',
      'https://cdn.rebrickable.com.evil.example/c.jpg',
      'not a url',
      'file:///etc/passwd',
    ]) {
      expect(await fetchCatalogCover(bad, config, spy)).toBeNull();
    }
    expect(called).toBe(false);
    expect(await fetchCatalogCover(null, config, spy)).toBeNull();
  });

  it('returns null for a non-image, a failed request, an empty body and an oversize file', async () => {
    expect(await fetchCatalogCover(url, config, serve('<html>not an image</html>'))).toBeNull();
    expect(await fetchCatalogCover(url, config, serve('', { status: 404 }))).toBeNull();
    expect(await fetchCatalogCover(url, config, serve(new Uint8Array()))).toBeNull();
    const big = new Uint8Array(COVER_MAX_BYTES + 1);
    big.set(TINY_PNG);
    expect(await fetchCatalogCover(url, config, serve(big))).toBeNull();
    const liar: FetchLike = async () =>
      new Response(new Uint8Array(TINY_PNG), {
        headers: { 'content-length': String(COVER_MAX_BYTES + 1) },
      });
    expect(await fetchCatalogCover(url, config, liar)).toBeNull();
    const boom: FetchLike = async () => {
      throw new Error('network down');
    };
    expect(await fetchCatalogCover(url, config, boom)).toBeNull();
  });
});
