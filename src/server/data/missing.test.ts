import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { copyMissingItems, rbColors, rbMinifigs, rbPartCategories, rbParts } from '../db/schema';
import { historyFor } from './audit';
import { addCopies, listCopiesForSet, trashCopy } from './copies';
import { listLibrary } from './library';
import { parseLibraryFilters } from './library-filters';
import {
  UnknownCatalogItemError,
  addMissing,
  listMissing,
  markPiecesChecked,
  openMissingByCopy,
  removeMissing,
  resolveMissing,
  setMissingQuantity,
} from './missing';
import { createSet } from './sets';
import { createWorld, type TestWorld } from './test-helpers';

let w: TestWorld;
let copyId: string;
let setId: string;

beforeEach(async () => {
  w = await createWorld();
  await w.db.insert(rbPartCategories).values({ id: 14, name: 'Plates' });
  await w.db.insert(rbParts).values([
    { partNum: '3023', name: 'Plate 1 x 2', partCatId: 14 },
    { partNum: '3001', name: 'Brick 2 x 4', partCatId: 14 },
  ]);
  await w.db.insert(rbColors).values([
    { id: 0, name: 'Black', rgb: '05131D', isTrans: false },
    { id: 4, name: 'Red', rgb: 'C91A09', isTrans: false },
  ]);
  await w.db
    .insert(rbMinifigs)
    .values({ figNum: 'fig-000001', name: 'Toy Store Employee', imgUrl: 'https://x/fig.jpg' });
  const set = await createSet(w.admin, { brandId: w.legoId, setNumber: '1', name: 'Titanic' });
  setId = set.id;
  [{ id: copyId }] = (await addCopies(w.admin, set.id, { buildState: 'built' })) as {
    id: string;
  }[];
});

const part = (partNum = '3023', colorId = 0, q = 1) => ({
  kind: 'part' as const,
  partNum,
  colorId,
  quantity: q,
});

describe('adding', () => {
  it('copies names from the catalog and audits the row', async () => {
    const item = await addMissing(w.member, copyId, { ...part('3023', 4, 3), fromInventory: true });
    expect(item).toMatchObject({
      kind: 'part',
      rbPartNum: '3023',
      rbColorId: 4,
      quantity: 3,
      snapshotName: 'Plate 1 x 2',
      snapshotColorName: 'Red',
      fromInventory: true,
      createdByUserId: w.member.viewer.userId,
    });
    const [entry] = await historyFor(w.admin, 'missing_item', item.id);
    expect(entry!.changes).toMatchObject({ quantity: [null, 3], name: [null, 'Plate 1 x 2'] });
  });

  it('raises the quantity when the same part and colour is added again, but keeps other colours apart', async () => {
    const a = await addMissing(w.admin, copyId, part('3023', 0, 2));
    const again = await addMissing(w.admin, copyId, part('3023', 0, 3));
    expect(again.id).toBe(a.id);
    expect(again.quantity).toBe(5);
    await addMissing(w.admin, copyId, part('3023', 4, 1));
    expect((await listMissing(w.admin, copyId)).open).toHaveLength(2);
    expect(
      (await historyFor(w.admin, 'missing_item', a.id)).some((h) => h.changes.quantity?.[1] === 5),
    ).toBe(true);
  });

  it('takes minifigs and free-text "other" pieces; other rows never merge', async () => {
    await addMissing(w.admin, copyId, { kind: 'minifig', figNum: 'fig-000001', quantity: 1 });
    await addMissing(w.admin, copyId, { kind: 'minifig', figNum: 'fig-000001', quantity: 1 });
    await addMissing(w.admin, copyId, { kind: 'other', description: 'Sticker sheet', quantity: 1 });
    await addMissing(w.admin, copyId, { kind: 'other', description: 'Sticker sheet', quantity: 1 });
    const { open } = await listMissing(w.admin, copyId);
    expect(open.map((o) => [o.kind, o.quantity])).toEqual([
      ['minifig', 2],
      ['other', 1],
      ['other', 1],
    ]);
    expect(open[0]).toMatchObject({
      snapshotName: 'Toy Store Employee',
      snapshotImage: 'https://x/fig.jpg',
    });
    expect(open[1]!.description).toBe('Sticker sheet');
  });

  it('rejects unknown catalog items, bad quantities and kids', async () => {
    await expect(addMissing(w.admin, copyId, part('nope'))).rejects.toBeInstanceOf(
      UnknownCatalogItemError,
    );
    await expect(addMissing(w.admin, copyId, part('3023', 999))).rejects.toBeInstanceOf(
      UnknownCatalogItemError,
    );
    await expect(
      addMissing(w.admin, copyId, { kind: 'minifig', figNum: 'fig-9', quantity: 1 }),
    ).rejects.toBeInstanceOf(UnknownCatalogItemError);
    for (const q of [0, -1, 1.5, 10_000])
      await expect(addMissing(w.admin, copyId, part('3023', 0, q))).rejects.toThrow();
    await expect(
      addMissing(w.admin, copyId, { kind: 'other', description: '  ', quantity: 1 }),
    ).rejects.toThrow();
    await expect(addMissing(w.kid, copyId, part())).rejects.toThrow(/cannot make changes/);
    expect((await listMissing(w.admin, copyId)).open).toEqual([]);
  });

  it('is invisible to other households and to a kid when the set is hidden', async () => {
    await expect(addMissing(w.other, copyId, part())).rejects.toThrow(/Copy not found/);
    const hiddenSet = await createSet(w.admin, {
      brandId: w.legoId,
      setNumber: '2',
      name: 'Present',
      hiddenFromRestricted: true,
    });
    const [hidden] = await addCopies(w.admin, hiddenSet.id, {});
    await addMissing(w.admin, hidden!.id, part());
    expect((await listMissing(w.kid, hidden!.id)).open).toEqual([]);
    expect((await listMissing(w.other, copyId)).open).toEqual([]);
  });
});

