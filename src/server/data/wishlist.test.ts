import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { auditLog, copies, sets, wishlistItems, wishlistPurchases } from '../db/schema';
import { createUser } from '../auth/accounts';
import { historyFor, lastEdit, recentActivity } from './audit';
import { createContext, type DataContext } from './context';
import { createWorld, type TestWorld } from './test-helpers';
import { listTrash, purgeTrashed, restoreTrashed } from './trash';
import {
  convertWishToSet,
  createOwnWishlistItem,
  dismissRemoved,
  getWish,
  listRemovedForMe,
  listWishlists,
  markPurchased,
  trashOwnWishlistItem,
  unmarkPurchased,
  updateOwnWishlistItem,
  wishersByCatalogSet,
} from './wishlist';

let w: TestWorld;
/** A second member, so there is a requester, two buyers and a bystander. */
let ben: DataContext;

beforeEach(async () => {
  w = await createWorld();
  const u = await createUser(
    w.db,
    w.admin.householdId,
    { name: 'Ben', email: 'ben@example.com', password: 'hunter2hunter2', role: 'member' },
    w.admin.viewer.userId,
  );
  ben = createContext(w.db, w.admin.householdId, { kind: 'user', userId: u.id, role: 'member' });
});

const wish = (title = 'Millennium Falcon', over: Record<string, unknown> = {}) => ({
  title,
  ...over,
});

/** Everything the mark could leak through, as one string per viewer. */
async function everythingSeenBy(ctx: DataContext, itemId: string) {
  const seen: unknown[] = [
    await listWishlists(ctx),
    await getWish(ctx, itemId),
    await listRemovedForMe(ctx),
  ];
  if (ctx.viewer.role !== 'restricted') {
    seen.push(
      await recentActivity(ctx, { limit: 200 }),
      await lastEdit(ctx, 'wishlist_item', itemId),
    );
    seen.push(await historyFor(ctx, 'wishlist_item', itemId), await listTrash(ctx));
  }
  return JSON.stringify(seen);
}

describe('wishes', () => {
  it('adds to the viewer’s own list, audited and stamped', async () => {
    const item = await createOwnWishlistItem(
      w.member,
      wish('Titanic', { priceCents: '59999', notes: 'the big one', url: 'https://shop.example/t' }),
    );
    expect(item).toMatchObject({
      requestedByUserId: w.member.viewer.userId,
      priceCents: 59999,
      createdByUserId: w.member.viewer.userId,
    });
    const [entry] = await historyFor(w.admin, 'wishlist_item', item.id);
    expect(entry!.changes).toMatchObject({ title: [null, 'Titanic'], priceCents: [null, 59999] });
  });

  it('validates the title and the link', async () => {
    await expect(createOwnWishlistItem(w.member, wish(''))).rejects.toThrow();
    await expect(
      createOwnWishlistItem(w.member, wish('x', { url: 'javascript:alert(1)' })),
    ).rejects.toThrow();
    await expect(createOwnWishlistItem(w.member, wish('x', { priceCents: -5 }))).rejects.toThrow();
  });

  it('lists everyone’s wishes for members and admins, the viewer’s own list first, with a list even when empty', async () => {
    await createOwnWishlistItem(w.member, wish('Mia wish'));
    await createOwnWishlistItem(ben, wish('Ben wish'));
    const lists = await listWishlists(w.admin);
    expect(lists.map((l) => [l.name, l.isMe, l.items.map((i) => i.title)])).toEqual([
      ['Ada', true, []],
      ['Ben', false, ['Ben wish']],
      ['Mia', false, ['Mia wish']],
    ]);
  });

  it('only the owner or an admin can edit or remove a wish', async () => {
    const item = await createOwnWishlistItem(w.member, wish('Mine'));
    await expect(updateOwnWishlistItem(ben, item.id, wish('Hijacked'))).rejects.toThrow(
      /not found/,
    );
    expect(await trashOwnWishlistItem(ben, item.id)).toBe(false);
    await updateOwnWishlistItem(w.member, item.id, wish('Renamed'));
    await updateOwnWishlistItem(w.admin, item.id, wish('Renamed by admin'));
    expect((await getWish(w.admin, item.id))?.title).toBe('Renamed by admin');
    expect(await trashOwnWishlistItem(w.member, item.id)).toBe(true);
    expect(await getWish(w.admin, item.id)).toBeNull();
  });

  it('another household never sees them', async () => {
    const item = await createOwnWishlistItem(w.member, wish());
    expect((await listWishlists(w.other)).flatMap((l) => l.items)).toEqual([]);
    expect(await getWish(w.other, item.id)).toBeNull();
    await expect(markPurchased(w.other, item.id)).rejects.toThrow(/not found/);
  });
});

