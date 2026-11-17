'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { parseMoney } from '@/lib/money';
import { requireContext } from '@/server/auth/current';
import { catalogConfig } from '@/server/catalog/config';
import { fetchCatalogCover } from '@/server/catalog/cover';
import { catalogThemeChain, getCatalogSet } from '@/server/catalog/reference';
import { setCoverImage } from '@/server/data/sets';
import { findOrCreateThemeChain } from '@/server/data/themes';
import {
  convertWishToSet,
  createOwnWishlistItem,
  dismissRemoved,
  getWishRow,
  markPurchased,
  setWishCover,
  trashOwnWishlistItem,
  unmarkPurchased,
  updateOwnWishlistItem,
} from '@/server/data/wishlist';
import { readStored, removeStored, saveCover } from '@/server/storage';

export interface WishState {
  error?: string;
  saved?: boolean;
}

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
};

const message = (e: unknown) => {
  if (e instanceof Error && e.name === 'ZodError') {
    const issues = (e as unknown as { issues?: { message: string }[] }).issues;
    return issues?.[0]?.message ?? 'Check the form and try again.';
  }
  return e instanceof Error ? e.message : 'Check the form and try again.';
};

function wishFields(fd: FormData) {
  const price = parseMoney(text(fd, 'price'));
  if (price === undefined) return { error: 'Enter the price like 149.99.' } as const;
  return {
    input: {
      title: text(fd, 'title') ?? '',
      brandId: text(fd, 'brandId'),
      setNumber: text(fd, 'setNumber'),
      rbSetNum: text(fd, 'rbSetNum'),
      url: text(fd, 'url'),
      priceCents: price,
      notes: text(fd, 'notes'),
    },
  } as const;
}

export async function addWishAction(_prev: WishState, fd: FormData): Promise<WishState> {
  const { ctx } = await requireContext();
  const parsed = wishFields(fd);
  if ('error' in parsed) return { error: parsed.error };
  try {
    // A catalog link is only kept when the set really is in the catalog.
    const catalogSet = parsed.input.rbSetNum
      ? await getCatalogSet(ctx.db, parsed.input.rbSetNum)
      : null;
    const item = await createOwnWishlistItem(ctx, {
      ...parsed.input,
      rbSetNum: catalogSet?.setNum ?? null,
    });
    // One request, for one wish someone just saved. A failed download leaves it without a cover.
    const cover = catalogSet ? await fetchCatalogCover(catalogSet.imgUrl, catalogConfig()) : null;
    if (cover) await setWishCover(ctx, item.id, await saveCover(ctx.householdId, item.id, cover));
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath('/wishlist');
  return { saved: true };
}

export async function updateWishAction(
  id: string,
  _prev: WishState,
  fd: FormData,
): Promise<WishState> {
  const { ctx } = await requireContext();
  const parsed = wishFields(fd);
  if ('error' in parsed) return { error: parsed.error };
  try {
    await updateOwnWishlistItem(ctx, id, parsed.input);
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath('/wishlist');
  return { saved: true };
}

export async function removeWishAction(id: string) {
  const { ctx } = await requireContext();
  await trashOwnWishlistItem(ctx, id);
  revalidatePath('/wishlist');
}

export async function markPurchasedAction(
  id: string,
  _prev: WishState,
  fd: FormData,
): Promise<WishState> {
  const { ctx } = await requireContext();
  try {
    await markPurchased(ctx, id, {
      purchasedOn: text(fd, 'purchasedOn') ?? undefined,
      note: text(fd, 'note'),
    });
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath('/wishlist');
  return { saved: true };
}

export async function unmarkPurchasedAction(id: string) {
  const { ctx } = await requireContext();
  await unmarkPurchased(ctx, id);
  revalidatePath('/wishlist');
}

export async function dismissRemovedAction(id: string) {
  const { ctx } = await requireContext();
  await dismissRemoved(ctx, id);
  revalidatePath('/wishlist');
}

export async function gotItAction(id: string, _prev: WishState, fd: FormData): Promise<WishState> {
  const { ctx } = await requireContext();
  const brandId = text(fd, 'brandId');
  if (!brandId) return { error: 'Choose a brand for the new set.' };
  let setId: string;
  try {
    const wish = await getWishRow(ctx, id);
    if (!wish) return { error: 'That wish is no longer on the list.' };
    const catalogSet = wish.rbSetNum ? await getCatalogSet(ctx.db, wish.rbSetNum) : null;
    const themeId = catalogSet
      ? await findOrCreateThemeChain(ctx, await catalogThemeChain(ctx.db, catalogSet.themeId))
      : null;
    const result = await convertWishToSet(ctx, id, {
      set: {
        brandId,
        themeId,
        year: catalogSet?.year ?? null,
        pieceCount: catalogSet?.numParts ?? null,
        rbSetNum: catalogSet?.setNum ?? null,
      },
      hideFromKids: fd.get('hideFromKids') === 'on',
      copy:
        fd.get('addCopy') === 'on'
          ? { buildState: 'sealed', acquiredOn: new Date().toISOString().slice(0, 10) }
          : null,
    });
    setId = result.setId;
    // The wish's cover goes to the new set; failing that, the catalog's. A failure keeps the set.
    try {
      const stored = wish.coverImage ? await readStored(wish.coverImage) : null;
      const file = stored
        ? new File([new Uint8Array(stored.bytes)], 'cover', { type: stored.mime })
        : catalogSet
          ? await fetchCatalogCover(catalogSet.imgUrl, catalogConfig())
          : null;
      if (file) {
        const old = await setCoverImage(ctx, setId, await saveCover(ctx.householdId, setId, file));
        if (old) await removeStored(old);
      }
    } catch {
      // The set exists without a cover; one can be added from the set's edit page.
    }
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath('/wishlist');
  revalidatePath('/sets');
  redirect(`/sets/${setId}`);
}
