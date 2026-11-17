import { and, asc, desc, eq, gte, inArray, isNull, lte, or, sql, type SQL } from 'drizzle-orm';

import { brands, copies, setInstructions, setTags, sets, tags, themes } from '../db/schema';
import { completenessOf, type BuildState, type Completeness } from './completeness';
import type { DataContext } from './context';
import {
  PAGE_SIZE,
  PIECE_BANDS,
  type CompletenessFilter,
  type LibraryFilters,
} from './library-filters';
import { openMissingByCopy } from './missing';
import { listLocations } from './places';
import { listThemes } from './themes';
import { copyVisibilityCondition, isRestricted, setVisibilityCondition } from './visibility';

/** Open missing pieces on a copy: the sum of the quantities of its unresolved rows. */
const missingCount = sql`(select coalesce(sum(m.quantity), 0) from copy_missing_items m
  where m.copy_id = ${copies.id} and m.resolved_at is null)`;

const notSealed = sql`${copies.buildState} <> 'sealed'`;

const completenessSql: Record<CompletenessFilter, SQL> = {
  missing: sql`(${notSealed} and ${missingCount} > 0)`,
  complete: sql`(${notSealed} and ${missingCount} = 0 and ${copies.piecesCheckedOn} is not null)`,
  not_checked: sql`(${notSealed} and ${missingCount} = 0 and ${copies.piecesCheckedOn} is null)`,
};

/** `rootIds` plus everything below them in a parent tree. */
function withDescendants(rootIds: string[], all: { id: string; parentId: string | null }[]) {
  const children = new Map<string, string[]>();
  for (const n of all) {
    if (n.parentId) children.set(n.parentId, [...(children.get(n.parentId) ?? []), n.id]);
  }
  const out = new Set<string>();
  const walk = (id: string) => {
    if (out.has(id)) return;
    out.add(id);
    for (const c of children.get(id) ?? []) walk(c);
  };
  rootIds.forEach(walk);
  return [...out];
}

interface Resolved {
  f: LibraryFilters;
  themeIds: string[];
  locationIds: string[];
}

type Omit =
  | 'instructions'
  | 'brand'
  | 'theme'
  | 'tag'
  | 'band'
  | 'state'
  | 'completeness'
  | 'location'
  | 'owner';

