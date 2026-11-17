import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { brands, users, wishlistItems, wishlistPurchases } from '../db/schema';
import {
  createdFields,
  diffFields,
  recordAudit,
  stampCreate,
  stampTrash,
  stampUpdate,
  trashedFields,
} from './audit';
import { addCopies, type CopyInput } from './copies';
import type { DataContext } from './context';
import { isUuid } from './ids';
import { createSet, type SetInput } from './sets';
import { assertCanWrite, isAdmin, isRestricted } from './visibility';

export type WishItem = typeof wishlistItems.$inferSelect;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => {
    if (v === null) return true;
    try {
      return ['http:', 'https:'].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, 'Enter a web address that starts with https://');

export const wishInput = z.object({
  title: z.string().trim().min(1, 'Give the wish a name').max(200),
  brandId: z
    .uuid()
    .nullish()
    .transform((v) => v ?? null),
  setNumber: optionalText(40),
  rbSetNum: optionalText(40),
  url: optionalUrl,
  priceCents: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
      z.number().int().min(0).max(100_000_000).nullable(),
    )
    .default(null),
  notes: optionalText(1000),
});
export type WishInput = z.input<typeof wishInput>;

/** Who may change an item: its owner, or an admin. Kid profiles can only ever touch their own. */
function canChange(ctx: DataContext, item: Pick<WishItem, 'requestedByUserId'>) {
  return item.requestedByUserId === ctx.viewer.userId || isAdmin(ctx);
}

async function ownedItem(ctx: DataContext, id: string, opts: { includeTrashed?: boolean } = {}) {
  if (!isUuid(id)) return null;
  const [row] = await ctx.db
    .select()
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.id, id),
        eq(wishlistItems.householdId, ctx.householdId),
        opts.includeTrashed ? undefined : isNull(wishlistItems.deletedAt),
      ),
    );
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export interface WishView {
  id: string;
  requesterId: string;
  requesterName: string;
  title: string;
  brandId: string | null;
  brandName: string | null;
  setNumber: string | null;
  rbSetNum: string | null;
  hasCover: boolean;
  url: string | null;
  /** Null for kid profiles, who never see a price. */
  priceCents: number | null;
  notes: string | null;
  mine: boolean;
  /** The VIEWER's own "I bought this" mark, never anyone else's. */
  myPurchase: { purchasedOn: string; note: string | null } | null;
}

export interface WishList {
  userId: string;
  name: string;
  isMe: boolean;
  items: WishView[];
}

const viewColumns = {
  item: wishlistItems,
  requesterName: users.name,
  brandName: brands.name,
  purchasedOn: wishlistPurchases.purchasedOn,
  purchaseNote: wishlistPurchases.note,
  purchaseUser: wishlistPurchases.userId,
};

function toView(
  ctx: DataContext,
  r: {
    item: WishItem;
    requesterName: string;
    brandName: string | null;
    purchasedOn: string | null;
    purchaseNote: string | null;
  },
): WishView {
  return {
    id: r.item.id,
    requesterId: r.item.requestedByUserId,
    requesterName: r.requesterName,
    title: r.item.title,
    brandId: r.item.brandId,
    brandName: r.brandName,
    setNumber: r.item.setNumber,
    rbSetNum: r.item.rbSetNum,
    hasCover: r.item.coverImage !== null,
    url: r.item.url,
    priceCents: isRestricted(ctx) ? null : r.item.priceCents,
    notes: r.item.notes,
    mine: r.item.requestedByUserId === ctx.viewer.userId,
    myPurchase: r.purchasedOn ? { purchasedOn: r.purchasedOn, note: r.purchaseNote } : null,
  };
}

/**
 * Wishlists by person, the viewer's own first. Members and admins see everyone's; a kid profile sees
 * only their own. The purchase mark is joined on the viewer's own user id, so no query, count or
 * response can include another person's mark, administrators included. Order never depends on marks.
 */
