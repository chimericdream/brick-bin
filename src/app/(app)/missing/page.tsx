import { Text, Title } from '@mantine/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PartImage, FigureImage, Swatch } from '@/components/sets/PartImage';
import { requireContext } from '@/server/auth/current';
import { getCatalogColors, partImageColors, pickImageColor } from '@/server/catalog/reference';
import { listBrands } from '@/server/data/brands';
import { listMembers } from '@/server/data/members';
import { listLocationOptions } from '@/server/data/places';
import { listShopping, shoppingFacets, type ShoppingGroup } from '@/server/data/shopping';
import { loadBrickLinkMaps, toBrickLinkXml } from '@/server/data/shopping-export';
import { parseShoppingParams, shoppingHref } from '@/server/data/shopping-params';
import { listThemeOptions } from '@/server/data/themes';
import type { RawParams } from '@/server/data/library-filters';

import { PrintButton } from './PrintButton';
import { StoreTrip, type TripGroup } from './StoreTrip';
import classes from './Shopping.module.css';

export const dynamic = 'force-dynamic';

const setsText = (g: ShoppingGroup) => {
  const bySource = new Map<string, number>();
  for (const s of g.sources) {
    const label = s.copiesInSet > 1 ? `${s.setName} (copy ${s.copyPosition})` : s.setName;
    bySource.set(label, (bySource.get(label) ?? 0) + s.quantity);
  }
  return [...bySource].map(([label, n]) => `${label} ×${n}`).join(', ');
};

