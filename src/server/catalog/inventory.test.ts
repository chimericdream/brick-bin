import { beforeEach, describe, expect, it } from 'vitest';

import type { Db } from '../db/client';
import {
  rbColors,
  rbElements,
  rbInventories,
  rbInventoryMinifigs,
  rbInventoryParts,
  rbInventorySets,
  rbMinifigs,
  rbPartCategories,
  rbParts,
} from '../db/schema';
import { createTestDb } from '../db/test-db';
import {
  loadSetInventory,
  partColors,
  queryInventory,
  searchParts,
  type InventoryPart,
} from './inventory';

let db: Db;

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(rbPartCategories).values([
    { id: 11, name: 'Bricks' },
    { id: 14, name: 'Plates' },
  ]);
  await db.insert(rbParts).values([
    { partNum: '3001', name: 'Brick 2 x 4', partCatId: 11 },
    { partNum: '3001a', name: 'Brick 2 x 4 old', partCatId: 11 },
    { partNum: '3023', name: 'Plate 1 x 2', partCatId: 14 },
    { partNum: '3020', name: 'Plate 2 x 4', partCatId: 14 },
    { partNum: '4081', name: 'Plate, Modified 1 x 1 with Clip', partCatId: 14 },
  ]);
  await db.insert(rbColors).values([
    { id: 0, name: 'Black', rgb: '05131D', isTrans: false },
    { id: 4, name: 'Red', rgb: 'C91A09', isTrans: false },
    { id: 15, name: 'White', rgb: 'FFFFFF', isTrans: false },
    { id: 71, name: 'Light Bluish Gray', rgb: 'A0A5A9', isTrans: false },
  ]);
  await db.insert(rbMinifigs).values([
    { figNum: 'fig-1', name: 'Captain', imgUrl: 'https://x/1.jpg' },
    { figNum: 'fig-2', name: 'Deckhand', imgUrl: null },
  ]);
  // Set A (version 1 and 2), with a bundled sub-set B included twice.
  await db.insert(rbInventories).values([
    { id: 1, version: 1, setNum: 'A-1' },
    { id: 2, version: 2, setNum: 'A-1' },
    { id: 3, version: 1, setNum: 'B-1' },
    { id: 4, version: 2, setNum: 'B-1' },
  ]);
  await db.insert(rbInventoryParts).values([
    { inventoryId: 1, partNum: '3001', colorId: 0, quantity: 99, isSpare: false }, // old version
    { inventoryId: 2, partNum: '3001', colorId: 0, quantity: 4, isSpare: false },
    { inventoryId: 2, partNum: '3023', colorId: 4, quantity: 2, isSpare: false },
    { inventoryId: 2, partNum: '3023', colorId: 4, quantity: 1, isSpare: true },
    { inventoryId: 3, partNum: '3020', colorId: 15, quantity: 50, isSpare: false }, // old sub-set version
    { inventoryId: 4, partNum: '3020', colorId: 15, quantity: 3, isSpare: false },
    { inventoryId: 4, partNum: '3023', colorId: 4, quantity: 1, isSpare: false },
  ]);
  await db.insert(rbInventorySets).values({ inventoryId: 2, setNum: 'B-1', quantity: 2 });
  await db.insert(rbInventoryMinifigs).values([
    { inventoryId: 2, figNum: 'fig-1', quantity: 1 },
    { inventoryId: 4, figNum: 'fig-1', quantity: 1 },
    { inventoryId: 4, figNum: 'fig-2', quantity: 3 },
  ]);
  await db.insert(rbElements).values([
    { elementId: '1', partNum: '3001', colorId: 0 },
    { elementId: '2', partNum: '3001', colorId: 4 },
  ]);
});

describe('loadSetInventory', () => {
  it('uses the newest version, folds sub-sets in (times how many), and keeps spares flagged', async () => {
    const inv = await loadSetInventory(db, 'A-1');
    expect(inv.version).toBe(2);
    expect(inv.versions).toEqual([2, 1]);
    const find = (num: string, color: number, spare = false) =>
      inv.parts.find((p) => p.partNum === num && p.colorId === color && p.isSpare === spare);
    expect(find('3001', 0)?.quantity).toBe(4); // not the old version's 99
    expect(find('3023', 4)?.quantity).toBe(2 + 2 * 1); // own 2, plus the sub-set's 1 twice
    expect(find('3023', 4, true)?.quantity).toBe(1);
    expect(find('3020', 15)?.quantity).toBe(6); // 3 per sub-set, twice
    expect(find('3001', 0)).toMatchObject({
      name: 'Brick 2 x 4',
      categoryName: 'Bricks',
      colorName: 'Black',
      rgb: '05131D',
    });
  });

  it('lists minifigures, folding sub-sets in', async () => {
    const inv = await loadSetInventory(db, 'A-1');
    expect(inv.figs).toEqual([
      { figNum: 'fig-1', name: 'Captain', imgUrl: 'https://x/1.jpg', quantity: 3 },
      { figNum: 'fig-2', name: 'Deckhand', imgUrl: null, quantity: 6 },
    ]);
  });

  it('can use an older inventory version, and falls back to the newest for an unknown one', async () => {
    expect(
      (await loadSetInventory(db, 'A-1', 1)).parts.find((p) => p.partNum === '3001')?.quantity,
    ).toBe(99);
    expect((await loadSetInventory(db, 'A-1', 7)).version).toBe(2);
  });

  it('returns an empty inventory for a set the catalog does not have', async () => {
    expect(await loadSetInventory(db, 'nope-1')).toEqual({
      version: null,
      versions: [],
      parts: [],
      figs: [],
    });
  });

  it('ignores a sub-set with no inventory', async () => {
    await db.insert(rbInventorySets).values({ inventoryId: 2, setNum: 'ghost-1', quantity: 1 });
    expect((await loadSetInventory(db, 'A-1')).parts.length).toBeGreaterThan(0);
  });
});

