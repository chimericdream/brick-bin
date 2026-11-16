import { and, eq, isNull, type SQL } from 'drizzle-orm';

import { copies, sets } from '../db/schema';
import type { DataContext } from './context';

/**
 * Role guards and visibility rules used by every data-layer function. Restricted (kid) profiles are
 * read-only except for their own wishlist, so mutations reject them here rather than relying on
 * hidden buttons.
 */

export const isRestricted = (ctx: Pick<DataContext, 'viewer'>) => ctx.viewer.role === 'restricted';
export const isAdmin = (ctx: Pick<DataContext, 'viewer'>) => ctx.viewer.role === 'admin';

/** For every mutation except a restricted viewer's own wishlist items. */
export function assertCanWrite(ctx: Pick<DataContext, 'viewer'>): void {
  if (isRestricted(ctx)) throw new Error('Restricted profiles cannot make changes');
}

export function assertAdmin(ctx: Pick<DataContext, 'viewer'>): void {
  if (!isAdmin(ctx)) throw new Error('Only admins can do this');
}

/** For reads that must never reach a restricted viewer (activity, collection value, trash). */
export function assertNotRestricted(ctx: Pick<DataContext, 'viewer'>, what: string): void {
  if (isRestricted(ctx)) throw new Error(`Restricted profiles cannot see ${what}`);
}

// ---------------------------------------------------------------------------
// Sets and copies
// ---------------------------------------------------------------------------

/**
 * SQL condition: which set rows this viewer may see at all. Always scoped to the household, never
 * includes trashed sets, and for restricted viewers leaves out sets hidden from them.
 */
export function setVisibilityCondition(ctx: DataContext): SQL {
  const base = and(eq(sets.householdId, ctx.householdId), isNull(sets.deletedAt)) as SQL;
  return isRestricted(ctx) ? (and(base, eq(sets.hiddenFromRestricted, false)) as SQL) : base;
}

/** Live copies of visible sets (join `sets` on `copies.setId`). */
export function copyVisibilityCondition(ctx: DataContext): SQL {
  return and(
    eq(copies.householdId, ctx.householdId),
    isNull(copies.deletedAt),
    setVisibilityCondition(ctx),
  ) as SQL;
}

/**
 * Strip money from a set row for restricted viewers. Defence in depth for code paths that load
 * rows without going through a query that already omits these fields.
 */
export function redactSet<T extends { retailPriceCents: number | null }>(
  set: T,
  viewer: DataContext['viewer'],
): T {
  if (viewer.role !== 'restricted') return set;
  return { ...set, retailPriceCents: null };
}

export function redactCopy<
  T extends {
    pricePaidCents: number | null;
    estimatedValueCents: number | null;
    valuedOn: string | null;
  },
>(copy: T, viewer: DataContext['viewer']): T {
  if (viewer.role !== 'restricted') return copy;
  return { ...copy, pricePaidCents: null, estimatedValueCents: null, valuedOn: null };
}
