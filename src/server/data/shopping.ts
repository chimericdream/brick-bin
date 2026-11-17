import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';

import {
  copyMissingItems,
  copies,
  rbColors,
  rbElements,
  rbPartCategories,
  rbPartRelationships,
  rbParts,
  sets,
  themes,
  users,
} from '../db/schema';
import type { DataContext } from './context';
import { listLocations } from './places';
import { listThemes } from './themes';
import { assertNotRestricted, copyVisibilityCondition } from './visibility';

export type ShoppingSort = 'color' | 'category' | 'set';

export interface ShoppingScope {
  /** Only these sets (for example "the sets in the library right now"). */
  setIds?: string[];
  copyIds?: string[];
  brandIds?: string[];
  themeIds?: string[];
  /** Copy owners; `none` means "ours". */
  ownerIds?: string[];
  locationIds?: string[];
  /** Rebrickable colour ids. */
  colorIds?: number[];
  sort?: ShoppingSort;
}

export interface ShoppingSource {
  itemId: string;
  copyId: string;
  setId: string;
  setName: string;
  /** "copy 2 of 3" is shown only when the set has several. */
  copyPosition: number;
  copiesInSet: number;
  quantity: number;
  /** For ordering "oldest missing rows first". */
  createdAt: Date;
}

export interface ShoppingGroup {
  /** Stable across requests: used for ticks in store-trip mode. */
  key: string;
  kind: 'part' | 'minifig' | 'other';
  partNum: string | null;
  colorId: number | null;
  figNum: string | null;
  name: string;
  colorName: string | null;
  rgb: string | null;
  categoryName: string | null;
  elementId: string | null;
  quantity: number;
  sources: ShoppingSource[];
  /** Other part numbers that will do ("alternate" and "mold" relatives in the catalog). */
  hints: string[];
}

export interface ShoppingList {
  groups: ShoppingGroup[];
  /** Total pieces and distinct lines, for the header. */
  pieces: number;
  lines: number;
}

const groupKey = (
  kind: string,
  part: string | null,
  color: number | null,
  fig: string | null,
  desc: string | null,
) =>
  kind === 'part'
    ? `p:${part}:${color}`
    : kind === 'minifig'
      ? `m:${fig}`
      : `o:${(desc ?? '').trim().toLowerCase()}`;

/** Ids of `roots` plus everything below them in a parent tree. */
function withDescendants(
  roots: string[],
  all: { id: string; parentId: string | null }[],
): string[] {
  const kids = new Map<string, string[]>();
  for (const n of all)
    if (n.parentId) kids.set(n.parentId, [...(kids.get(n.parentId) ?? []), n.id]);
  const out = new Set<string>();
  const walk = (id: string) => {
    if (out.has(id)) return;
    out.add(id);
    (kids.get(id) ?? []).forEach(walk);
  };
  roots.forEach(walk);
  return [...out];
}

/**
 * Every open missing item across all copies this viewer can see, grouped by part and colour with the
 * total quantity and the sets that need it. Kid profiles do not get a shopping list at all (the
 * decision after design review), so this refuses them. Parts that only hidden sets need are
 * excluded by the copy visibility rule, like everywhere else.
 */
