import { asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm';

import type { Db } from '../db/client';
import {
  rbColors,
  rbElements,
  rbInventories,
  rbInventoryMinifigs,
  rbInventoryParts,
  rbInventorySets,
  rbMinifigs,
  rbPartCategories,
  rbParts,
} from '../db/schema';

export interface InventoryPart {
  partNum: string;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  colorId: number;
  colorName: string;
  rgb: string;
  isTrans: boolean;
  /** How many of this part the set contains (sub-sets included). */
  quantity: number;
  isSpare: boolean;
}

export interface InventoryFig {
  figNum: string;
  name: string;
  imgUrl: string | null;
  quantity: number;
}

export interface SetInventory {
  /** The inventory version used, or null when the catalog has none for this set. */
  version: number | null;
  /** Every version the catalog has, newest first. */
  versions: number[];
  parts: InventoryPart[];
  figs: InventoryFig[];
}

/** The newest inventory id for each set number (a set's own inventory, or a sub-set's). */
async function latestInventoryIds(db: Db, setNums: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (setNums.length === 0) return out;
  const rows = await db
    .select({ id: rbInventories.id, setNum: rbInventories.setNum, version: rbInventories.version })
    .from(rbInventories)
    .where(inArray(rbInventories.setNum, setNums))
    .orderBy(desc(rbInventories.version));
  for (const r of rows) if (!out.has(r.setNum)) out.set(r.setNum, r.id);
  return out;
}

/**
 * The parts and minifigures of a catalog set, for the missing-piece picker. Sub-sets inside the set
 * (bundles) are folded in, multiplied by how many the set holds. Spares are kept and flagged, so the
 * picker can hide them by default. `version` picks an inventory version; the default is the newest.
 */
export async function loadSetInventory(
  db: Db,
  setNum: string,
  version?: number | null,
): Promise<SetInventory> {
  const own = await db
    .select({ id: rbInventories.id, version: rbInventories.version })
    .from(rbInventories)
    .where(eq(rbInventories.setNum, setNum))
    .orderBy(desc(rbInventories.version));
  const versions = own.map((o) => o.version);
  const chosen = (version != null ? own.find((o) => o.version === version) : undefined) ?? own[0];
  if (!chosen) return { version: null, versions: [], parts: [], figs: [] };

  // Sub-sets of this inventory, each with its own newest inventory.
  const subs = await db
    .select({ setNum: rbInventorySets.setNum, quantity: rbInventorySets.quantity })
    .from(rbInventorySets)
    .where(eq(rbInventorySets.inventoryId, chosen.id));
  const subIds = await latestInventoryIds(
    db,
    subs.map((s) => s.setNum),
  );
  const sources: { inventoryId: number; multiplier: number }[] = [
    { inventoryId: chosen.id, multiplier: 1 },
  ];
  for (const s of subs) {
    const id = subIds.get(s.setNum);
    if (id !== undefined) sources.push({ inventoryId: id, multiplier: s.quantity });
  }
  const multiplier = new Map(sources.map((s) => [s.inventoryId, s.multiplier]));
  const inventoryIds = sources.map((s) => s.inventoryId);

  const partRows = await db
    .select({
      inventoryId: rbInventoryParts.inventoryId,
      partNum: rbInventoryParts.partNum,
      name: rbParts.name,
      categoryId: rbParts.partCatId,
      categoryName: rbPartCategories.name,
      colorId: rbInventoryParts.colorId,
      colorName: rbColors.name,
      rgb: rbColors.rgb,
      isTrans: rbColors.isTrans,
      quantity: rbInventoryParts.quantity,
      isSpare: rbInventoryParts.isSpare,
    })
    .from(rbInventoryParts)
    .innerJoin(rbParts, eq(rbParts.partNum, rbInventoryParts.partNum))
    .innerJoin(rbColors, eq(rbColors.id, rbInventoryParts.colorId))
    .leftJoin(rbPartCategories, eq(rbPartCategories.id, rbParts.partCatId))
    .where(inArray(rbInventoryParts.inventoryId, inventoryIds));

  const merged = new Map<string, InventoryPart>();
  for (const r of partRows) {
    const key = `${r.partNum}|${r.colorId}|${r.isSpare}`;
    const add = r.quantity * (multiplier.get(r.inventoryId) ?? 1);
    const { inventoryId: _inventory, ...part } = r;
    const existing = merged.get(key);
    if (existing) existing.quantity += add;
    else merged.set(key, { ...part, quantity: add });
  }

  const figRows = await db
    .select({
      inventoryId: rbInventoryMinifigs.inventoryId,
      figNum: rbInventoryMinifigs.figNum,
      name: rbMinifigs.name,
      imgUrl: rbMinifigs.imgUrl,
      quantity: rbInventoryMinifigs.quantity,
    })
    .from(rbInventoryMinifigs)
    .innerJoin(rbMinifigs, eq(rbMinifigs.figNum, rbInventoryMinifigs.figNum))
    .where(inArray(rbInventoryMinifigs.inventoryId, inventoryIds));
  const figs = new Map<string, InventoryFig>();
  for (const r of figRows) {
    const add = r.quantity * (multiplier.get(r.inventoryId) ?? 1);
    const existing = figs.get(r.figNum);
    if (existing) existing.quantity += add;
    else figs.set(r.figNum, { figNum: r.figNum, name: r.name, imgUrl: r.imgUrl, quantity: add });
  }

  return {
    version: chosen.version,
    versions,
    parts: [...merged.values()],
    figs: [...figs.values()].toSorted((a, b) => a.name.localeCompare(b.name)),
  };
}

export interface InventoryQuery {
  q?: string;
  colorId?: number | null;
  categoryId?: number | null;
  /** Spare parts are hidden unless this is true. */
  spares?: boolean;
  offset?: number;
  limit?: number;
}

export interface InventoryPage {
  parts: InventoryPart[];
  total: number;
  /** Colours and categories among the parts that match everything except that filter itself. */
  colors: { id: number; name: string; rgb: string; n: number }[];
  categories: { id: number; name: string; n: number }[];
  spareCount: number;
}

const matchesText = (p: InventoryPart, q: string) =>
  p.name.toLowerCase().includes(q) ||
  p.partNum.toLowerCase().startsWith(q) ||
  p.colorName.toLowerCase().includes(q);

/** Filters, sorts and pages an inventory in memory. A set has at most a few thousand rows. */
export function queryInventory(parts: InventoryPart[], query: InventoryQuery = {}): InventoryPage {
  const q = (query.q ?? '').trim().toLowerCase();
  const visible = parts.filter((p) => query.spares || !p.isSpare);
  const byText = q ? visible.filter((p) => matchesText(p, q)) : visible;

  const count = <K extends string | number>(
    rows: InventoryPart[],
    key: (p: InventoryPart) => K | null,
  ) => {
    const m = new Map<K, number>();
    for (const r of rows) {
      const k = key(r);
      if (k !== null) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const colorRows =
    query.categoryId != null ? byText.filter((p) => p.categoryId === query.categoryId) : byText;
  const categoryRows =
    query.colorId != null ? byText.filter((p) => p.colorId === query.colorId) : byText;
  const colorCounts = count(colorRows, (p) => p.colorId);
  const categoryCounts = count(categoryRows, (p) => p.categoryId);
  const colorMeta = new Map(parts.map((p) => [p.colorId, p]));
  const categoryMeta = new Map(parts.map((p) => [p.categoryId, p.categoryName]));

  const matching = byText
    .filter((p) => (query.colorId == null ? true : p.colorId === query.colorId))
    .filter((p) => (query.categoryId == null ? true : p.categoryId === query.categoryId))
    .toSorted(
      (a, b) =>
        (a.categoryName ?? '').localeCompare(b.categoryName ?? '') ||
        a.name.localeCompare(b.name) ||
        a.partNum.localeCompare(b.partNum, undefined, { numeric: true }) ||
        a.colorName.localeCompare(b.colorName),
    );
  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.min(200, Math.max(1, query.limit ?? 60));
  return {
    parts: matching.slice(offset, offset + limit),
    total: matching.length,
    colors: [...colorCounts]
      .map(([id, n]) => ({
        id,
        name: colorMeta.get(id)!.colorName,
        rgb: colorMeta.get(id)!.rgb,
        n,
      }))
      .toSorted((a, b) => a.name.localeCompare(b.name)),
    categories: [...categoryCounts]
      .map(([id, n]) => ({ id, name: categoryMeta.get(id) ?? 'Other', n }))
      .toSorted((a, b) => a.name.localeCompare(b.name)),
    spareCount: parts.filter((p) => p.isSpare).length,
  };
}

// ---------------------------------------------------------------------------
// The whole parts catalog (for off-brand sets and parts not in the inventory)
// ---------------------------------------------------------------------------

export interface PartHit {
  partNum: string;
  name: string;
  categoryName: string | null;
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

/** Part number prefixes first (shortest first), then names that contain the text. */
export async function searchParts(db: Db, query: string, limit = 30): Promise<PartHit[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  const like = escapeLike(q);
  const select = {
    partNum: rbParts.partNum,
    name: rbParts.name,
    categoryName: rbPartCategories.name,
  };
  const byNumber = await db
    .select(select)
    .from(rbParts)
    .leftJoin(rbPartCategories, eq(rbPartCategories.id, rbParts.partCatId))
    .where(ilike(rbParts.partNum, `${like}%`))
    .orderBy(asc(sql`length(${rbParts.partNum})`), asc(rbParts.partNum))
    .limit(limit);
  if (byNumber.length >= limit) return byNumber;
  const taken = new Set(byNumber.map((p) => p.partNum));
  const byName = await db
    .select(select)
    .from(rbParts)
    .leftJoin(rbPartCategories, eq(rbPartCategories.id, rbParts.partCatId))
    .where(ilike(rbParts.name, `%${like}%`))
    .orderBy(
      sql`(lower(${rbParts.name}) like ${`${like.toLowerCase()}%`}) desc`,
      asc(sql`length(${rbParts.name})`),
      asc(rbParts.partNum),
    )
    .limit(limit + byNumber.length);
  return [...byNumber, ...byName.filter((p) => !taken.has(p.partNum))].slice(0, limit);
}

export interface PartColor {
  id: number;
  name: string;
  rgb: string;
  isTrans: boolean;
  /** The part is known to exist in this colour (from the elements list or any set inventory). */
  known: boolean;
}

/** Every colour, with the ones this part is known to exist in first. */
export async function partColors(db: Db, partNum: string): Promise<PartColor[]> {
  const [elements, inventories, all] = await Promise.all([
    db
      .selectDistinct({ id: rbElements.colorId })
      .from(rbElements)
      .where(eq(rbElements.partNum, partNum)),
    db
      .selectDistinct({ id: rbInventoryParts.colorId })
      .from(rbInventoryParts)
      .where(eq(rbInventoryParts.partNum, partNum)),
    db
      .select({
        id: rbColors.id,
        name: rbColors.name,
        rgb: rbColors.rgb,
        isTrans: rbColors.isTrans,
      })
      .from(rbColors)
      .orderBy(asc(rbColors.name)),
  ]);
  const known = new Set([...elements, ...inventories].map((r) => r.id));
  const mapped = all.map((c) => ({ ...c, known: known.has(c.id) }));
  return [...mapped.filter((c) => c.known), ...mapped.filter((c) => !c.known)];
}
