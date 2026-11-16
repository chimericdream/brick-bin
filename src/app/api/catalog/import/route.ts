import { startImport } from '@/server/catalog/import';
import { errorResponse, requireAdminApi } from '@/server/catalog/http';

export const dynamic = 'force-dynamic';

/** Starts an import and answers 202 at once; progress is read from `/api/catalog/status`. */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ('response' in auth) return auth.response;
  try {
    const text = await req.text();
    const html = text.trim() === '' ? null : text;
    const runId = await startImport(auth.ctx, html, {
      confirmStale: req.headers.get('x-confirm-stale') === '1',
    });
    return Response.json({ runId }, { status: 202 });
  } catch (e) {
    return errorResponse(e);
  }
}
