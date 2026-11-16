import { getApiContext } from '@/server/auth/current';
import { catalogConfig } from '@/server/catalog/config';
import { resolvePartImage } from '@/server/catalog/reference';

export const dynamic = 'force-dynamic';

/**
 * An LDraw part image in the requested colour, or the same part in another colour when that one has
 * no image (the `X-Part-Image-Color` header says which, so the UI can label it). Signed-in people only.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ color: string; part: string }> },
) {
  const ctx = await getApiContext();
  if (!ctx) return new Response('Unauthorized', { status: 401 });
  const { color, part } = await params;
  const colorId = /^-?\d{1,6}$/.test(color) ? Number(color) : NaN;
  const image = await resolvePartImage(
    ctx.db,
    catalogConfig().dataDir,
    colorId,
    decodeURIComponent(part),
  );
  if (!image) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Part-Image-Color': String(image.colorId),
      'X-Part-Image-Exact': image.exact ? '1' : '0',
    },
  });
}
