'use server';

import { revalidatePath } from 'next/cache';

import { requireContext } from '@/server/auth/current';
import {
  addLinkInstruction,
  moveInstruction,
  renameInstruction,
  trashInstruction,
} from '@/server/data/instructions';

export interface InstructionState {
  error?: string;
  ok?: boolean;
}

const message = (e: unknown) =>
  e instanceof Error && e.name !== 'ZodError' ? e.message : 'Check what you entered and try again.';

/** The first problem a form field has, for a short message. */
function firstIssue(e: unknown): string | null {
  const issues = (e as { issues?: { message: string }[] })?.issues;
  return issues?.[0]?.message ?? null;
}

export async function addLinkAction(
  setId: string,
  input: { label: string; url: string },
): Promise<InstructionState> {
  const { ctx } = await requireContext();
  try {
    await addLinkInstruction(ctx, setId, input);
  } catch (e) {
    return { error: firstIssue(e) ?? message(e) };
  }
  revalidatePath(`/sets/${setId}`);
  return { ok: true };
}

export async function renameInstructionAction(
  setId: string,
  id: string,
  label: string,
): Promise<InstructionState> {
  const { ctx } = await requireContext();
  try {
    await renameInstruction(ctx, id, label);
  } catch (e) {
    return { error: firstIssue(e) ?? message(e) };
  }
  revalidatePath(`/sets/${setId}`);
  return { ok: true };
}

export async function moveInstructionAction(setId: string, id: string, direction: 'up' | 'down') {
  const { ctx } = await requireContext();
  await moveInstruction(ctx, id, direction);
  revalidatePath(`/sets/${setId}`);
}

export async function trashInstructionAction(setId: string, id: string): Promise<InstructionState> {
  const { ctx } = await requireContext();
  await trashInstruction(ctx, id);
  revalidatePath(`/sets/${setId}`);
  return { ok: true };
}

/** Called by the upload and save-link panels after the route handler stored a file. */
export async function refreshSetAction(setId: string) {
  await requireContext();
  revalidatePath(`/sets/${setId}`);
}
