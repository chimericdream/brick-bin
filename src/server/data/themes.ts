import { and, asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { sets, themes } from '../db/schema';
import {
  createdFields,
  deletedFields,
  diffFields,
  recordAudit,
  stampCreate,
  stampUpdate,
} from './audit';
import type { DataContext } from './context';
import { assertCanWrite, setVisibilityCondition } from './visibility';

const nameInput = z.string().trim().min(1).max(100);

export async function listThemes(ctx: DataContext) {
  return ctx.db
    .select()
    .from(themes)
    .where(eq(themes.householdId, ctx.householdId))
    .orderBy(asc(sql`lower(${themes.name})`));
}

type Theme = Awaited<ReturnType<typeof listThemes>>[number];

function childrenMap(all: Theme[]) {
  const ids = new Set(all.map((t) => t.id));
  const children = new Map<string | null, Theme[]>();
  for (const t of all) {
    const key = t.parentId && ids.has(t.parentId) ? t.parentId : null;
    children.set(key, [...(children.get(key) ?? []), t]);
  }
  return children;
}

/** Picker options labelled with the full path ("Star Wars › Ultimate Collector Series"), tree order. */
export async function listThemeOptions(
  ctx: DataContext,
): Promise<{ value: string; label: string }[]> {
  const children = childrenMap(await listThemes(ctx));
  const out: { value: string; label: string }[] = [];
  const walk = (parent: string | null, prefix: string) => {
    for (const t of children.get(parent) ?? []) {
      const label = prefix ? `${prefix} › ${t.name}` : t.name;
      out.push({ value: t.id, label });
      walk(t.id, label);
    }
  };
  walk(null, '');
  return out;
}

/** Themes with how many sets this viewer may see in each (directly), for settings and filters. */
export async function listThemesWithCounts(ctx: DataContext) {
  const [all, counts] = await Promise.all([
    listThemes(ctx),
    ctx.db
      .select({ themeId: sets.themeId, n: sql<number>`count(*)::int` })
      .from(sets)
      .where(setVisibilityCondition(ctx))
      .groupBy(sets.themeId),
  ]);
  const direct = new Map(counts.map((c) => [c.themeId, c.n]));
  return all.map((t) => ({ ...t, sets: direct.get(t.id) ?? 0 }));
}

async function assertNoLoop(
  ctx: DataContext,
  parentId: string | null | undefined,
  selfId?: string,
) {
  if (!parentId) return;
  const byId = new Map((await listThemes(ctx)).map((t) => [t.id, t]));
  if (!byId.has(parentId)) throw new Error('Unknown parent theme');
  for (let cur = byId.get(parentId); cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) {
    if (cur.id === selfId) throw new Error('A theme cannot sit inside itself');
  }
}

export async function createTheme(
  ctx: DataContext,
  input: {
    name: string;
    parentId?: string | null;
    brandId?: string | null;
    rbThemeId?: number | null;
  },
) {
  assertCanWrite(ctx);
  const name = nameInput.parse(input.name);
  await assertNoLoop(ctx, input.parentId);
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(themes)
      .values({
        householdId: ctx.householdId,
        name,
        parentId: input.parentId ?? null,
        brandId: input.brandId ?? null,
        rbThemeId: input.rbThemeId ?? null,
        ...stampCreate(ctx),
      })
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'theme',
      entityId: row!.id,
      action: 'create',
      changes: createdFields({ name: row!.name, parentId: row!.parentId }),
    });
    return row!;
  });
}

export async function renameTheme(ctx: DataContext, id: string, rawName: string) {
  assertCanWrite(ctx);
  const name = nameInput.parse(rawName);
  return ctx.db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(themes)
      .where(and(eq(themes.id, id), eq(themes.householdId, ctx.householdId)));
    if (!before) throw new Error('Theme not found');
    const changes = diffFields(before, { name });
    if (Object.keys(changes).length === 0) return before;
    const [row] = await tx
      .update(themes)
      .set({ name, ...stampUpdate(ctx) })
      .where(eq(themes.id, id))
      .returning();
    await recordAudit(tx, ctx, { entityType: 'theme', entityId: id, action: 'update', changes });
    return row!;
  });
}

/** Moves every set (and sub-theme) from `fromId` to `intoId`, then removes `fromId`. */
export async function mergeThemes(ctx: DataContext, fromId: string, intoId: string) {
  assertCanWrite(ctx);
  if (fromId === intoId) throw new Error('Pick two different themes');
  await assertNoLoop(ctx, intoId, fromId);
  return ctx.db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(themes)
      .where(and(eq(themes.householdId, ctx.householdId)));
    const from = rows.find((t) => t.id === fromId);
    const into = rows.find((t) => t.id === intoId);
    if (!from || !into) throw new Error('Theme not found');
    await tx.update(sets).set({ themeId: intoId }).where(eq(sets.themeId, fromId));
    await tx.update(themes).set({ parentId: intoId }).where(eq(themes.parentId, fromId));
    await tx.delete(themes).where(eq(themes.id, fromId));
    await recordAudit(tx, ctx, {
      entityType: 'theme',
      entityId: fromId,
      action: 'delete',
      changes: { ...deletedFields({ name: from.name }), mergedInto: [null, into.name] },
    });
  });
}

export type DeleteThemeResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'in_use'; sets: number; children: number };

/** An unused theme is deleted for real (audited). One with sets or sub-themes is kept. */
export async function deleteTheme(ctx: DataContext, id: string): Promise<DeleteThemeResult> {
  assertCanWrite(ctx);
  return ctx.db.transaction(async (tx) => {
    const [theme] = await tx
      .select()
      .from(themes)
      .where(and(eq(themes.id, id), eq(themes.householdId, ctx.householdId)));
    if (!theme) return { ok: false, reason: 'not_found' } as const;
    const [s] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(sets)
      .where(eq(sets.themeId, id));
    const [c] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(themes)
      .where(eq(themes.parentId, id));
    if ((s?.n ?? 0) > 0 || (c?.n ?? 0) > 0) {
      return { ok: false, reason: 'in_use', sets: s?.n ?? 0, children: c?.n ?? 0 } as const;
    }
    await tx.delete(themes).where(eq(themes.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'theme',
      entityId: id,
      action: 'delete',
      changes: deletedFields({ name: theme.name }),
    });
    return { ok: true } as const;
  });
}