export default async function ShoppingPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const { ctx } = await requireContext();
  // Kid profiles have no shopping list: it is a page that does not exist for them.
  if (ctx.viewer.role === 'restricted') notFound();

  const params = await parseShoppingParams(ctx, await searchParams);
  const { groups, pieces, lines } = await listShopping(ctx, params.scope);
  const [facets, brands, themeOptions, places, members] = await Promise.all([
    shoppingFacets(ctx),
    listBrands(ctx),
    listThemeOptions(ctx),
    listLocationOptions(ctx),
    listMembers(ctx),
  ]);

  const partNums = [...new Set(groups.flatMap((g) => (g.partNum ? [g.partNum] : [])))];
  const [images, colors, bl] = await Promise.all([
    partImageColors(ctx.db, partNums),
    getCatalogColors(
      ctx.db,
      groups.flatMap((g) => (g.colorId === null ? [] : [g.colorId])),
    ),
    loadBrickLinkMaps(ctx.db, groups),
  ]);
  const unmapped = toBrickLinkXml(groups, bl).unmapped.filter((g) => g.kind !== 'other').length;
  const imageColor = (g: ShoppingGroup) =>
    g.partNum && g.colorId !== null ? pickImageColor(images.get(g.partNum) ?? [], g.colorId) : null;

  const q = params.query;
  const sel = (key: string) => q.get(key) ?? '';
  const sort = params.scope.sort ?? 'color';
  const exportHref = (format: string) =>
    shoppingHref(q, { format, trip: null }, '/api/missing/export');
  const scoped = Boolean(params.lib || q.has('set'));
  const hidden = [...q.entries()].filter(([k]) => ['sort', 'trip', 'lib', 'set'].includes(k));

  const trip: TripGroup[] = groups.map((g) => ({
    key: g.key,
    title: g.name,
    kind: g.kind,
    partNum: g.partNum,
    colorId: g.colorId,
    colorName: g.colorName,
    rgb: g.rgb,
    imageColorId: imageColor(g),
    quantity: g.quantity,
    hints: g.hints,
    setsText: setsText(g),
    sources: g.sources.map((s) => ({
      itemId: s.itemId,
      label: s.copiesInSet > 1 ? `${s.setName}, copy ${s.copyPosition}` : s.setName,
      quantity: s.quantity,
      createdAt: s.createdAt.toISOString(),
    })),
  }));

  return (
    <>
      <div className={classes.head}>
        <div>
          <Title order={1}>Shopping list</Title>
          <p className={classes.sub}>
            {pieces} {pieces === 1 ? 'piece' : 'pieces'} on {lines} {lines === 1 ? 'line' : 'lines'}
            {scoped && (
              <>
                {' · '}
                {params.lib ? 'for the sets in the library view' : 'for the chosen sets'}{' '}
                <Link href={shoppingHref(q, { lib: null, set: null })}>Show all sets</Link>
              </>
            )}
          </p>
        </div>
        <div className={classes.tools} data-noprint>
          {params.trip ? (
            <Link href={shoppingHref(q, { trip: null })} className={classes.toolLink}>
              Leave store-trip mode
            </Link>
          ) : (
            <Link href={shoppingHref(q, { trip: '1' })} className={classes.toolLink}>
              Store-trip mode
            </Link>
          )}
          <PrintButton />
        </div>
      </div>

      {!params.trip && (
        <div data-noprint className={classes.controls}>
          <nav aria-label="Sort" className={classes.sorts}>
            <span>Sort by</span>
            {(['color', 'category', 'set'] as const).map((s) => (
              <Link
                key={s}
                href={shoppingHref(q, { sort: s === 'color' ? null : s })}
                aria-current={sort === s ? 'true' : undefined}
              >
                {s === 'color' ? 'Colour' : s === 'category' ? 'Category' : 'Set'}
              </Link>
            ))}
          </nav>

          <form action="/missing" className={classes.filters}>
            {hidden.map(([k, v], i) => (
              <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
            ))}
            <label>
              Brand
              <select name="brand" defaultValue={sel('brand')}>
                <option value="">All</option>
                {brands
                  .filter((b) => facets.brandIds.includes(b.id))
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Theme
              <select name="theme" defaultValue={sel('theme')}>
                <option value="">All</option>
                {themeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Owner
              <select name="owner" defaultValue={sel('owner')}>
                <option value="">Everyone</option>
                {facets.hasUnowned && <option value="none">Ours</option>}
                {members
                  .filter((m) => facets.owners.some((o) => o.id === m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Place
              <select name="place" defaultValue={sel('place')}>
                <option value="">Anywhere</option>
                {places.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Colour
              <select name="color" defaultValue={sel('color')}>
                <option value="">All colours</option>
                {facets.colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Apply</button>
          </form>

          <details className={classes.exports}>
            <summary>Export</summary>
            <ul>
              <li>
                <a href={exportHref('bricklink')} download>
                  BrickLink wanted list (XML)
                </a>
              </li>
              <li>
                <a href={exportHref('rebrickable')} download>
                  Rebrickable parts list (CSV)
                </a>
              </li>
              <li>
                <a href={exportHref('csv')} download>
                  Plain CSV
                </a>
              </li>
            </ul>
          </details>
        </div>
      )}

      {unmapped > 0 && !params.trip && (
        <p className={classes.note} data-noprint role="status">
          {unmapped} {unmapped === 1 ? 'line has' : 'lines have'} no BrickLink id, so{' '}
          {unmapped === 1 ? 'it is' : 'they are'} left out of the BrickLink file.
        </p>
      )}

      {groups.length === 0 ? (
        <div className={classes.empty}>
          <Text>
            Nothing is missing{scoped || q.size > 0 ? ' under these filters' : ''}. Add missing
            pieces from a copy’s page, and they collect here.
          </Text>
        </div>
      ) : params.trip ? (
        <StoreTrip groups={trip} />
      ) : (
        <ul className={classes.list}>
          {groups.map((g) => (
            <li key={g.key} className={classes.row} data-key={g.key}>
              {g.kind === 'part' && g.partNum && g.colorId !== null ? (
                <PartImage
                  partNum={g.partNum}
                  colorId={g.colorId}
                  imageColorId={imageColor(g)}
                  size={72}
                />
              ) : (
                <FigureImage size={72} />
              )}
              <div className={classes.text}>
                <strong>{g.name}</strong>
                <div className={classes.meta}>
                  {g.colorName && (
                    <span className={classes.color}>
                      <Swatch rgb={colors.get(g.colorId ?? -1)?.rgb ?? g.rgb} />
                      {g.colorName}
                    </span>
                  )}
                  {g.partNum && <span>#{g.partNum}</span>}
                  {g.elementId && <span>Element {g.elementId}</span>}
                  {g.figNum && <span>{g.figNum}</span>}
                  {g.kind === 'other' && <span>Other piece</span>}
                </div>
                {g.hints.length > 0 && (
                  <div className={classes.hint}>
                    Any of {[g.partNum, ...g.hints].join(', ')} will do
                  </div>
                )}
                <div className={classes.sets}>{setsText(g)}</div>
              </div>
              <span className={classes.qty} aria-label={`Quantity ${g.quantity}`}>
                ×{g.quantity}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className={classes.attribution}>
        Catalog data from <a href="https://rebrickable.com">Rebrickable</a>
      </p>
    </>
  );
}