describe('resolving', () => {
  it('marks a whole row found, and it leaves the open list', async () => {
    const item = await addMissing(w.admin, copyId, part('3023', 0, 2));
    await resolveMissing(w.member, item.id, 'found');
    const { open, resolved } = await listMissing(w.admin, copyId);
    expect(open).toEqual([]);
    expect(resolved[0]).toMatchObject({
      resolution: 'found',
      quantity: 2,
      resolvedByUserId: w.member.viewer.userId,
    });
  });

  it('splits a partly found row: the open quantity drops and the found ones are recorded', async () => {
    const item = await addMissing(w.admin, copyId, part('3001', 4, 3));
    await resolveMissing(w.admin, item.id, 'bought', 2);
    const { open, resolved } = await listMissing(w.admin, copyId);
    expect(open).toMatchObject([{ id: item.id, quantity: 1 }]);
    expect(resolved).toMatchObject([
      { resolution: 'bought', quantity: 2, rbPartNum: '3001', snapshotName: 'Brick 2 x 4' },
    ]);
    // Adding the part again merges into the open row, not the resolved one.
    expect((await addMissing(w.admin, copyId, part('3001', 4, 1))).id).toBe(item.id);
    expect((await openMissingByCopy(w.admin, [copyId])).get(copyId)).toBe(2);
  });

  it('refuses to resolve more than is missing, a resolved row, or as a kid', async () => {
    const item = await addMissing(w.admin, copyId, part('3023', 0, 2));
    await expect(resolveMissing(w.admin, item.id, 'found', 3)).rejects.toThrow(
      /Only 2 are missing/,
    );
    await expect(resolveMissing(w.admin, item.id, 'found', 0)).rejects.toThrow();
    await expect(resolveMissing(w.kid, item.id, 'found')).rejects.toThrow(/cannot make changes/);
    await resolveMissing(w.admin, item.id, 'substituted');
    await expect(resolveMissing(w.admin, item.id, 'found')).rejects.toThrow(/not open/);
  });

  it('changes a quantity, and removing a row is a real delete with an audit row', async () => {
    const item = await addMissing(w.admin, copyId, part('3023', 0, 2));
    await setMissingQuantity(w.admin, item.id, 5);
    await setMissingQuantity(w.admin, item.id, 5);
    expect(
      (await historyFor(w.admin, 'missing_item', item.id)).filter((h) => h.action === 'update'),
    ).toHaveLength(1);
    expect(await removeMissing(w.admin, item.id)).toBe(true);
    expect(
      await w.db.select().from(copyMissingItems).where(eq(copyMissingItems.id, item.id)),
    ).toEqual([]);
    const history = await historyFor(w.admin, 'missing_item', item.id);
    expect(history[0]).toMatchObject({ action: 'delete' });
    expect(await removeMissing(w.admin, item.id)).toBe(false);
    await expect(removeMissing(w.kid, item.id)).rejects.toThrow(/cannot make changes/);
  });
});