export async function listShopping(
  ctx: DataContext,
  scope: ShoppingScope = {},
): Promise<ShoppingList> {
  assertNotRestricted(ctx, 'the shopping list');

  const conditions = [
    copyVisibilityCondition(ctx),
    isNull(copyMissingItems.resolvedAt),
    eq(copyMissingItems.householdId, ctx.householdId),
  ];
  if (scope.setIds?.length) conditions.push(inArray(sets.id, scope.setIds));
  if (scope.copyIds?.length) conditions.push(inArray(copies.id, scope.copyIds));
  if (scope.brandIds?.length) conditions.push(inArray(sets.brandId, scope.brandIds));
  if (scope.themeIds?.length) {
    conditions.push(inArray(sets.themeId, withDescendants(scope.themeIds, await listThemes(ctx))));
  }
  if (scope.locationIds?.length) {
    const real = scope.locationIds.filter((l) => l !== 'none');
    const ids = real.length ? withDescendants(real, await listLocations(ctx)) : [];
    conditions.push(
      or(
        ids.length ? inArray(copies.locationId, ids) : undefined,
        scope.locationIds.includes('none') ? isNull(copies.locationId) : undefined,
      )!,
    );
  }
  if (scope.ownerIds?.length) {
    const real = scope.ownerIds.filter((o) => o !== 'none');
    conditions.push(
      or(
        real.length ? inArray(copies.ownerUserId, real) : undefined,
        scope.ownerIds.includes('none') ? isNull(copies.ownerUserId) : undefined,
      )!,
    );
  }
  if (scope.colorIds?.length) conditions.push(inArray(copyMissingItems.rbColorId, scope.colorIds));

  const rows = await ctx.db
    .select({
      item: copyMissingItems,
      setId: sets.id,
      setName: sets.name,
      copyCreated: copies.createdAt,
      colorName: rbColors.name,
      rgb: rbColors.rgb,
      partName: rbParts.name,
      categoryName: rbPartCategories.name,
    })
    .from(copyMissingItems)
    .innerJoin(copies, eq(copies.id, copyMissingItems.copyId))
    .innerJoin(sets, eq(sets.id, copies.setId))
    .leftJoin(rbColors, eq(rbColors.id, copyMissingItems.rbColorId))
    .leftJoin(rbParts, eq(rbParts.partNum, copyMissingItems.rbPartNum))
    .leftJoin(rbPartCategories, eq(rbPartCategories.id, rbParts.partCatId))
    .where(and(...conditions))
    .orderBy(asc(copyMissingItems.createdAt), asc(copyMissingItems.id));

  // "copy 2 of 3" needs each set's live copies in order.
  const setIds = [...new Set(rows.map((r) => r.setId))];
  const siblings = setIds.length
    ? await ctx.db
        .select({ id: copies.id, setId: copies.setId })
        .from(copies)
        .where(and(inArray(copies.setId, setIds), isNull(copies.deletedAt)))
        .orderBy(asc(copies.createdAt), asc(copies.id))
    : [];
  const position = new Map<string, { n: number; of: number }>();
  const bySet = new Map<string, string[]>();
  for (const s of siblings) bySet.set(s.setId, [...(bySet.get(s.setId) ?? []), s.id]);
  for (const [, ids] of bySet)
    ids.forEach((id, i) => position.set(id, { n: i + 1, of: ids.length }));

  const groups = new Map<string, ShoppingGroup>();
  for (const r of rows) {
    const i = r.item;
    const key = groupKey(i.kind, i.rbPartNum, i.rbColorId, i.rbFigNum, i.description);
    const pos = position.get(i.copyId) ?? { n: 1, of: 1 };
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        kind: i.kind,
        partNum: i.rbPartNum,
        colorId: i.rbColorId,
        figNum: i.rbFigNum,
        name: r.partName ?? i.snapshotName ?? i.description ?? 'Piece',
        colorName: r.colorName ?? i.snapshotColorName,
        rgb: r.rgb ?? null,
        categoryName: r.categoryName ?? null,
        elementId: null,
        quantity: 0,
        sources: [],
        hints: [],
      };
      groups.set(key, g);
    }
    g.quantity += i.quantity;
    g.sources.push({
      itemId: i.id,
      copyId: i.copyId,
      setId: r.setId,
      setName: r.setName,
      copyPosition: pos.n,
      copiesInSet: pos.of,
      quantity: i.quantity,
      createdAt: i.createdAt,
    });
  }

  const list = [...groups.values()];
  await addCatalogExtras(ctx, list);

  const sort = scope.sort ?? 'color';
  const text = (s: string | null) => s ?? '';
  list.sort((a, b) => {
    // Parts first, then minifigures, then free text.
    const rank = (g: ShoppingGroup) => (g.kind === 'part' ? 0 : g.kind === 'minifig' ? 1 : 2);
    const byName =
      a.name.localeCompare(b.name) ||
      text(a.partNum).localeCompare(text(b.partNum), undefined, { numeric: true });
    if (sort === 'set') {
      return (
        text(a.sources[0]?.setName).localeCompare(text(b.sources[0]?.setName)) ||
        rank(a) - rank(b) ||
        text(a.colorName).localeCompare(text(b.colorName)) ||
        byName
      );
    }
    if (sort === 'category') {
      // Uncategorised lines (minifigures, free text) go last, then by name and colour.
      return (
        Number(a.categoryName === null) - Number(b.categoryName === null) ||
        text(a.categoryName).localeCompare(text(b.categoryName)) ||
        byName ||
        text(a.colorName).localeCompare(text(b.colorName))
      );
    }
    // Colour: how bins are organised in second-hand stores. Minifigs and "other" go last.
    return rank(a) - rank(b) || text(a.colorName).localeCompare(text(b.colorName)) || byName;
  });

  return {
    groups: list,
    pieces: list.reduce((n, g) => n + g.quantity, 0),
    lines: list.length,
  };
}

