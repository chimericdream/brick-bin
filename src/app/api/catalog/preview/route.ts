import { previewImport } from '@/server/catalog/import';
import { errorResponse, requireAdminApi } from '@/server/catalog/http';

export const dynamic = 'force-dynamic';

/**
 * Checks a pasted downloads page and says what an import would do, without starting one. This is a
 * route handler, not a server action, because the page is about 240 KB and actions have a body limit.
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ('response' in auth) return auth.response;
  try {
    const html = await readBody(req);
    return Response.json(await previewImport(auth.ctx, html));
  } catch (e) {
    return errorResponse(e);
  }
}

/** The pasted text, or null when the body is empty (the app then fetches the page itself if allowed). */
async function readBody(req: Request): Promise<string | null> {
  const text = await req.text();
  return text.trim() === '' ? null : text;
}
