import { getApiContext } from '@/server/auth/current';
import { loadSetInventory, queryInventory } from '@/server/catalog/inventory';
import { partImageColors, pickImageColor } from '@/server/catalog/reference';
import { getCopyContext } from '@/server/data/copies';

export const dynamic = 'force-dynamic';

const int = (v: string | null) => (v !== null && /^-?\d{1,9}$/.test(v) ? Number(v) : null);

/**
 * The parts or minifigures of the set a copy belongs to, filtered and paged, for the missing-piece
 * picker. Each part says which colour its image is in, so the page can label a fallback. Members
 * and admins only: kid profiles do not add missing pieces.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext();
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.viewer.role === 'restricted')
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  const copy = await getCopyContext(ctx, (await params).id);
  if (!copy) return Response.json({ error: 'Not found' }, { status: 404 });

  const sp = new URL(req.url).searchParams;
  const version = int(sp.get('version'));
  const inventory =
    copy.set.rbSetNum && copy.brand.isLego
      ? await loadSetInventory(ctx.db, copy.set.rbSetNum, version)
      : null;
  if (!inventory || inventory.version === null) {
    return Response.json({
      linked: Boolean(copy.set.rbSetNum),
      version: null,
      versions: [],
      parts: [],
      figs: [],
      total: 0,
    });
  }

  if (sp.get('tab') === 'minifigs') {
    return Response.json({
      linked: true,
      version: inventory.version,
      versions: inventory.versions,
      figs: inventory.figs,
    });
  }

  const page = queryInventory(inventory.parts, {
    q: sp.get('q') ?? '',
    colorId: int(sp.get('color')),
    categoryId: int(sp.get('cat')),
    spares: sp.get('spares') === '1',
    offset: int(sp.get('offset')) ?? 0,
    limit: 60,
  });
  const images = await partImageColors(ctx.db, [...new Set(page.parts.map((p) => p.partNum))]);
  return Response.json({
    linked: true,
    version: inventory.version,
    versions: inventory.versions,
    total: page.total,
    colors: page.colors,
    categories: page.categories,
    spareCount: page.spareCount,
    parts: page.parts.map((p) => ({
      ...p,
      imageColorId: pickImageColor(images.get(p.partNum) ?? [], p.colorId),
    })),
  });
}