function setConditions(ctx: DataContext, r: Resolved, omit?: Omit): SQL[] {
  const { f } = r;
  const out: SQL[] = [setVisibilityCondition(ctx)];
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, '\\$&')}%`;
    out.push(
      sql`(${sets.name} ilike ${like} or ${sets.setNumber} ilike ${like} or ${sets.designer} ilike ${like}
        or ${brands.name} ilike ${like} or ${themes.name} ilike ${like})`,
    );
  }
  if (f.brands.length && omit !== 'brand') out.push(inArray(sets.brandId, f.brands));
  if (f.themes.length && omit !== 'theme') out.push(inArray(sets.themeId, r.themeIds));
  if (f.tags.length && omit !== 'tag') {
    const lower = f.tags.map((t) => t.toLowerCase());
    out.push(
      sql`exists (select 1 from set_tags st join tags t on t.id = st.tag_id
        where st.set_id = ${sets.id} and lower(t.name) in ${lower})`,
    );
  }
  if (f.hasInstructions && omit !== 'instructions') {
    out.push(
      sql`exists (select 1 from ${setInstructions} where ${setInstructions.setId} = ${sets.id}
        and ${setInstructions.deletedAt} is null)`,
    );
  }
  if (f.yearMin !== null) out.push(gte(sets.year, f.yearMin));
  if (f.yearMax !== null) out.push(lte(sets.year, f.yearMax));
  if (f.bands.length && omit !== 'band') {
    const ranges = PIECE_BANDS.filter((b) => f.bands.includes(b.id)).map((b) =>
      b.max === null
        ? gte(sets.pieceCount, b.min)
        : and(gte(sets.pieceCount, b.min), lte(sets.pieceCount, b.max)),
    );
    out.push(or(...ranges) as SQL);
  }
  return out;
}

function copyConditions(ctx: DataContext, r: Resolved, omit?: Omit): SQL[] {
  const { f } = r;
  const out: SQL[] = [eq(copies.householdId, ctx.householdId), isNull(copies.deletedAt)];
  if (f.states.length && omit !== 'state') out.push(inArray(copies.buildState, f.states));
  if (f.completeness.length && omit !== 'completeness') {
    out.push(or(...f.completeness.map((c) => completenessSql[c])) as SQL);
  }
  if (f.locations.length && omit !== 'location') {
    const real = r.locationIds;
    out.push(
      or(
        real.length ? inArray(copies.locationId, real) : undefined,
        f.locations.includes('none') ? isNull(copies.locationId) : undefined,
      ) as SQL,
    );
  }
  if (f.owners.length && omit !== 'owner') {
    const real = f.owners.filter((o) => o !== 'none');
    out.push(
      or(
        real.length ? inArray(copies.ownerUserId, real) : undefined,
        f.owners.includes('none') ? isNull(copies.ownerUserId) : undefined,
      ) as SQL,
    );
  }
  return out;
}

/** True when the filters constrain individual copies, not only the set. */
const hasCopyFilters = (f: LibraryFilters, omit?: Omit) =>
  (f.states.length > 0 && omit !== 'state') ||
  (f.completeness.length > 0 && omit !== 'completeness') ||
  (f.locations.length > 0 && omit !== 'location') ||
  (f.owners.length > 0 && omit !== 'owner');

/** Sets must own a matching copy, unless "include sets with no copies" is on and no copy filter applies. */
function ownedCondition(ctx: DataContext, r: Resolved, omit?: Omit): SQL | undefined {
  if (r.f.includeUnowned && !hasCopyFilters(r.f, omit)) return undefined;
  return sql`exists (select 1 from ${copies} where ${copies.setId} = ${sets.id}
    and ${and(...copyConditions(ctx, r, omit))})`;
}

export interface TileCopy {
  id: string;
  buildState: BuildState;
  completeness: Completeness;
}

export interface LibraryTile {
  id: string;
  name: string;
  setNumber: string | null;
  year: number | null;
  brandName: string;
  hasCover: boolean;
  hiddenFromRestricted: boolean;
  /** Every live copy, oldest first. The tile shows up to three and a "+N more" for the rest. */
  copies: TileCopy[];
}

export interface Facets {
  brands: Record<string, number>;
  /** Rolled up: a parent theme counts the sets in its sub-themes. */
  themes: Record<string, number>;
  tags: Record<string, number>;
  bands: Record<string, number>;
  states: Record<string, number>;
  completeness: Record<CompletenessFilter, number>;
  /** Rolled up like themes; `none` counts copies with no place. */
  locations: Record<string, number>;
  /** `none` counts copies owned by "Ours". */
  owners: Record<string, number>;
  /** Sets with at least one instruction, under the other filters. */
  instructions: number;
  /** Sets owned versus all visible sets, for the include-unowned toggle. */
  unowned: number;
}

export interface LibraryPage {
  tiles: LibraryTile[];
  total: number;
  page: number;
  pages: number;
  facets: Facets;
}

const orderBy = (f: LibraryFilters, ctx: DataContext) => {
  const tie = [asc(sql`lower(${sets.name})`), asc(sets.id)];
  switch (f.sort) {
    case 'number':
      // Natural order: 75192 sorts after 7140. Non-numeric numbers (C61042W) follow, by text.
      return [
        sql`(substring(${sets.setNumber} from '^[0-9]+'))::bigint asc nulls last`,
        asc(sets.setNumber),
        ...tie,
      ];
    case 'year':
      return [sql`${sets.year} desc nulls last`, ...tie];
    case 'pieces':
      return [sql`${sets.pieceCount} desc nulls last`, ...tie];
    case 'recent':
      return [desc(sets.createdAt), asc(sets.id)];
    case 'value':
      // Restricted viewers never reach this branch (parseLibraryFilters falls back to name).
      if (isRestricted(ctx)) return tie;
      return [
        sql`(select coalesce(sum(${copies.estimatedValueCents}), 0) from ${copies}
          where ${copies.setId} = ${sets.id} and ${copies.deletedAt} is null) desc`,
        ...tie,
      ];
    default:
      return tie;
  }
};

export async function listLibrary(ctx: DataContext, f: LibraryFilters): Promise<LibraryPage> {
  const [allThemes, allLocations] = await Promise.all([listThemes(ctx), listLocations(ctx)]);
  const r: Resolved = {
    f,
    themeIds: withDescendants(f.themes, allThemes),
    locationIds: withDescendants(
      f.locations.filter((l) => l !== 'none'),
      allLocations,
    ),
  };

  const where = and(...setConditions(ctx, r), ownedCondition(ctx, r));

  const [{ n: total } = { n: 0 }] = await ctx.db
    .select({ n: sql<number>`count(*)::int` })
    .from(sets)
    .innerJoin(brands, eq(brands.id, sets.brandId))
    .leftJoin(themes, eq(themes.id, sets.themeId))
    .where(where);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.page, pages);
  const rows = await ctx.db
    .select({
      id: sets.id,
      name: sets.name,
      setNumber: sets.setNumber,
      year: sets.year,
      brandName: brands.name,
      coverImage: sets.coverImage,
      hidden: sets.hiddenFromRestricted,
    })
    .from(sets)
    .innerJoin(brands, eq(brands.id, sets.brandId))
    .leftJoin(themes, eq(themes.id, sets.themeId))
    .where(where)
    .orderBy(...orderBy(f, ctx))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const ids = rows.map((x) => x.id);
  const copyRows = ids.length
    ? await ctx.db
        .select({
          id: copies.id,
          setId: copies.setId,
          buildState: copies.buildState,
          piecesCheckedOn: copies.piecesCheckedOn,
        })
        .from(copies)
        .innerJoin(sets, eq(sets.id, copies.setId))
        .where(and(copyVisibilityCondition(ctx), inArray(copies.setId, ids)))
        .orderBy(asc(copies.createdAt), asc(copies.id))
    : [];
  const missing = await openMissingByCopy(
    ctx,
    copyRows.map((c) => c.id),
  );
  const bySet = new Map<string, TileCopy[]>();
  for (const c of copyRows) {
    bySet.set(c.setId, [
      ...(bySet.get(c.setId) ?? []),
      {
        id: c.id,
        buildState: c.buildState,
        completeness: completenessOf({
          buildState: c.buildState,
          piecesCheckedOn: c.piecesCheckedOn,
          missingPieces: missing.get(c.id) ?? 0,
        }),
      },
    ]);
  }

  const tiles: LibraryTile[] = rows.map((x) => ({
    id: x.id,
    name: x.name,
    setNumber: x.setNumber,
    year: x.year,
    brandName: x.brandName,
    hasCover: x.coverImage !== null,
    hiddenFromRestricted: !isRestricted(ctx) && x.hidden,
    copies: bySet.get(x.id) ?? [],
  }));

  return {
    tiles,
    total,
    page,
    pages,
    facets: await loadFacets(ctx, r, { allThemes, allLocations }),
  };
}

const toMap = (rows: { key: string | null; n: number }[], none?: string) =>
  Object.fromEntries(
    rows.filter((x) => x.key !== null || none).map((x) => [x.key ?? none!, x.n]),
  ) as Record<string, number>;

/** Adds each node's count to all its ancestors (a set sits under one theme, so sums are exact). */
const rollUp = (
  direct: Record<string, number>,
  nodes: { id: string; parentId: string | null }[],
) => {
  const parent = new Map(nodes.map((n) => [n.id, n.parentId]));
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(direct)) {
    const seen = new Set<string>();
    for (let cur: string | null | undefined = id; cur && !seen.has(cur); cur = parent.get(cur)) {
      seen.add(cur);
      out[cur] = (out[cur] ?? 0) + n;
    }
  }
  return out;
};

async function loadFacets(
  ctx: DataContext,
  r: Resolved,
  trees: {
    allThemes: { id: string; parentId: string | null }[];
    allLocations: { id: string; parentId: string | null }[];
  },
): Promise<Facets> {
  const setFacet = (omit: Omit) =>
    and(...setConditions(ctx, r, omit), ownedCondition(ctx, r, omit));

  const [
    brandRows,
    themeRows,
    tagRows,
    bandRow,
    stateRows,
    compRow,
    locRows,
    ownerRows,
    unownedRow,
    insRow,
  ] = await Promise.all([
    ctx.db
      .select({ key: sets.brandId, n: sql<number>`count(*)::int` })
      .from(sets)
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .where(setFacet('brand'))
      .groupBy(sets.brandId),
    ctx.db
      .select({ key: sets.themeId, n: sql<number>`count(*)::int` })
      .from(sets)
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .where(setFacet('theme'))
      .groupBy(sets.themeId),
    ctx.db
      .select({ key: tags.name, n: sql<number>`count(distinct ${sets.id})::int` })
      .from(sets)
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .innerJoin(setTags, eq(setTags.setId, sets.id))
      .innerJoin(tags, eq(tags.id, setTags.tagId))
      .where(and(...setConditions(ctx, r, 'tag'), ownedCondition(ctx, r, 'tag')))
      .groupBy(tags.name),
    ctx.db
      .select({
        lt250: sql<number>`count(*) filter (where ${sets.pieceCount} < 250)::int`,
        b250: sql<number>`count(*) filter (where ${sets.pieceCount} between 250 and 999)::int`,
        b1000: sql<number>`count(*) filter (where ${sets.pieceCount} between 1000 and 2999)::int`,
        b3000: sql<number>`count(*) filter (where ${sets.pieceCount} >= 3000)::int`,
      })
      .from(sets)
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .where(setFacet('band')),
    ctx.db
      .select({ key: copies.buildState, n: sql<number>`count(distinct ${sets.id})::int` })
      .from(copies)
      .innerJoin(sets, eq(sets.id, copies.setId))
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .where(and(...setConditions(ctx, r), ...copyConditions(ctx, r, 'state')))
      .groupBy(copies.buildState),
    ctx.db
      .select({
        missing: sql<number>`count(distinct ${sets.id}) filter (where ${completenessSql.missing})::int`,
        complete: sql<number>`count(distinct ${sets.id}) filter (where ${completenessSql.complete})::int`,
        not_checked: sql<number>`count(distinct ${sets.id}) filter (where ${completenessSql.not_checked})::int`,
      })
      .from(copies)
      .innerJoin(sets, eq(sets.id, copies.setId))
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .where(and(...setConditions(ctx, r), ...copyConditions(ctx, r, 'completeness'))),
    ctx.db
      .selectDistinct({ key: copies.locationId, setId: sets.id })
      .from(copies)
      .innerJoin(sets, eq(sets.id, copies.setId))
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .where(and(...setConditions(ctx, r), ...copyConditions(ctx, r, 'location'))),
    ctx.db
      .select({ key: copies.ownerUserId, n: sql<number>`count(distinct ${sets.id})::int` })
      .from(copies)
      .innerJoin(sets, eq(sets.id, copies.setId))
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .where(and(...setConditions(ctx, r), ...copyConditions(ctx, r, 'owner')))
      .groupBy(copies.ownerUserId),
    ctx.db
      .select({ n: sql<number>`count(*)::int` })
      .from(sets)
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .where(
        and(
          ...setConditions(ctx, r),
          sql`not exists (select 1 from ${copies} where ${copies.setId} = ${sets.id}
              and ${copies.deletedAt} is null)`,
        ),
      ),
    // Sets with instructions, under every other filter but this one.
    ctx.db
      .select({ n: sql<number>`count(*)::int` })
      .from(sets)
      .innerJoin(brands, eq(brands.id, sets.brandId))
      .leftJoin(themes, eq(themes.id, sets.themeId))
      .where(
        and(
          ...setConditions(ctx, r, 'instructions'),
          ownedCondition(ctx, r),
          sql`exists (select 1 from ${setInstructions} where ${setInstructions.setId} = ${sets.id}
            and ${setInstructions.deletedAt} is null)`,
        ),
      ),
  ]);

  // Places: a set with copies in two places under one parent counts once for the parent.
  const locParent = new Map(trees.allLocations.map((n) => [n.id, n.parentId]));
  const locSets = new Map<string, Set<string>>();
  for (const row of locRows) {
    const seen = new Set<string>();
    for (
      let cur: string | null | undefined = row.key ?? 'none';
      cur && !seen.has(cur);
      cur = cur === 'none' ? null : locParent.get(cur)
    ) {
      seen.add(cur);
      locSets.set(cur, (locSets.get(cur) ?? new Set()).add(row.setId));
    }
  }

  const band = bandRow[0] ?? { lt250: 0, b250: 0, b1000: 0, b3000: 0 };
  const comp = compRow[0] ?? { missing: 0, complete: 0, not_checked: 0 };

  return {
    brands: toMap(brandRows),
    themes: rollUp(toMap(themeRows), trees.allThemes),
    tags: Object.fromEntries(
      (tagRows as unknown as { key: string; n: number }[]).map((x) => [x.key, x.n]),
    ),
    bands: { lt250: band.lt250, '250': band.b250, '1000': band.b1000, '3000': band.b3000 },
    states: toMap(stateRows),
    completeness: comp,
    locations: Object.fromEntries([...locSets].map(([k, v]) => [k, v.size])),
    owners: toMap(ownerRows, 'none'),
    unowned: unownedRow[0]?.n ?? 0,
    instructions: insRow[0]?.n ?? 0,
  };
}

/**
 * Ids of every set that matches the filters, not just one page (up to 500), for "Shopping list for
 * these": the same rules as the library itself, including what a viewer may see.
 */
export async function libraryMatchingSetIds(
  ctx: DataContext,
  f: LibraryFilters,
): Promise<string[]> {
  const [allThemes, allLocations] = await Promise.all([listThemes(ctx), listLocations(ctx)]);
  const r: Resolved = {
    f,
    themeIds: withDescendants(f.themes, allThemes),
    locationIds: withDescendants(
      f.locations.filter((l) => l !== 'none'),
      allLocations,
    ),
  };
  const rows = await ctx.db
    .select({ id: sets.id })
    .from(sets)
    .innerJoin(brands, eq(brands.id, sets.brandId))
    .leftJoin(themes, eq(themes.id, sets.themeId))
    .where(and(...setConditions(ctx, r), ownedCondition(ctx, r)))
    .limit(500);
  return rows.map((x) => x.id);
}
