import { requireAdminApi } from '@/server/catalog/http';
import { catalogStatus, getAvailability, listRuns } from '@/server/catalog/runs';

export const dynamic = 'force-dynamic';

/** Import progress and whether the button is available. Admin only. */
export async function GET() {
  const auth = await requireAdminApi();
  if ('response' in auth) return auth.response;
  const { db } = auth.ctx;
  const [[run], availability, status] = await Promise.all([
    listRuns(db, 1),
    getAvailability(db),
    catalogStatus(db),
  ]);
  return Response.json(
    { run: run ?? null, availability, status },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
