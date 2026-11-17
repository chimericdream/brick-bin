import { getApiContext } from '@/server/auth/current';
import { partColors } from '@/server/catalog/inventory';

export const dynamic = 'force-dynamic';

/** Colours for a part, the ones it is known to exist in first. */
export async function GET(req: Request) {
  const ctx = await getApiContext();
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.viewer.role === 'restricted')
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  const part = new URL(req.url).searchParams.get('part') ?? '';
  return Response.json({ colors: await partColors(ctx.db, part.slice(0, 80)) });
}
