import type { DataContext } from '../data/context';
import { getApiContext } from '../auth/current';
import { ImportRefusedError } from './import';
import { ImportUnavailableError } from './runs';

/** The admin session for a catalog route, or the response to send instead. */
export async function requireAdminApi(): Promise<{ ctx: DataContext } | { response: Response }> {
  const ctx = await getApiContext();
  if (!ctx) return { response: new Response('Unauthorized', { status: 401 }) };
  if (ctx.viewer.role !== 'admin') return { response: new Response('Forbidden', { status: 403 }) };
  return { ctx };
}

const STATUS: Record<ImportRefusedError['code'], number> = {
  invalid: 400,
  stale: 409,
  unavailable: 409,
  too_large: 413,
  fetch_disabled: 400,
  rate: 429,
};

/** Maps an import refusal to a JSON error the Catalog page can show. */
export function errorResponse(e: unknown): Response {
  if (e instanceof ImportRefusedError) {
    return Response.json(
      { error: e.message, problems: e.problems, code: e.code },
      { status: STATUS[e.code] },
    );
  }
  if (e instanceof ImportUnavailableError) {
    return Response.json({ error: e.message, problems: [], code: 'unavailable' }, { status: 409 });
  }
  console.error('Catalog import error', e);
  return Response.json(
    { error: 'Something went wrong.', problems: [], code: 'error' },
    { status: 500 },
  );
}