/** Element ids (for Pick a Brick style shopping) and alternate or mold part numbers. */
async function addCatalogExtras(ctx: DataContext, groups: ShoppingGroup[]) {
  const partNums = [...new Set(groups.flatMap((g) => (g.partNum ? [g.partNum] : [])))];
  if (partNums.length === 0) return;

  const elements = await ctx.db
    .select({
      partNum: rbElements.partNum,
      colorId: rbElements.colorId,
      elementId: rbElements.elementId,
    })
    .from(rbElements)
    .where(inArray(rbElements.partNum, partNums))
    .orderBy(asc(rbElements.elementId));
  const elementOf = new Map<string, string>();
  for (const e of elements) {
    const k = `${e.partNum}:${e.colorId}`;
    if (!elementOf.has(k)) elementOf.set(k, e.elementId);
  }

  // A (alternate) and M (mold) relatives, in both directions: "any of these will do".
  const rels = await ctx.db
    .select({
      rel: rbPartRelationships.relType,
      child: rbPartRelationships.childPartNum,
      parent: rbPartRelationships.parentPartNum,
    })
    .from(rbPartRelationships)
    .where(
      and(
        inArray(rbPartRelationships.relType, ['A', 'M']),
        or(
          inArray(rbPartRelationships.childPartNum, partNums),
          inArray(rbPartRelationships.parentPartNum, partNums),
        ),
      ),
    );
  const related = new Map<string, Set<string>>();
  const link = (a: string, b: string) => related.set(a, (related.get(a) ?? new Set()).add(b));
  for (const r of rels) {
    link(r.child, r.parent);
    link(r.parent, r.child);
  }
  for (const g of groups) {
    if (!g.partNum) continue;
    g.elementId = g.colorId === null ? null : (elementOf.get(`${g.partNum}:${g.colorId}`) ?? null);
    g.hints = [...(related.get(g.partNum) ?? [])].toSorted((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }
}

/** Filter choices for the shopping page: only things the viewer's open items actually use. */
export async function shoppingFacets(ctx: DataContext) {
  assertNotRestricted(ctx, 'the shopping list');
  const rows = await ctx.db
    .selectDistinct({
      colorId: copyMissingItems.rbColorId,
      colorName: rbColors.name,
      ownerId: copies.ownerUserId,
      ownerName: users.name,
      brandId: sets.brandId,
      themeId: sets.themeId,
      themeName: themes.name,
      locationId: copies.locationId,
    })
    .from(copyMissingItems)
    .innerJoin(copies, eq(copies.id, copyMissingItems.copyId))
    .innerJoin(sets, eq(sets.id, copies.setId))
    .leftJoin(rbColors, eq(rbColors.id, copyMissingItems.rbColorId))
    .leftJoin(users, eq(users.id, copies.ownerUserId))
    .leftJoin(themes, eq(themes.id, sets.themeId))
    .where(and(copyVisibilityCondition(ctx), isNull(copyMissingItems.resolvedAt)));
  const uniq = <T extends { id: string | number }>(xs: T[]) => [
    ...new Map(xs.map((x) => [x.id, x])).values(),
  ];
  return {
    colors: uniq(
      rows.flatMap((r) =>
        r.colorId === null ? [] : [{ id: r.colorId, name: r.colorName ?? `Colour ${r.colorId}` }],
      ),
    ).toSorted((a, b) => a.name.localeCompare(b.name)),
    owners: uniq(
      rows.flatMap((r) => (r.ownerId ? [{ id: r.ownerId, name: r.ownerName ?? 'Someone' }] : [])),
    ),
    brandIds: [...new Set(rows.map((r) => r.brandId))],
    themeIds: [...new Set(rows.flatMap((r) => (r.themeId ? [r.themeId] : [])))],
    locationIds: [...new Set(rows.flatMap((r) => (r.locationId ? [r.locationId] : [])))],
    hasUnowned: rows.some((r) => r.ownerId === null),
  };
}