describe('completeness', () => {
  it('derives "missing N pieces" from open rows and drops it when they are resolved', async () => {
    await addMissing(w.admin, copyId, part('3023', 0, 2));
    await addMissing(w.admin, copyId, { kind: 'other', description: 'Sticker', quantity: 1 });
    const [card] = await listCopiesForSet(w.admin, setId);
    expect(card!.completeness).toEqual({ kind: 'missing', pieces: 3 });
    const { open } = await listMissing(w.admin, copyId);
    for (const o of open) await resolveMissing(w.admin, o.id, 'found');
    expect((await listCopiesForSet(w.admin, setId))[0]!.completeness).toEqual({
      kind: 'not_checked',
    });
    await markPiecesChecked(w.admin, copyId, '2026-03-14');
    expect((await listCopiesForSet(w.admin, setId))[0]!.completeness).toEqual({
      kind: 'complete',
      checkedOn: '2026-03-14',
    });
  });

  it('a sealed copy reads "sealed" whatever is missing', async () => {
    const [sealed] = await addCopies(w.admin, setId, { buildState: 'sealed' });
    await addMissing(w.admin, sealed!.id, part());
    const cards = await listCopiesForSet(w.admin, setId);
    expect(cards.find((c) => c.copy.id === sealed!.id)!.completeness).toEqual({ kind: 'sealed' });
  });

  it('feeds the library tiles, filter and facet counts', async () => {
    const [second] = await addCopies(w.admin, setId, {
      buildState: 'built',
      piecesCheckedOn: '2026-01-01',
    });
    await addMissing(w.admin, copyId, part('3023', 0, 4));
    const page = await listLibrary(w.admin, {
      ...parseLibraryFilters({}),
      completeness: ['missing'],
    });
    expect(page.tiles.map((t) => t.name)).toEqual(['Titanic']);
    const tile = page.tiles[0]!;
    expect(tile.copies.find((c) => c.id === copyId)!.completeness).toEqual({
      kind: 'missing',
      pieces: 4,
    });
    expect(tile.copies.find((c) => c.id === second!.id)!.completeness).toMatchObject({
      kind: 'complete',
    });
    const facets = (await listLibrary(w.admin, parseLibraryFilters({}))).facets.completeness;
    expect(facets).toEqual({ missing: 1, complete: 1, not_checked: 0 });
  });

  it('a trashed copy’s missing pieces stop counting', async () => {
    await addMissing(w.admin, copyId, part('3023', 0, 4));
    await trashCopy(w.admin, copyId);
    expect(
      (await listLibrary(w.admin, { ...parseLibraryFilters({}), includeUnowned: true })).facets
        .completeness.missing,
    ).toBe(0);
  });

  it('marking pieces checked is audited, uses the viewer’s day, and skips a repeat', async () => {
    await markPiecesChecked(w.member, copyId, '2026-05-01');
    await markPiecesChecked(w.member, copyId, '2026-05-01');
    await expect(markPiecesChecked(w.member, copyId, 'yesterday')).rejects.toThrow();
    await expect(markPiecesChecked(w.kid, copyId, '2026-05-01')).rejects.toThrow(
      /cannot make changes/,
    );
    const checks = (await historyFor(w.admin, 'copy', copyId)).filter(
      (h) => h.changes.piecesCheckedOn,
    );
    expect(checks).toHaveLength(1);
    expect(checks[0]!.changes.piecesCheckedOn).toEqual([null, '2026-05-01']);
  });
});

describe('kids', () => {
  it('can read the list on a visible set (no money is involved)', async () => {
    await addMissing(w.admin, copyId, part('3023', 4, 2));
    const { open } = await listMissing(w.kid, copyId);
    expect(open).toMatchObject([{ snapshotName: 'Plate 1 x 2', quantity: 2 }]);
  });
});