export async function listWishlists(ctx: DataContext): Promise<WishList[]> {
  const rows = await ctx.db
    .select(viewColumns)
    .from(wishlistItems)
    .innerJoin(users, eq(users.id, wishlistItems.requestedByUserId))
    .leftJoin(brands, eq(brands.id, wishlistItems.brandId))
    .leftJoin(
      wishlistPurchases,
      and(
        eq(wishlistPurchases.itemId, wishlistItems.id),
        eq(wishlistPurchases.userId, ctx.viewer.userId),
      ),
    )
    .where(
      and(
        eq(wishlistItems.householdId, ctx.householdId),
        isNull(wishlistItems.deletedAt),
        isRestricted(ctx) ? eq(wishlistItems.requestedByUserId, ctx.viewer.userId) : undefined,
      ),
    )
    .orderBy(
      asc(sql`lower(${wishlistItems.title})`),
      asc(wishlistItems.createdAt),
      asc(wishlistItems.id),
    );

  const byPerson = new Map<string, WishList>();
  for (const r of rows) {
    const id = r.item.requestedByUserId;
    const list = byPerson.get(id) ?? {
      userId: id,
      name: r.requesterName,
      isMe: id === ctx.viewer.userId,
      items: [],
    };
    list.items.push(toView(ctx, r));
    byPerson.set(id, list);
  }
  // The viewer's own list always exists, even when empty, so there is somewhere to add a wish.
  if (!byPerson.has(ctx.viewer.userId)) {
    const [me] = await ctx.db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, ctx.viewer.userId));
    byPerson.set(ctx.viewer.userId, {
      userId: ctx.viewer.userId,
      name: me?.name ?? 'Me',
      isMe: true,
      items: [],
    });
  }
  return [...byPerson.values()].toSorted(
    (a, b) => Number(b.isMe) - Number(a.isMe) || a.name.localeCompare(b.name),
  );
}

export async function getWish(ctx: DataContext, id: string): Promise<WishView | null> {
  if (!isUuid(id)) return null;
  const [row] = await ctx.db
    .select(viewColumns)
    .from(wishlistItems)
    .innerJoin(users, eq(users.id, wishlistItems.requestedByUserId))
    .leftJoin(brands, eq(brands.id, wishlistItems.brandId))
    .leftJoin(
      wishlistPurchases,
      and(
        eq(wishlistPurchases.itemId, wishlistItems.id),
        eq(wishlistPurchases.userId, ctx.viewer.userId),
      ),
    )
    .where(
      and(
        eq(wishlistItems.id, id),
        eq(wishlistItems.householdId, ctx.householdId),
        isNull(wishlistItems.deletedAt),
        isRestricted(ctx) ? eq(wishlistItems.requestedByUserId, ctx.viewer.userId) : undefined,
      ),
    );
  return row ? toView(ctx, row) : null;
}

/** The cover path of an item this viewer may see, for the image route. */
export async function wishCoverPath(ctx: DataContext, id: string): Promise<string | null> {
  const wish = await getWish(ctx, id);
  if (!wish?.hasCover) return null;
  const item = await ownedItem(ctx, id);
  return item?.coverImage ?? null;
}

export interface RemovedWish {
  id: string;
  title: string;
  requesterName: string;
  purchasedOn: string;
  note: string | null;
}

/**
 * Items the viewer marked as bought that someone then removed from the list. Shown only to the
 * person who made the mark, until they dismiss it. An item that became a set ("We got it") is not
 * here: its marks are deleted with it.
 */
export async function listRemovedForMe(ctx: DataContext): Promise<RemovedWish[]> {
  const rows = await ctx.db
    .select({
      id: wishlistItems.id,
      title: wishlistItems.title,
      requesterName: users.name,
      purchasedOn: wishlistPurchases.purchasedOn,
      note: wishlistPurchases.note,
    })
    .from(wishlistPurchases)
    .innerJoin(wishlistItems, eq(wishlistItems.id, wishlistPurchases.itemId))
    .innerJoin(users, eq(users.id, wishlistItems.requestedByUserId))
    .where(
      and(
        eq(wishlistPurchases.userId, ctx.viewer.userId),
        eq(wishlistPurchases.householdId, ctx.householdId),
        isNotNull(wishlistItems.deletedAt),
        isNull(wishlistPurchases.dismissedAt),
      ),
    )
    .orderBy(desc(wishlistItems.deletedAt));
  return rows;
}

