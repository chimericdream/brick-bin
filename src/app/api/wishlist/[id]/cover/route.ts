import { getApiContext } from '@/server/auth/current';
import { wishCoverPath } from '@/server/data/wishlist';
import { readStored } from '@/server/storage';

export const dynamic = 'force-dynamic';

/** Wish covers go through the app too: a kid profile only ever gets its own wishes' covers. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext();
  if (!ctx) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const rel = await wishCoverPath(ctx, id);
  if (!rel) return new Response('Not found', { status: 404 });
  const file = await readStored(rel);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
