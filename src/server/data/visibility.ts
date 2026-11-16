import type { DataContext } from './context';

/**
 * Role guards used by every data-layer function. Restricted (kid) profiles are read-only except
 * for their own wishlist, so mutations reject them here rather than relying on hidden buttons.
 * Set-level SQL conditions and field redaction are added with the set tables (Phase 3).
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