describe('kid profiles', () => {
  it('can add, edit and remove only their own wishes, and never set or see a price', async () => {
    const mine = await createOwnWishlistItem(
      w.kid,
      wish('Treehouse', { priceCents: 9999, notes: 'the green one' }),
    );
    expect(mine.priceCents).toBeNull();
    const others = await createOwnWishlistItem(
      w.member,
      wish('Grown-up wish', { priceCents: 1234 }),
    );

    // Their own list only: other people's wishes are not even listed.
    const lists = await listWishlists(w.kid);
    expect(lists).toHaveLength(1);
    expect(lists[0]!.items.map((i) => i.title)).toEqual(['Treehouse']);
    expect(await getWish(w.kid, others.id)).toBeNull();

    // Edits keep the price out, even if one is sent.
    await updateOwnWishlistItem(w.kid, mine.id, wish('Treehouse Cabin', { priceCents: 5 }));
    const [row] = await w.db.select().from(wishlistItems).where(eq(wishlistItems.id, mine.id));
    expect(row).toMatchObject({ title: 'Treehouse Cabin', priceCents: null });

    // A price an adult entered on a kid's own wish is hidden from the kid.
    await w.db.update(wishlistItems).set({ priceCents: 4000 }).where(eq(wishlistItems.id, mine.id));
    expect((await getWish(w.kid, mine.id))?.priceCents).toBeNull();
    expect((await getWish(w.admin, mine.id))?.priceCents).toBe(4000);
    await updateOwnWishlistItem(w.kid, mine.id, wish('Treehouse Cabin', { priceCents: 1 }));
    expect(
      (await w.db.select().from(wishlistItems).where(eq(wishlistItems.id, mine.id)))[0]!.priceCents,
    ).toBe(4000);

    // Never anyone else's.
    await expect(updateOwnWishlistItem(w.kid, others.id, wish('Mine now'))).rejects.toThrow(
      /not found/,
    );
    expect(await trashOwnWishlistItem(w.kid, others.id)).toBe(false);
    expect(await trashOwnWishlistItem(w.kid, mine.id)).toBe(true);
  });

  it('cannot mark anything as bought, or turn a wish into a set', async () => {
    const item = await createOwnWishlistItem(w.member, wish());
    await expect(markPurchased(w.kid, item.id)).rejects.toThrow(/cannot make changes/);
    await expect(
      convertWishToSet(w.kid, item.id, { set: { brandId: w.legoId }, copy: null }),
    ).rejects.toThrow(/cannot make changes/);
  });
});

