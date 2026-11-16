import { and, asc, eq, inArray, notInArray, sql } from 'drizzle-orm';

import type { Db } from '../db/client';
import { setTags, sets, tags } from '../db/schema';
import { createdFields, recordAudit } from './audit';
import type { DataContext } from './context';
import { isRestricted } from './visibility';

/** Tags with counts of visible sets. A tag used only on hidden sets stays out of a kid's list. */
export async function listTags(ctx: DataContext) {
  const visible = isRestricted(ctx)
    ? sql`${sets.deletedAt} is null and ${sets.hiddenFromRestricted} = false`
    : sql`${sets.deletedAt} is null`;
  const rows = await ctx.db
    .select({
      id: tags.id,
      name: tags.name,
      sets: sql<number>`count(${sets.id}) filter (where ${visible})::int`,
    })
    .from(tags)
    .leftJoin(setTags, eq(setTags.tagId, tags.id))
    .leftJoin(sets, eq(sets.id, setTags.setId))
    .where(eq(tags.householdId, ctx.householdId))
    .groupBy(tags.id)
    .orderBy(asc(sql`lower(${tags.name})`));
  return isRestricted(ctx) ? rows.filter((r) => r.sets > 0) : rows;
}

/**
 * Replaces a set's tags with `names`, creating missing tags (audited). Call inside the set's
 * transaction. Returns the sorted before and after names for the set's own audit entry.
 */
export async function replaceSetTags(
  tx: Db,
  ctx: DataContext,
  setId: string,
  names: string[],
): Promise<{ before: string[]; after: string[] }> {
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const raw of names) {
    const n = raw.trim();
    if (!n || n.length > 50 || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    clean.push(n);
  }
  const existing = await tx
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.householdId, ctx.householdId));
  const byLower = new Map(existing.map((t) => [t.name.toLowerCase(), t]));
  const current = await tx
    .select({ name: tags.name })
    .from(setTags)
    .innerJoin(tags, eq(tags.id, setTags.tagId))
    .where(eq(setTags.setId, setId));
  const before = current.map((c) => c.name).toSorted();

  const ids: string[] = [];
  for (const name of clean) {
    let tag = byLower.get(name.toLowerCase());
    if (!tag) {
      const [row] = await tx
        .insert(tags)
        .values({ householdId: ctx.householdId, name })
        .returning({ id: tags.id, name: tags.name });
      tag = row!;
      await recordAudit(tx, ctx, {
        entityType: 'tag',
        entityId: tag.id,
        action: 'create',
        changes: createdFields({ name }),
      });
    }
    ids.push(tag.id);
  }
  await tx
    .delete(setTags)
    .where(and(eq(setTags.setId, setId), ids.length ? notInArray(setTags.tagId, ids) : undefined));
  if (ids.length) {
    await tx
      .insert(setTags)
      .values(ids.map((tagId) => ({ householdId: ctx.householdId, setId, tagId })))
      .onConflictDoNothing();
  }
  return { before, after: clean.toSorted() };
}

export async function tagNamesForSets(ctx: DataContext, setIds: string[]) {
  const out = new Map<string, string[]>();
  if (setIds.length === 0) return out;
  const rows = await ctx.db
    .select({ setId: setTags.setId, name: tags.name })
    .from(setTags)
    .innerJoin(tags, eq(tags.id, setTags.tagId))
    .where(and(eq(setTags.householdId, ctx.householdId), inArray(setTags.setId, setIds)))
    .orderBy(asc(sql`lower(${tags.name})`));
  for (const r of rows) out.set(r.setId, [...(out.get(r.setId) ?? []), r.name]);
  return out;
}
