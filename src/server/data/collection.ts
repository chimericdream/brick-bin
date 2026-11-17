import { and, eq, sql } from 'drizzle-orm';

import { brands, copies, sets, themes } from '../db/schema';
import type { BuildState } from './completeness';
import type { DataContext } from './context';
import { assertNotRestricted, copyVisibilityCondition } from './visibility';

export interface Money {
  paidCents: number;
  estimatedCents: number;
}

export interface Breakdown extends Money {
  name: string;
  copies: number;
}

export interface CollectionSummary {
  sets: number;
  copies: number;
  /** Pieces in every copy: a 1,000-piece set owned twice counts 2,000. */
  pieces: number;
  paidCents: number;
  estimatedCents: number;
  /** Estimated minus paid, over copies that have both numbers (so it compares like with like). */
  differenceCents: number;
  /** How many copies have each number, so the totals can say what they cover. */
  copiesWithPrice: number;
  copiesWithEstimate: number;
  byBrand: Breakdown[];
  byTheme: Breakdown[];
  byState: { state: BuildState; copies: number }[];
  /** Copies whose estimated value is missing, or was set more than a year ago. */
  staleValues: {
    copyId: string;
    setId: string;
    setName: string;
    estimatedCents: number | null;
    valuedOn: string | null;
  }[];
  sealed: { setId: string; name: string; copies: number }[];
  withMissing: { copies: number; pieces: number };
}

const STALE_DAYS = 365;

/**
 * The collection page: totals and breakdowns over every live copy this viewer can see. Money and the
 * collection page are for members and admins only, so a kid profile is refused here, not just hidden.
 */
export async function getCollection(
  ctx: DataContext,
  now = new Date(),
): Promise<CollectionSummary> {
  assertNotRestricted(ctx, 'the collection');

  const rows = await ctx.db
    .select({
      copyId: copies.id,
      setId: sets.id,
      setName: sets.name,
      brandName: brands.name,
      themeId: sets.themeId,
      pieceCount: sets.pieceCount,
      buildState: copies.buildState,
      paid: copies.pricePaidCents,
      estimated: copies.estimatedValueCents,
      valuedOn: copies.valuedOn,
      createdAt: copies.createdAt,
      missing: sql<number>`(select coalesce(sum(m.quantity), 0)::int from copy_missing_items m
        where m.copy_id = ${copies.id} and m.resolved_at is null)`,
    })
    .from(copies)
    .innerJoin(sets, eq(sets.id, copies.setId))
    .innerJoin(brands, eq(brands.id, sets.brandId))
    .where(and(copyVisibilityCondition(ctx)));

  const themeRows = await ctx.db
    .select({ id: themes.id, name: themes.name, parentId: themes.parentId })
    .from(themes)
    .where(eq(themes.householdId, ctx.householdId));
  const themeById = new Map(themeRows.map((t) => [t.id, t]));
  const rootName = (id: string | null): string => {
    const seen = new Set<string>();
    let cur = id ? themeById.get(id) : undefined;
    while (cur?.parentId && !seen.has(cur.id) && themeById.has(cur.parentId)) {
      seen.add(cur.id);
      cur = themeById.get(cur.parentId);
    }
    return cur?.name ?? 'No theme';
  };

  const bucket = (
    map: Map<string, Breakdown>,
    name: string,
    r: { paid: number | null; estimated: number | null },
  ) => {
    const b = map.get(name) ?? { name, copies: 0, paidCents: 0, estimatedCents: 0 };
    b.copies += 1;
    b.paidCents += r.paid ?? 0;
    b.estimatedCents += r.estimated ?? 0;
    map.set(name, b);
  };

  const brandMap = new Map<string, Breakdown>();
  const themeMap = new Map<string, Breakdown>();
  const stateCount = new Map<BuildState, number>();
  const setIds = new Set<string>();
  const sealedBySet = new Map<string, { setId: string; name: string; copies: number }>();
  const cutoff = new Date(now.getTime() - STALE_DAYS * 86_400_000).toISOString().slice(0, 10);

  let paidCents = 0;
  let estimatedCents = 0;
  let paidWithBoth = 0;
  let estimatedWithBoth = 0;
  let copiesWithPrice = 0;
  let copiesWithEstimate = 0;
  let pieces = 0;
  const missing = { copies: 0, pieces: 0 };
  const stale: CollectionSummary['staleValues'] = [];

  for (const r of rows) {
    setIds.add(r.setId);
    pieces += r.pieceCount ?? 0;
    if (r.paid !== null) {
      paidCents += r.paid;
      copiesWithPrice++;
    }
    if (r.estimated !== null) {
      estimatedCents += r.estimated;
      copiesWithEstimate++;
    }
    if (r.paid !== null && r.estimated !== null) {
      paidWithBoth += r.paid;
      estimatedWithBoth += r.estimated;
    }
    bucket(brandMap, r.brandName, r);
    bucket(themeMap, rootName(r.themeId), r);
    stateCount.set(r.buildState, (stateCount.get(r.buildState) ?? 0) + 1);
    if (r.buildState === 'sealed') {
      const s = sealedBySet.get(r.setId) ?? { setId: r.setId, name: r.setName, copies: 0 };
      s.copies += 1;
      sealedBySet.set(r.setId, s);
    }
    if (r.missing > 0 && r.buildState !== 'sealed') {
      missing.copies += 1;
      missing.pieces += r.missing;
    }
    if (r.estimated === null || r.valuedOn === null || r.valuedOn < cutoff) {
      stale.push({
        copyId: r.copyId,
        setId: r.setId,
        setName: r.setName,
        estimatedCents: r.estimated,
        valuedOn: r.valuedOn,
      });
    }
  }

  const byValue = (a: Breakdown, b: Breakdown) =>
    b.estimatedCents - a.estimatedCents || b.copies - a.copies || a.name.localeCompare(b.name);

  return {
    sets: setIds.size,
    copies: rows.length,
    pieces,
    paidCents,
    estimatedCents,
    differenceCents: estimatedWithBoth - paidWithBoth,
    copiesWithPrice,
    copiesWithEstimate,
    byBrand: [...brandMap.values()].toSorted(byValue),
    byTheme: [...themeMap.values()].toSorted(byValue),
    byState: [...stateCount]
      .map(([state, n]) => ({ state, copies: n }))
      .toSorted((a, b) => b.copies - a.copies),
    // Never valued first, then oldest.
    staleValues: stale
      .toSorted(
        (a, b) =>
          (a.valuedOn ?? '').localeCompare(b.valuedOn ?? '') || a.setName.localeCompare(b.setName),
      )
      .slice(0, 50),
    sealed: [...sealedBySet.values()].toSorted((a, b) => a.name.localeCompare(b.name)),
    withMissing: missing,
  };
}
