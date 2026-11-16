import { getApiContext } from '@/server/auth/current';
import { matchCatalogSets, boxNumber } from '@/server/catalog/reference';
import { extractSetNumbers, lookupUpc } from '@/server/lookup/upc';

export const dynamic = 'force-dynamic';

/**
 * Barcode to set: UPCitemdb gives a product title, a 4 to 7 digit set number is pulled out of it, and
 * the catalog says which candidates are real sets. One request per scan, started by a person.
 */
export async function GET(req: Request) {
  const ctx = await getApiContext();
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.viewer.role === 'restricted')
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const title = await lookupUpc(new URL(req.url).searchParams.get('code') ?? '');
    if (!title) return Response.json({ title: null, matches: [] });
    const matches = await matchCatalogSets(ctx.db, extractSetNumbers(title));
    return Response.json({
      title,
      matches: matches.map((m) => ({
        setNum: m.setNum,
        number: boxNumber(m.setNum),
        name: m.name,
        year: m.year,
        pieces: m.numParts,
        theme: m.themeName,
      })),
    });
  } catch {
    return Response.json({ title: null, matches: [] });
  }
}