const part = (over: Partial<InventoryPart>): InventoryPart => ({
  partNum: '1',
  name: 'Thing',
  categoryId: 11,
  categoryName: 'Bricks',
  colorId: 0,
  colorName: 'Black',
  rgb: '000000',
  isTrans: false,
  quantity: 1,
  isSpare: false,
  ...over,
});

describe('queryInventory', () => {
  const parts = [
    part({ partNum: '3001', name: 'Brick 2 x 4', colorId: 0, colorName: 'Black' }),
    part({ partNum: '3001', name: 'Brick 2 x 4', colorId: 4, colorName: 'Red' }),
    part({
      partNum: '3023',
      name: 'Plate 1 x 2',
      categoryId: 14,
      categoryName: 'Plates',
      colorId: 4,
      colorName: 'Red',
    }),
    part({
      partNum: '3024',
      name: 'Plate 1 x 1',
      categoryId: 14,
      categoryName: 'Plates',
      colorId: 15,
      colorName: 'White',
      isSpare: true,
    }),
  ];

  it('hides spares unless asked, and counts them', () => {
    expect(queryInventory(parts).total).toBe(3);
    expect(queryInventory(parts, { spares: true }).total).toBe(4);
    expect(queryInventory(parts).spareCount).toBe(1);
  });

  it('filters by text (name, number prefix, colour), colour and category', () => {
    expect(queryInventory(parts, { q: 'plate' }).total).toBe(1);
    expect(queryInventory(parts, { q: '3001' }).total).toBe(2);
    expect(queryInventory(parts, { q: 'red' }).total).toBe(2);
    expect(queryInventory(parts, { colorId: 4 }).total).toBe(2);
    expect(queryInventory(parts, { categoryId: 14 }).total).toBe(1);
    expect(
      queryInventory(parts, { colorId: 4, categoryId: 14 }).parts.map((p) => p.partNum),
    ).toEqual(['3023']);
  });

  it('counts colours and categories under the other filters, so choices never lead to nothing', () => {
    const page = queryInventory(parts, { categoryId: 14, spares: true });
    expect(page.colors.map((c) => [c.name, c.n])).toEqual([
      ['Red', 1],
      ['White', 1],
    ]);
    const byColor = queryInventory(parts, { colorId: 4 });
    expect(byColor.categories.map((c) => [c.name, c.n])).toEqual([
      ['Bricks', 1],
      ['Plates', 1],
    ]);
  });

  it('sorts by category, name, number then colour, and pages', () => {
    const page = queryInventory(parts, { spares: true });
    expect(page.parts.map((p) => `${p.partNum}${p.colorName}`)).toEqual([
      '3001Black',
      '3001Red',
      '3024White',
      '3023Red',
    ]);
    expect(queryInventory(parts, { spares: true, offset: 1, limit: 2 }).parts).toHaveLength(2);
    expect(queryInventory(parts, { offset: 99 }).parts).toEqual([]);
  });
});

describe('catalog-wide part search', () => {
  it('finds numbers first (shortest first), then names', async () => {
    expect((await searchParts(db, '3001')).map((p) => p.partNum)).toEqual(['3001', '3001a']);
    expect((await searchParts(db, 'plate')).map((p) => p.partNum)).toEqual([
      '3023',
      '3020',
      '4081',
    ]);
    expect((await searchParts(db, 'clip'))[0]).toMatchObject({
      partNum: '4081',
      categoryName: 'Plates',
    });
  });

  it('ignores short queries, and treats % and _ as text', async () => {
    expect(await searchParts(db, 'a')).toEqual([]);
    expect(await searchParts(db, '%%')).toEqual([]);
    expect(await searchParts(db, 'pl_te')).toEqual([]);
  });

  it('lists colours with the ones a part is known in first', async () => {
    const colors = await partColors(db, '3001');
    expect(colors.slice(0, 2).map((c) => [c.name, c.known])).toEqual([
      ['Black', true],
      ['Red', true],
    ]);
    expect(colors.slice(2).every((c) => !c.known)).toBe(true);
    expect(colors.map((c) => c.name)).toContain('Light Bluish Gray');
    // A part known only from a set inventory counts too.
    expect((await partColors(db, '3020'))[0]).toMatchObject({ name: 'White', known: true });
    expect((await partColors(db, 'unknown')).every((c) => !c.known)).toBe(true);
  });
});
