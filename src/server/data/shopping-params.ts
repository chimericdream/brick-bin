import { libraryMatchingSetIds } from './library';
import { parseLibraryFilters, type RawParams } from './library-filters';
import type { DataContext } from './context';
import type { ShoppingScope, ShoppingSort } from './shopping';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).map((s) => s.trim()).filter(Boolean);

export interface ShoppingParams {
  scope: ShoppingScope;
  /** The library filters this scope came from ("Shopping list for these"), as a query string. */
  lib: string | null;
  trip: boolean;
  /** The params as they came in, for building links that keep the same view. */
  query: URLSearchParams;
}

/**
 * The shopping list's view, from the URL: which sets, which filters, the sort, and whether store-trip
 * mode is on. Bad ids and unknown values are dropped. A `lib` value is a library query string and
 * resolves to the sets that library view shows, under the viewer's own visibility.
 */
export async function parseShoppingParams(
  ctx: DataContext,
  raw: RawParams,
): Promise<ShoppingParams> {
  const sort = list(raw.sort)[0];
  const ids = (v: string | string[] | undefined) => list(v).filter((s) => UUID.test(s));
  const scope: ShoppingScope = {
    setIds: ids(raw.set),
    brandIds: ids(raw.brand),
    themeIds: ids(raw.theme),
    ownerIds: list(raw.owner).filter((s) => s === 'none' || UUID.test(s)),
    locationIds: list(raw.place).filter((s) => s === 'none' || UUID.test(s)),
    colorIds: list(raw.color)
      .filter((s) => /^-?\d{1,6}$/.test(s))
      .map(Number),
    sort: (['color', 'category', 'set'] as const).includes(sort as ShoppingSort)
      ? (sort as ShoppingSort)
      : 'color',
  };

  const lib = list(raw.lib)[0]?.slice(0, 1000) ?? null;
  if (lib) {
    // Keep repeated keys (several states, several brands): one array per key.
    const libParams = new URLSearchParams(lib);
    const filters = parseLibraryFilters(
      Object.fromEntries([...new Set(libParams.keys())].map((k) => [k, libParams.getAll(k)])),
      { allowValueSort: false },
    );
    const matching = await libraryMatchingSetIds(ctx, filters);
    // An empty match must stay empty, not widen to "all sets".
    scope.setIds = [...new Set([...(scope.setIds ?? []), ...matching])];
    if (scope.setIds.length === 0) scope.setIds = ['00000000-0000-0000-0000-000000000000'];
  }

  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) for (const item of list(v)) query.append(k, item);
  return { scope, lib, trip: list(raw.trip)[0] === '1', query };
}

/** A shopping link that keeps the current view, with some params replaced. */
export function shoppingHref(
  query: URLSearchParams,
  change: Record<string, string | null>,
  path = '/missing',
) {
  const next = new URLSearchParams(query);
  for (const [k, v] of Object.entries(change)) {
    next.delete(k);
    if (v !== null) next.set(k, v);
  }
  const s = next.toString();
  return s ? `${path}?${s}` : path;
}
