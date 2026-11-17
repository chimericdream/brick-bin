/**
 * Splits a quantity across the rows that need a part, oldest row first. A trip that bought 4 of a
 * part that two copies need (3 and 3) fills the older copy first. Returns the quantity per row; the
 * dialog lets the person change it.
 */
export function allocateOldestFirst(
  sources: { itemId: string; quantity: number; createdAt: Date }[],
  quantity: number,
): { itemId: string; quantity: number }[] {
  const out: { itemId: string; quantity: number }[] = [];
  let left = quantity;
  for (const s of sources.toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    if (left <= 0) break;
    const take = Math.min(s.quantity, left);
    out.push({ itemId: s.itemId, quantity: take });
    left -= take;
  }
  return out;
}
