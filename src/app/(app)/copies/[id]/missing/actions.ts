'use server';

import { revalidatePath } from 'next/cache';

import { requireContext } from '@/server/auth/current';
import {
  addMissing,
  markPiecesChecked,
  removeMissing,
  resolveMissing,
  setMissingQuantity,
  type MissingInput,
  type Resolution,
} from '@/server/data/missing';

export interface MissingState {
  error?: string;
  ok?: boolean;
  /** What was added, for the confirmation line ("3 × Plate 1 x 2, Red"). */
  added?: string;
}

const message = (e: unknown) =>
  e instanceof Error && e.name !== 'ZodError' ? e.message : 'Check what you entered and try again.';

const firstIssue = (e: unknown) =>
  (e as { issues?: { message: string }[] })?.issues?.[0]?.message ?? null;

const refresh = (copyId: string, setId?: string) => {
  revalidatePath(`/copies/${copyId}/missing`);
  if (setId) revalidatePath(`/sets/${setId}`);
  revalidatePath('/sets');
};

export async function addMissingAction(
  copyId: string,
  setId: string,
  input: MissingInput,
): Promise<MissingState> {
  const { ctx } = await requireContext();
  try {
    const row = await addMissing(ctx, copyId, input);
    refresh(copyId, setId);
    const what = row.snapshotName ?? row.description ?? 'piece';
    return {
      ok: true,
      added: `${input.quantity} × ${what}${row.snapshotColorName ? `, ${row.snapshotColorName}` : ''}`,
    };
  } catch (e) {
    return { error: firstIssue(e) ?? message(e) };
  }
}

export async function resolveMissingAction(
  copyId: string,
  setId: string,
  id: string,
  resolution: Resolution,
  count?: number,
): Promise<MissingState> {
  const { ctx } = await requireContext();
  try {
    await resolveMissing(ctx, id, resolution, count);
  } catch (e) {
    return { error: firstIssue(e) ?? message(e) };
  }
  refresh(copyId, setId);
  return { ok: true };
}

export async function setMissingQuantityAction(
  copyId: string,
  setId: string,
  id: string,
  quantity: number,
): Promise<MissingState> {
  const { ctx } = await requireContext();
  try {
    await setMissingQuantity(ctx, id, quantity);
  } catch (e) {
    return { error: firstIssue(e) ?? message(e) };
  }
  refresh(copyId, setId);
  return { ok: true };
}

export async function removeMissingAction(
  copyId: string,
  setId: string,
  id: string,
): Promise<MissingState> {
  const { ctx } = await requireContext();
  await removeMissing(ctx, id);
  refresh(copyId, setId);
  return { ok: true };
}

/** `day` is the viewer's own calendar day, so "today" means their today, not the server's. */
export async function markCheckedAction(
  copyId: string,
  setId: string,
  day: string,
): Promise<MissingState> {
  const { ctx } = await requireContext();
  try {
    await markPiecesChecked(ctx, copyId, day);
  } catch (e) {
    return { error: firstIssue(e) ?? message(e) };
  }
  refresh(copyId, setId);
  return { ok: true };
}
