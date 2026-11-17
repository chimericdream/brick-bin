import { removeStored, saveCover } from '../storage';
import type { DataContext } from '../data/context';
import { assertCanWrite } from '../data/visibility';
import { getSet, setCoverImage, updateSet, type SetInput } from '../data/sets';
import { findOrCreateThemeChain } from '../data/themes';
import { catalogConfig } from './config';
import { fetchCatalogCover } from './cover';
import { catalogThemeChain, getCatalogSet } from './reference';
import type { FetchLike } from './net';

export type ResyncKey = 'name' | 'year' | 'pieceCount' | 'themeId' | 'cover';

export interface ResyncField {
  key: ResyncKey;
  label: string;
  current: string | null;
  catalog: string | null;
}

export interface ResyncPreview {
  setNum: string;
  fields: ResyncField[];
  /** The set has a cover now: taking the catalog cover replaces it, so it needs an explicit yes. */
  hasCover: boolean;
  catalogHasCover: boolean;
}

const str = (v: unknown) => (v === null || v === undefined ? null : String(v));

/**
 * What re-syncing a linked set would change, as a field-by-field diff. Nothing is written. Only
 * LEGO-brand sets linked to a catalog set can be re-synced; anything else returns null.
 */
export async function previewResync(
  ctx: DataContext,
  setId: string,
): Promise<ResyncPreview | null> {
  assertCanWrite(ctx);
  const detail = await getSet(ctx, setId);
  if (!detail?.set.rbSetNum || !detail.brand.isLego) return null;
  const catalog = await getCatalogSet(ctx.db, detail.set.rbSetNum);
  if (!catalog) return null;

  const chain = await catalogThemeChain(ctx.db, catalog.themeId);
  const catalogTheme = chain.length ? chain.map((t) => t.name).join(' › ') : null;
  const currentTheme = detail.themePath.length
    ? detail.themePath.map((t) => t.name).join(' › ')
    : null;

  const all: ResyncField[] = [
    { key: 'name', label: 'Name', current: detail.set.name, catalog: catalog.name },
    { key: 'year', label: 'Year', current: str(detail.set.year), catalog: str(catalog.year) },
    {
      key: 'pieceCount',
      label: 'Pieces',
      current: str(detail.set.pieceCount),
      catalog: str(catalog.numParts),
    },
    { key: 'themeId', label: 'Theme', current: currentTheme, catalog: catalogTheme },
  ];
  return {
    setNum: catalog.setNum,
    // A field the catalog has no value for is never offered: it would blank something.
    fields: all.filter((f) => f.catalog !== null && f.catalog !== f.current),
    hasCover: detail.set.coverImage !== null,
    catalogHasCover: Boolean(catalog.imgUrl),
  };
}

/**
 * Applies the chosen fields (audited, like any edit). The cover is downloaded only when asked for,
 * and a cover already on the set is replaced only with `replaceCover`.
 */
export async function applyResync(
  ctx: DataContext,
  setId: string,
  keys: ResyncKey[],
  opts: { replaceCover?: boolean } = {},
  deps: { fetchImpl?: FetchLike } = {},
): Promise<{ applied: ResyncKey[]; coverFailed: boolean }> {
  assertCanWrite(ctx);
  const detail = await getSet(ctx, setId);
  if (!detail?.set.rbSetNum || !detail.brand.isLego)
    throw new Error('This set is not linked to the catalog');
  const catalog = await getCatalogSet(ctx.db, detail.set.rbSetNum);
  if (!catalog) throw new Error('The catalog no longer has this set');

  const { set } = detail;
  const wanted = new Set(keys);
  const input: SetInput = {
    brandId: set.brandId,
    setNumber: set.setNumber,
    name: wanted.has('name') ? catalog.name : set.name,
    themeId: set.themeId,
    year: wanted.has('year') ? catalog.year : set.year,
    pieceCount: wanted.has('pieceCount') ? catalog.numParts : set.pieceCount,
    minifigCount: set.minifigCount,
    minAge: set.minAge,
    description: set.description,
    retailPriceCents: set.retailPriceCents,
    designer: set.designer,
    notes: set.notes,
    rbSetNum: set.rbSetNum,
    hiddenFromRestricted: set.hiddenFromRestricted,
    tags: detail.tags,
  };
  if (wanted.has('themeId') && catalog.themeId !== null) {
    input.themeId = await findOrCreateThemeChain(
      ctx,
      await catalogThemeChain(ctx.db, catalog.themeId),
    );
  }
  const fieldKeys = keys.filter((k) => k !== 'cover');
  if (fieldKeys.length > 0) await updateSet(ctx, setId, input);

  let coverFailed = false;
  const applied: ResyncKey[] = [...fieldKeys];
  if (wanted.has('cover')) {
    if (set.coverImage && !opts.replaceCover) {
      // Never overwrite a cover someone chose without an explicit yes.
    } else {
      const file = await fetchCatalogCover(catalog.imgUrl, catalogConfig(), deps.fetchImpl);
      if (file) {
        const path = await saveCover(ctx.householdId, setId, file);
        const old = await setCoverImage(ctx, setId, path);
        if (old && old !== path) await removeStored(old);
        applied.push('cover');
      } else {
        coverFailed = true;
      }
    }
  }
  return { applied, coverFailed };
}