/** Who has a live wish for each catalog set, for the "On someone's wishlist" badge in set search. */
export async function wishersByCatalogSet(
  ctx: DataContext,
  rbSetNums: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (rbSetNums.length === 0 || isRestricted(ctx)) return out;
  const rows = await ctx.db
    .select({ rbSetNum: wishlistItems.rbSetNum, name: users.name })
    .from(wishlistItems)
    .innerJoin(users, eq(users.id, wishlistItems.requestedByUserId))
    .where(
      and(
        eq(wishlistItems.householdId, ctx.householdId),
        isNull(wishlistItems.deletedAt),
        inArray(wishlistItems.rbSetNum, rbSetNums),
      ),
    );
  for (const r of rows) {
    if (!r.rbSetNum) continue;
    const names = out.get(r.rbSetNum) ?? [];
    if (!names.includes(r.name)) names.push(r.name);
    out.set(r.rbSetNum, names);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Writing wishes
// ---------------------------------------------------------------------------

const AUDITED = [
  'title',
  'brandId',
  'setNumber',
  'rbSetNum',
  'url',
  'priceCents',
  'notes',
] as const;
const pick = (row: Record<string, unknown>) =>
  Object.fromEntries(AUDITED.map((k) => [k, row[k] ?? null]));

/** Adds a wish to the viewer's OWN list. Kid profiles may do this; they never enter a price. */
export async function createOwnWishlistItem(ctx: DataContext, raw: WishInput): Promise<WishItem> {
  const input = wishInput.parse(raw);
  const values = { ...input, priceCents: isRestricted(ctx) ? null : input.priceCents };
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(wishlistItems)
      .values({
        householdId: ctx.householdId,
        requestedByUserId: ctx.viewer.userId,
        ...values,
        ...stampCreate(ctx),
      })
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'wishlist_item',
      entityId: row!.id,
      action: 'create',
      changes: createdFields(pick(row!)),
    });
    return row!;
  });
}

/** Edits a wish. Its owner can, and an admin can; a kid profile can only ever edit its own. */
export async function updateOwnWishlistItem(
  ctx: DataContext,
  id: string,
  raw: WishInput,
): Promise<WishItem> {
  const input = wishInput.parse(raw);
  const before = await ownedItem(ctx, id);
  if (!before || !canChange(ctx, before)) throw new Error('Wish not found');
  // A kid never sets or changes a price, even by sending one.
  const priceCents = isRestricted(ctx) ? before.priceCents : input.priceCents;
  const next = { ...input, priceCents };
  const changes = diffFields(pick(before), pick(next));
  if (Object.keys(changes).length === 0) return before;
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .update(wishlistItems)
      .set({ ...next, ...stampUpdate(ctx) })
      .where(eq(wishlistItems.id, id))
      .returning();
    await recordAudit(tx, ctx, {
      entityType: 'wishlist_item',
      entityId: id,
      action: 'update',
      changes,
    });
    return row!;
  });
}

export async function setWishCover(
  ctx: DataContext,
  id: string,
  path: string | null,
): Promise<string | null> {
  const before = await ownedItem(ctx, id);
  if (!before || !canChange(ctx, before)) throw new Error('Wish not found');
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(wishlistItems)
      .set({ coverImage: path, ...stampUpdate(ctx) })
      .where(eq(wishlistItems.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'wishlist_item',
      entityId: id,
      action: 'update',
      changes: { coverImage: [before.coverImage, path] },
    });
  });
  return before.coverImage;
}

/** Removes a wish from the list (to the trash). Owner or admin; a kid only their own. */
export async function trashOwnWishlistItem(ctx: DataContext, id: string): Promise<boolean> {
  const before = await ownedItem(ctx, id);
  if (!before || !canChange(ctx, before)) return false;
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(wishlistItems)
      .set({ ...stampTrash(ctx), ...stampUpdate(ctx) })
      .where(eq(wishlistItems.id, id));
    await recordAudit(tx, ctx, {
      entityType: 'wishlist_item',
      entityId: id,
      action: 'delete',
      changes: trashedFields({ title: before.title }),
    });
  });
  return true;
}

// ---------------------------------------------------------------------------
// Private purchase marks
// ---------------------------------------------------------------------------

const markInput = z.object({
  purchasedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-12-03')
    .optional(),
  note: optionalText(300),
});

/**
 * "I bought this." Anyone except the person whose list it is can mark an item, and the mark is
 * visible only to its maker. Writing it creates NO audit entry and touches nothing on the item
 * (no stamps, no `updated_at`), so the activity log and "last edited" cannot give it away. Two
 * people can both mark the same item and each sees only their own: a duplicate gift is the price of
 * privacy. Kid profiles cannot mark in v1.
 */
