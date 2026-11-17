import { getApiContext } from '@/server/auth/current';
import { boxNumber, searchCatalogSets } from '@/server/catalog/reference';
import { wishersByCatalogSet } from '@/server/data/wishlist';

export const dynamic = 'force-dynamic';

/** Typeahead over the imported LEGO catalog. Text only: no image is fetched while someone types. */
export async function GET(req: Request) {
  const ctx = await getApiContext();
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const q = new URL(req.url).searchParams.get('q') ?? '';
  const hits = await searchCatalogSets(ctx.db, q);
  // Who already wants each set. Kid profiles get nothing here.
  const wishers = await wishersByCatalogSet(
    ctx,
    hits.map((h) => h.setNum),
  );
  return Response.json({
    hits: hits.map((h) => ({
      wishers: wishers.get(h.setNum) ?? [],
      setNum: h.setNum,
      number: boxNumber(h.setNum),
      name: h.name,
      year: h.year,
      pieces: h.numParts,
      theme: h.themeName,
    })),
  });
}