describe('private purchase marks', () => {
  async function marked() {
    // Mia's wish; Ben marks it. Ada (admin) and Kit (kid) are bystanders.
    const item = await createOwnWishlistItem(w.member, wish('Secret gift'));
    await markPurchased(ben, item.id, {
      purchasedOn: '2026-12-03',
      note: 'Hidden at grandma’s: code AZURE-7',
    });
    return item;
  }

  it('is visible to its maker and nobody else, in every read, for every role', async () => {
    const item = await marked();
    const bens = await listWishlists(ben);
    expect(bens.flatMap((l) => l.items).find((i) => i.id === item.id)?.myPurchase).toEqual({
      purchasedOn: '2026-12-03',
      note: 'Hidden at grandma’s: code AZURE-7',
    });
    expect((await getWish(ben, item.id))?.myPurchase?.purchasedOn).toBe('2026-12-03');

    for (const [who, ctx] of [
      ['requester', w.member],
      ['admin', w.admin],
      ['kid', w.kid],
    ] as const) {
      const text = await everythingSeenBy(ctx, item.id);
      expect(text, who).not.toContain('AZURE-7');
      expect(text, who).not.toContain('2026-12-03');
      expect(text, who).not.toMatch(/bought|Hidden at grandma/i);
      const wished = (await listWishlists(ctx))
        .flatMap((l) => l.items)
        .find((i) => i.id === item.id);
      expect(wished?.myPurchase ?? null, who).toBeNull();
    }
  });

  it('writing a mark logs nothing and touches nothing on the item', async () => {
    const item = await createOwnWishlistItem(w.member, wish('Secret gift'));
    const before = (
      await w.db.select().from(wishlistItems).where(eq(wishlistItems.id, item.id))
    )[0]!;
    const auditBefore = (await w.db.select().from(auditLog)).length;
    await markPurchased(ben, item.id, { note: 'note' });
    await markPurchased(w.admin, item.id);
    await unmarkPurchased(ben, item.id);
    expect((await w.db.select().from(auditLog)).length).toBe(auditBefore);
    const after = (
      await w.db.select().from(wishlistItems).where(eq(wishlistItems.id, item.id))
    )[0]!;
    expect(after).toEqual(before);
    expect(after.updatedAt).toEqual(before.updatedAt);
    expect(after.updatedByUserId).toBe(before.updatedByUserId);
  });

  it('two people can both mark the same item, and each sees only their own', async () => {
    const item = await createOwnWishlistItem(w.member, wish('Doubled'));
    await markPurchased(ben, item.id, { note: 'from Ben' });
    await markPurchased(w.admin, item.id, { note: 'from Ada' });
    expect((await getWish(ben, item.id))?.myPurchase?.note).toBe('from Ben');
    expect((await getWish(w.admin, item.id))?.myPurchase?.note).toBe('from Ada');
    expect(JSON.stringify(await listWishlists(ben))).not.toContain('from Ada');
    expect(JSON.stringify(await listWishlists(w.admin))).not.toContain('from Ben');
    expect(await w.db.select().from(wishlistPurchases)).toHaveLength(2);
  });

  it('the requester cannot mark their own wish, and re-marking replaces the maker’s own mark', async () => {
    const item = await createOwnWishlistItem(w.member, wish());
    await expect(markPurchased(w.member, item.id)).rejects.toThrow(/own wish/);
    await markPurchased(ben, item.id, { purchasedOn: '2026-01-01', note: 'first' });
    await markPurchased(ben, item.id, { purchasedOn: '2026-02-02', note: 'second' });
    expect((await getWish(ben, item.id))?.myPurchase).toEqual({
      purchasedOn: '2026-02-02',
      note: 'second',
    });
    await expect(markPurchased(ben, item.id, { purchasedOn: 'tomorrow' })).rejects.toThrow();
    await unmarkPurchased(ben, item.id);
    expect((await getWish(ben, item.id))?.myPurchase).toBeNull();
  });

  it('never changes order or what is counted, whoever marked what', async () => {
    const a = await createOwnWishlistItem(w.member, wish('Alpha'));
    await createOwnWishlistItem(w.member, wish('Bravo'));
    await createOwnWishlistItem(w.member, wish('Charlie'));
    const order = async (ctx: DataContext) =>
      (await listWishlists(ctx)).flatMap((l) => l.items.map((i) => i.title));
    const before = await order(ben);
    await markPurchased(ben, a.id);
    expect(await order(ben)).toEqual(before);
    expect(await order(w.member)).toEqual(before);
  });

  it('shows a marked item under "Removed from the list" to its maker only, until dismissed', async () => {
    const item = await marked();
    expect(await listRemovedForMe(ben)).toEqual([]); // still on the list
    await trashOwnWishlistItem(w.member, item.id);
    const removed = await listRemovedForMe(ben);
    expect(removed).toMatchObject([
      { id: item.id, title: 'Secret gift', requesterName: 'Mia', purchasedOn: '2026-12-03' },
    ]);
    for (const ctx of [w.member, w.admin, w.kid]) expect(await listRemovedForMe(ctx)).toEqual([]);
    await dismissRemoved(ben, item.id);
    expect(await listRemovedForMe(ben)).toEqual([]);
  });

  it('a restored item keeps its mark, and a dismissed notice stays dismissed', async () => {
    const item = await marked();
    await trashOwnWishlistItem(w.member, item.id);
    await dismissRemoved(ben, item.id);
    await restoreTrashed(w.admin, 'wishlist_item', item.id);
    expect((await getWish(ben, item.id))?.myPurchase?.note).toContain('AZURE-7'); // the mark survived the trip
    await trashOwnWishlistItem(w.member, item.id);
    expect(await listRemovedForMe(ben)).toEqual([]); // still dismissed
  });

  it('deleting for good removes the marks with the item', async () => {
    const item = await marked();
    await trashOwnWishlistItem(w.member, item.id);
    expect((await purgeTrashed(w.admin, 'wishlist_item', item.id)).ok).toBe(true);
    expect(await w.db.select().from(wishlistPurchases)).toEqual([]);
  });
});

