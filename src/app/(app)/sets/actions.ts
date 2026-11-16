'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireContext } from '@/server/auth/current';
import { createBrand } from '@/server/data/brands';
import type { BuildState } from '@/server/data/completeness';
import {
  addCopies,
  setBuildState,
  trashCopy,
  updateCopy,
  type CopyInput,
} from '@/server/data/copies';
import {
  createSet,
  DuplicateSetError,
  setCoverImage,
  trashSet,
  updateSet,
  type SetInput,
} from '@/server/data/sets';
import { parseMoney } from '@/lib/money';
import { removeStored, saveCover } from '@/server/storage';

export interface ActionState {
  error?: string;
  /** Set when the number already exists, so the form can offer "add another copy". */
  duplicate?: { id: string; name: string };
  saved?: boolean;
}

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
};

/** A whole-number field. Mantine's NumberInput submits what it displays ("9,090"), so drop separators. */
const whole = (fd: FormData, key: string) => text(fd, key)?.replaceAll(',', '') ?? null;

/** A money field in dollars. Returns `undefined` for junk so the caller can report it. */
function money(fd: FormData, key: string): number | null | undefined {
  return parseMoney(text(fd, key));
}

function parseCopyForm(fd: FormData, prefix = ''): CopyInput | { error: string } {
  const t = (key: string) => text(fd, prefix + key);
  const paid = parseMoney(t('pricePaid'));
  const value = parseMoney(t('estimatedValue'));
  if (paid === undefined || value === undefined) return { error: 'Enter prices like 149.99.' };
  return {
    ownerUserId: t('ownerUserId'),
    locationId: t('locationId'),
    buildState: (t('buildState') ?? 'sealed') as BuildState,
    piecesCheckedOn: t('piecesCheckedOn'),
    hasBox: fd.get(`${prefix}hasBox`) === 'on',
    hasInstructions: fd.get(`${prefix}hasInstructions`) === 'on',
    conditionNotes: t('conditionNotes'),
    acquiredOn: t('acquiredOn'),
    pricePaidCents: paid,
    estimatedValueCents: value,
    // Setting a value stamps the date, unless one was entered.
    valuedOn: t('valuedOn') ?? (value !== null ? new Date().toISOString().slice(0, 10) : null),
    notes: t('notes'),
  };
}

const message = (e: unknown) =>
  e instanceof Error && e.name !== 'ZodError' ? e.message : 'Check the form and try again.';

export async function saveSetAction(
  id: string | null,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const { ctx } = await requireContext();
  const retail = money(fd, 'retailPrice');
  if (retail === undefined) return { error: 'Enter the retail price like 149.99.' };

  let setId = id;
  try {
    let brandId = text(fd, 'brandId');
    const newBrand = text(fd, 'newBrandName');
    if (newBrand) brandId = (await createBrand(ctx, { name: newBrand })).id;

    const input: SetInput = {
      brandId: brandId ?? '',
      setNumber: text(fd, 'setNumber'),
      name: text(fd, 'name') ?? '',
      themeId: text(fd, 'themeId'),
      year: whole(fd, 'year'),
      pieceCount: whole(fd, 'pieceCount'),
      minifigCount: whole(fd, 'minifigCount'),
      minAge: whole(fd, 'minAge'),
      description: text(fd, 'description'),
      retailPriceCents: retail,
      designer: text(fd, 'designer'),
      notes: text(fd, 'notes'),
      rbSetNum: text(fd, 'rbSetNum'),
      hiddenFromRestricted: fd.get('hiddenFromRestricted') === 'on',
      tags: (text(fd, 'tags') ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (id) {
      await updateSet(ctx, id, input);
    } else {
      setId = (await createSet(ctx, input)).id;
      if (fd.get('addCopy') === 'on') {
        const copy = parseCopyForm(fd, 'copy.');
        if ('error' in copy) return { error: `The set was saved, but: ${copy.error}` };
        const qty = Math.max(1, Math.min(50, Number(text(fd, 'quantity') ?? 1) || 1));
        await addCopies(ctx, setId, copy, qty);
      }
    }

    const upload = fd.get('cover');
    if (setId && upload instanceof File && upload.size > 0) {
      // The set is already saved, so a bad image reports an error without losing the form.
      const path = await saveCover(ctx.householdId, setId, upload);
      const old = await setCoverImage(ctx, setId, path);
      if (old && old !== path) await removeStored(old);
    }
  } catch (e) {
    if (e instanceof DuplicateSetError) {
      return {
        error: 'You already have a set with this brand and number.',
        duplicate: { id: e.existingSetId, name: text(fd, 'name') ?? 'this set' },
      };
    }
    return { error: message(e) };
  }
  revalidatePath('/sets');
  redirect(`/sets/${setId}`);
}

export async function saveCopyAction(
  setId: string,
  copyId: string | null,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const { ctx } = await requireContext();
  const copy = parseCopyForm(fd);
  if ('error' in copy) return { error: copy.error };
  try {
    if (copyId) await updateCopy(ctx, copyId, copy);
    else {
      const qty = Math.max(1, Math.min(50, Number(text(fd, 'quantity') ?? 1) || 1));
      await addCopies(ctx, setId, copy, qty);
    }
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath(`/sets/${setId}`);
  return { saved: true };
}

export async function buildStateAction(setId: string, copyId: string, state: BuildState) {
  const { ctx } = await requireContext();
  await setBuildState(ctx, copyId, state);
  revalidatePath(`/sets/${setId}`);
}

export async function trashCopyAction(setId: string, copyId: string) {
  const { ctx } = await requireContext();
  await trashCopy(ctx, copyId);
  revalidatePath(`/sets/${setId}`);
}

export async function trashSetAction(setId: string): Promise<ActionState> {
  const { ctx } = await requireContext();
  const result = await trashSet(ctx, setId);
  if (!result.ok) {
    return {
      error:
        result.reason === 'has_copies'
          ? `This set still has ${result.copies} ${result.copies === 1 ? 'copy' : 'copies'}. Remove them first.`
          : 'Set not found.',
    };
  }
  revalidatePath('/sets');
  redirect('/sets');
}
