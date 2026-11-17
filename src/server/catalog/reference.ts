import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { and, asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import type { Db } from '../db/client';
import {
  catalogPartImages,
  rbColors,
  rbMinifigs,
  rbPartCategories,
  rbParts,
  rbSets,
  rbThemes,
} from '../db/schema';
import { catalogPaths } from './config';

/**
 * Reads of the global `rb_*` reference tables. These are the only reads of that data; household
 * code never joins to them by foreign key (docs/PLAN.md section 2).
 */

export interface CatalogSet {
  setNum: string;
  name: string;
  year: number | null;
  numParts: number | null;
  themeId: number | null;
  themeName: string | null;
  imgUrl: string | null;
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

const setColumns = {
  setNum: rbSets.setNum,
  name: rbSets.name,
  year: rbSets.year,
  numParts: rbSets.numParts,
  themeId: rbSets.themeId,
  themeName: rbThemes.name,
  imgUrl: rbSets.imgUrl,
};

/**
 * Typeahead over the LEGO catalog: set numbers that start with the text first, then names that
 * contain it. "10294" finds 10294-1; "titanic" finds by name.
 */
export async function searchCatalogSets(db: Db, query: string, limit = 12): Promise<CatalogSet[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  const like = escapeLike(q);
  const byNumber = await db
    .select(setColumns)
    .from(rbSets)
    .leftJoin(rbThemes, eq(rbThemes.id, rbSets.themeId))
    .where(ilike(rbSets.setNum, `${like}%`))
    .orderBy(asc(sql`length(${rbSets.setNum})`), asc(rbSets.setNum))
    .limit(limit);
  if (byNumber.length >= limit) return byNumber;
  const taken = new Set(byNumber.map((s) => s.setNum));
  const byName = await db
    .select(setColumns)
    .from(rbSets)
    .leftJoin(rbThemes, eq(rbThemes.id, rbSets.themeId))
    .where(or(ilike(rbSets.name, `%${like}%`), ilike(rbThemes.name, `%${like}%`)))
    // Names that start with the text come before names that only contain it, then newest first.
    .orderBy(
      sql`(lower(${rbSets.name}) like ${`${like.toLowerCase()}%`}) desc`,
      sql`${rbSets.year} desc nulls last`,
      asc(rbSets.name),
    )
    .limit(limit + byNumber.length);
  return [...byNumber, ...byName.filter((s) => !taken.has(s.setNum))].slice(0, limit);
}

export async function getCatalogSet(db: Db, setNum: string): Promise<CatalogSet | null> {
  const [row] = await db
    .select(setColumns)
    .from(rbSets)
    .leftJoin(rbThemes, eq(rbThemes.id, rbSets.themeId))
    .where(eq(rbSets.setNum, setNum));
  return row ?? null;
}

/** Which of these set numbers ("10294", "10294-1") exist in the catalog, in the order given. */
export async function matchCatalogSets(db: Db, numbers: string[]): Promise<CatalogSet[]> {
  if (numbers.length === 0) return [];
  const wanted = numbers.flatMap((n) => (n.includes('-') ? [n] : [`${n}-1`, n]));
  const rows = await db
    .select(setColumns)
    .from(rbSets)
    .leftJoin(rbThemes, eq(rbThemes.id, rbSets.themeId))
    .where(inArray(rbSets.setNum, wanted));
  return wanted.flatMap((w) => rows.filter((r) => r.setNum === w));
}

/** Rebrickable's theme and its ancestors, root first. */
export async function catalogThemeChain(
  db: Db,
  themeId: number | null,
): Promise<{ id: number; name: string }[]> {
  const chain: { id: number; name: string }[] = [];
  const seen = new Set<number>();
  for (let cur = themeId; cur !== null && !seen.has(cur);) {
    seen.add(cur);
    const [row] = await db
      .select({ id: rbThemes.id, name: rbThemes.name, parentId: rbThemes.parentId })
      .from(rbThemes)
      .where(eq(rbThemes.id, cur));
    if (!row) break;
    chain.unshift({ id: row.id, name: row.name });
    cur = row.parentId;
  }
  return chain;
}

/** Light Bluish Gray is the colour the fallback prefers: it is the neutral most parts exist in. */
const PREFERRED_FALLBACK = 71;

/** The set number as printed on the box: `10294-1` becomes `10294`. */
export const boxNumber = (setNum: string) => setNum.replace(/-\d{1,2}$/, '');

const PART = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}$/;

/**
 * The LDraw image for a part in a colour. When that colour has none, falls back to the same part in
 * another colour (Light Bluish Gray first, then the lowest colour id) so the UI can label it
 * ("shown in Black"). Null when no colour has the part. Path parts are validated, never trusted.
 */
export async function resolvePartImage(
  db: Db,
  dataDir: string,
  colorId: number,
  partNum: string,
): Promise<{ bytes: Buffer; colorId: number; exact: boolean } | null> {
  if (!Number.isInteger(colorId) || !PART.test(partNum)) return null;
  const have = (
    await db
      .select({ colorId: catalogPartImages.colorId })
      .from(catalogPartImages)
      .where(and(eq(catalogPartImages.partNum, partNum)))
  ).map((r) => r.colorId);
  if (have.length === 0) return null;
  const used = have.includes(colorId)
    ? colorId
    : have.includes(PREFERRED_FALLBACK)
      ? PREFERRED_FALLBACK
      : Math.min(...have);
  const file = path.join(catalogPaths(dataDir).ldraw, String(used), `${partNum}.png`);
  try {
    return { bytes: await readFile(file), colorId: used, exact: used === colorId };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Parts, colours and minifigs (for missing pieces)
// ---------------------------------------------------------------------------

export interface CatalogPart {
  partNum: string;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
}

export interface CatalogColor {
  id: number;
  name: string;
  rgb: string;
  isTrans: boolean;
}

export interface CatalogFig {
  figNum: string;
  name: string;
  imgUrl: string | null;
}

export async function getCatalogPart(db: Db, partNum: string): Promise<CatalogPart | null> {
  const [row] = await db
    .select({
      partNum: rbParts.partNum,
      name: rbParts.name,
      categoryId: rbParts.partCatId,
      categoryName: rbPartCategories.name,
    })
    .from(rbParts)
    .leftJoin(rbPartCategories, eq(rbPartCategories.id, rbParts.partCatId))
    .where(eq(rbParts.partNum, partNum));
  return row ?? null;
}

export async function getCatalogColor(db: Db, id: number): Promise<CatalogColor | null> {
  const [row] = await db
    .select({ id: rbColors.id, name: rbColors.name, rgb: rbColors.rgb, isTrans: rbColors.isTrans })
    .from(rbColors)
    .where(eq(rbColors.id, id));
  return row ?? null;
}

export async function getCatalogFig(db: Db, figNum: string): Promise<CatalogFig | null> {
  const [row] = await db
    .select({ figNum: rbMinifigs.figNum, name: rbMinifigs.name, imgUrl: rbMinifigs.imgUrl })
    .from(rbMinifigs)
    .where(eq(rbMinifigs.figNum, figNum));
  return row ?? null;
}