describe('"We got it"', () => {
  it('creates the set and a copy, removes the wish and deletes its marks, all together', async () => {
    const item = await createOwnWishlistItem(w.kid, wish('Treehouse', { setNumber: '31010' }));
    await markPurchased(ben, item.id, { note: 'secret' });
    const auditBefore = (await w.db.select().from(auditLog)).length;
    const result = await convertWishToSet(w.member, item.id, {
      set: { brandId: w.legoId, year: 2024 },
      hideFromKids: true,
      copy: { buildState: 'sealed' },
    });
    expect(result.copyIds).toHaveLength(1);
    const [set] = await w.db.select().from(sets).where(eq(sets.id, result.setId));
    expect(set).toMatchObject({
      name: 'Treehouse',
      setNumber: '31010',
      year: 2024,
      hiddenFromRestricted: true,
    });
    expect(
      (await w.db.select().from(copies).where(eq(copies.setId, result.setId)))[0],
    ).toMatchObject({ buildState: 'sealed' });
    expect(await getWish(w.admin, item.id)).toBeNull();
    expect(await w.db.select().from(wishlistPurchases)).toEqual([]);
    expect(await listRemovedForMe(ben)).toEqual([]); // converted, not removed
    // The trail names the wish and the set, and nothing about marks.
    const entries = (await w.db.select().from(auditLog)).slice(auditBefore);
    expect(JSON.stringify(entries)).not.toMatch(/secret|purchase|bought/i);
    const [trashed] = await historyFor(w.admin, 'wishlist_item', item.id);
    expect(trashed!.changes.convertedToSet).toEqual([null, result.setId]);
  });

  it('leaves everything untouched if the set cannot be created', async () => {
    const item = await createOwnWishlistItem(w.member, wish('Dup', { setNumber: '1' }));
    await markPurchased(ben, item.id);
    await convertWishToSet(
      w.admin,
      (await createOwnWishlistItem(w.member, wish('First', { setNumber: '1' }))).id,
      {
        set: { brandId: w.legoId },
        copy: null,
      },
    );
    await expect(
      convertWishToSet(w.admin, item.id, { set: { brandId: w.legoId }, copy: null }),
    ).rejects.toThrow(/already have/);
    expect(await getWish(w.admin, item.id)).not.toBeNull();
    expect(await w.db.select().from(wishlistPurchases)).toHaveLength(1);
    expect((await w.db.select().from(sets)).length).toBe(1);
  });
});

describe('trash', () => {
  it('lists a removed wish for the person who removed it, and for admins', async () => {
    const item = await createOwnWishlistItem(w.member, wish('Gone'));
    await trashOwnWishlistItem(w.member, item.id);
    expect((await listTrash(w.member)).find((t) => t.kind === 'wishlist_item')).toMatchObject({
      title: 'Gone',
      detail: 'Wishlist · Mia',
    });
    expect(await listTrash(ben)).toEqual([]);
    expect((await restoreTrashed(w.member, 'wishlist_item', item.id)).ok).toBe(true);
    expect((await getWish(w.member, item.id))?.title).toBe('Gone');
  });
});

describe('catalog badge', () => {
  it('names who has a live wish for a catalog set, for members only', async () => {
    await createOwnWishlistItem(w.member, wish('Falcon', { rbSetNum: '75192-1' }));
    const gone = await createOwnWishlistItem(ben, wish('Falcon too', { rbSetNum: '75192-1' }));
    await trashOwnWishlistItem(ben, gone.id);
    expect((await wishersByCatalogSet(w.admin, ['75192-1', '10294-1'])).get('75192-1')).toEqual([
      'Mia',
    ]);
    expect((await wishersByCatalogSet(w.kid, ['75192-1'])).size).toBe(0);
    expect((await wishersByCatalogSet(w.other, ['75192-1'])).size).toBe(0);
  });
});
