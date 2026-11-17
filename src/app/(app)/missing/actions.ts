'use server';

import { revalidatePath } from 'next/cache';

import { requireContext } from '@/server/auth/current';
import { markBoughtBatch, type Allocation } from '@/server/data/missing';

export interface TripState {
  error?: string;
  ok?: boolean;
}

/** The end of a store trip: everything ticked becomes "bought", all together or not at all. */
export async function markBoughtAction(allocations: Allocation[]): Promise<TripState> {
  const { ctx } = await requireContext();
  try {
    await markBoughtBatch(
      ctx,
      allocations.map((a) => ({
        itemId: String(a.itemId),
        quantity: Math.floor(Number(a.quantity)),
      })),
    );
  } catch (e) {
    return {
      error:
        e instanceof Error && e.name !== 'ZodError' ? e.message : 'Could not mark those as bought.',
    };
  }
  revalidatePath('/missing');
  revalidatePath('/sets');
  return { ok: true };
}
