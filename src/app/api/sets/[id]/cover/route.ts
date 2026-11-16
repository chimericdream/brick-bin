import { getApiContext } from '@/server/auth/current';
import { getSet } from '@/server/data/sets';
import { readStored } from '@/server/storage';

export const dynamic = 'force-dynamic';

/**
 * Covers are served through the app so per-viewer visibility always applies: a set hidden from a
 * restricted profile answers exactly like an unknown one.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext();
  if (!ctx) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const detail = await getSet(ctx, id);
  if (!detail?.set.coverImage) return new Response('Not found', { status: 404 });
  const file = await readStored(detail.set.coverImage);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
