import { getApiContext } from '@/server/auth/current';
import { boxNumber, searchCatalogSets } from '@/server/catalog/reference';

export const dynamic = 'force-dynamic';

/** Typeahead over the imported LEGO catalog. Text only: no image is fetched while someone types. */
export async function GET(req: Request) {
  const ctx = await getApiContext();
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const q = new URL(req.url).searchParams.get('q') ?? '';
  const hits = await searchCatalogSets(ctx.db, q);
  return Response.json({
    hits: hits.map((h) => ({
      setNum: h.setNum,
      number: boxNumber(h.setNum),
      name: h.name,
      year: h.year,
      pieces: h.numParts,
      theme: h.themeName,
    })),
  });
}