export async function markPurchased(
  ctx: DataContext,
  itemId: string,
  raw: { purchasedOn?: string; note?: string | null } = {},
): Promise<void> {
  assertCanWrite(ctx);
  const input = markInput.parse(raw);
  const item = await ownedItem(ctx, itemId);
  if (!item) throw new Error('Wish not found');
  if (item.requestedByUserId === ctx.viewer.userId)
    throw new Error('You cannot mark your own wish as bought');
  const today = new Date().toISOString().slice(0, 10);
  await ctx.db
    .insert(wishlistPurchases)
    .values({
      householdId: ctx.householdId,
      itemId,
      userId: ctx.viewer.userId,
      purchasedOn: input.purchasedOn ?? today,
      note: input.note ?? null,
    })
    .onConflictDoUpdate({
      target: [wishlistPurchases.itemId, wishlistPurchases.userId],
      set: { purchasedOn: input.purchasedOn ?? today, note: input.note ?? null, dismissedAt: null },
    });
}

/** Undoes the viewer's own mark. Nothing is logged. */
export async function unmarkPurchased(ctx: DataContext, itemId: string): Promise<void> {
  assertCanWrite(ctx);
  if (!isUuid(itemId)) return;
  await ctx.db
    .delete(wishlistPurchases)
    .where(
      and(eq(wishlistPurchases.itemId, itemId), eq(wishlistPurchases.userId, ctx.viewer.userId)),
    );
}

/** Dismisses the "Removed from the list" notice for the viewer's own mark. */
export async function dismissRemoved(ctx: DataContext, itemId: string): Promise<void> {
  if (!isUuid(itemId)) return;
  await ctx.db
    .update(wishlistPurchases)
    .set({ dismissedAt: new Date() })
    .where(
      and(eq(wishlistPurchases.itemId, itemId), eq(wishlistPurchases.userId, ctx.viewer.userId)),
    );
}

// ---------------------------------------------------------------------------
// "We got it"
// ---------------------------------------------------------------------------

export interface GotIt {
  set: Omit<SetInput, 'name' | 'setNumber' | 'rbSetNum' | 'hiddenFromRestricted'> & {
    name?: string;
    setNumber?: string | null;
    rbSetNum?: string | null;
  };
  /** Hide the new set from kid profiles: for a present that has not been given yet. */
  hideFromKids?: boolean;
  /** A copy to create with it. Null creates the set alone. */
  copy: CopyInput | null;
}

/**
 * Turns a wish into a set (and usually a copy), and removes the wish, in one transaction. The wish's
 * purchase marks are deleted with it, so nobody is left holding a mark on something that now exists.
 * Everyone will now see it in the collection, which is why the dialog warns first and offers to hide
 * it from kid profiles.
 */
export async function convertWishToSet(
  ctx: DataContext,
  itemId: string,
  input: GotIt,
): Promise<{ setId: string; copyIds: string[] }> {
  assertCanWrite(ctx);
  const item = await ownedItem(ctx, itemId);
  if (!item) throw new Error('Wish not found');
  return ctx.db.transaction(async (tx) => {
    // The inner calls open savepoints on this transaction: if any fails, nothing happens.
    const inner = { ...ctx, db: tx as unknown as DataContext['db'] };
    const set = await createSet(inner, {
      ...input.set,
      name: input.set.name ?? item.title,
      setNumber: input.set.setNumber ?? item.setNumber,
      rbSetNum: input.set.rbSetNum ?? item.rbSetNum,
      retailPriceCents: input.set.retailPriceCents ?? null,
      hiddenFromRestricted: input.hideFromKids ?? false,
    });
    const copies = input.copy ? await addCopies(inner, set.id, input.copy, 1) : [];
    await tx
      .update(wishlistItems)
      .set({ ...stampTrash(ctx), ...stampUpdate(ctx) })
      .where(eq(wishlistItems.id, itemId));
    await recordAudit(tx, ctx, {
      entityType: 'wishlist_item',
      entityId: itemId,
      action: 'delete',
      changes: { ...trashedFields({ title: item.title }), convertedToSet: [null, set.id] },
    });
    // No audit row for these: marks are never logged, including their removal.
    await tx.delete(wishlistPurchases).where(eq(wishlistPurchases.itemId, itemId));
    return { setId: set.id, copyIds: copies.map((c) => c.id) };
  });
}

/** The item as stored (cover path included), for the conversion to carry the cover over. */
export async function getWishRow(ctx: DataContext, id: string): Promise<WishItem | null> {
  return ownedItem(ctx, id);
}
