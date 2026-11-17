import type { CatalogConfig } from './config';
import type { FetchLike } from './net';
import { isAllowedUrl } from './origins';

export const COVER_MAX_BYTES = 8 * 1024 * 1024;

/** The image type from the first bytes, never from what the server says it is. */
export function sniffImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  const b = (i: number) => bytes[i];
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47)
    return { mime: 'image/png', ext: 'png' };
  if (
    b(0) === 0x52 &&
    b(1) === 0x49 &&
    b(2) === 0x46 &&
    b(3) === 0x46 &&
    b(8) === 0x57 &&
    b(9) === 0x45 &&
    b(10) === 0x42 &&
    b(11) === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

/**
 * Downloads one set cover. It is the only image fetch the app makes, once per set someone saves:
 * never in bulk, never while typing. The address must be https on `CATALOG_IMAGE_ORIGIN`, redirects
 * are refused, the size is capped at 8 MB and the type is checked from the bytes. Returns null on
 * any problem, so a missing cover never fails saving a set.
 */
export async function fetchCatalogCover(
  url: string | null,
  config: Pick<CatalogConfig, 'imageOrigin' | 'userAgent'>,
  fetchImpl: FetchLike = (u, i) => fetch(u, i),
): Promise<File | null> {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!isAllowedUrl(u, [config.imageOrigin])) return null;
    const res = await fetchImpl(u.toString(), {
      headers: { 'User-Agent': config.userAgent },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    if (Number(res.headers.get('content-length') ?? 0) > COVER_MAX_BYTES) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length === 0 || bytes.length > COVER_MAX_BYTES) return null;
    const type = sniffImage(bytes);
    if (!type) return null;
    return new File([bytes], `cover.${type.ext}`, { type: type.mime });
  } catch {
    return null;
  }
}
