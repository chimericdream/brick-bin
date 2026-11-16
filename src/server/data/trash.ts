/**
 * The trash. Every "delete" in the app is a soft delete: the row keeps its data but is hidden
 * (`deleted_at` is set) until someone restores it, an admin deletes it for good, or it has been
 * in the trash longer than the retention period.
 *
 * This module holds the retention rules. Listing, restoring and purging per entity are added with
 * the entity tables (Phase 3), following docs/PLAN.md section 4 (restore guards).
 */

export const DEFAULT_RETENTION_DAYS = 30;

/** Days an item stays in the trash before it is purged. `0` keeps everything until an admin acts. */
export function retentionDays(env: Record<string, string | undefined> = process.env): number {
  const raw = env.TRASH_RETENTION_DAYS?.trim();
  if (!raw) return DEFAULT_RETENTION_DAYS;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_RETENTION_DAYS;
}

/** When an item deleted at `deletedAt` is purged automatically, or null if that is switched off. */
export function purgeDate(deletedAt: Date, days = retentionDays()): Date | null {
  return days > 0 ? new Date(deletedAt.getTime() + days * 86_400_000) : null;
}
