import { getApiContext } from '@/server/auth/current';
import { listShopping } from '@/server/data/shopping';
import { parseShoppingParams } from '@/server/data/shopping-params';
import {
  loadBrickLinkMaps,
  toBrickLinkXml,
  toPlainCsv,
  toRebrickableCsv,
} from '@/server/data/shopping-export';

export const dynamic = 'force-dynamic';

const day = () => new Date().toISOString().slice(0, 10);

/**
 * The shopping list as a file: a BrickLink wanted list (XML), a Rebrickable parts list (CSV) or a
 * plain CSV. It takes the same filters as the page, so what you download is what you saw. Kid
 * profiles have no shopping list, so they get a 404, like any other page they cannot see.
 */
export async function GET(req: Request) {
  const ctx = await getApiContext();
  if (!ctx) return new Response('Unauthorized', { status: 401 });
  if (ctx.viewer.role === 'restricted') return new Response('Not found', { status: 404 });

  const url = new URL(req.url);
  const format = url.searchParams.get('format');
  const raw = Object.fromEntries(
    [...new Set(url.searchParams.keys())].map((k) => [k, url.searchParams.getAll(k)]),
  );
  const { scope } = await parseShoppingParams(ctx, raw);
  const { groups } = await listShopping(ctx, scope);

  const file = (body: string, type: string, name: string) =>
    new Response(body, {
      headers: {
        'Content-Type': `${type}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  if (format === 'bricklink') {
    const { xml } = toBrickLinkXml(groups, await loadBrickLinkMaps(ctx.db, groups));
    return file(xml, 'application/xml', `brick-bin-wanted-list-${day()}.xml`);
  }
  if (format === 'rebrickable') {
    return file(
      toRebrickableCsv(groups).csv,
      'text/csv',
      `brick-bin-rebrickable-parts-${day()}.csv`,
    );
  }
  if (format === 'csv') {
    return file(toPlainCsv(groups), 'text/csv', `brick-bin-shopping-list-${day()}.csv`);
  }
  return new Response('Unknown format', { status: 400 });
}
