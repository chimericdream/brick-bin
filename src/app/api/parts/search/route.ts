import { getApiContext } from '@/server/auth/current';
import { searchParts } from '@/server/catalog/inventory';

export const dynamic = 'force-dynamic';

/** Part search over the whole catalog (by number or name). Members and admins. */
export async function GET(req: Request) {
  const ctx = await getApiContext();
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.viewer.role === 'restricted')
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  const q = new URL(req.url).searchParams.get('q') ?? '';
  return Response.json({ hits: await searchParts(ctx.db, q) });
}
