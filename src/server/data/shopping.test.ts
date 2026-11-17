import { beforeEach, describe, expect, it } from 'vitest';

import {
  rbColorMappings,
  rbColors,
  rbElements,
  rbMinifigs,
  rbPartCategories,
  rbPartMappings,
  rbPartRelationships,
  rbParts,
  rbSetMappings,
} from '../db/schema';
import { createBrand } from './brands';
import { addCopies, trashCopy } from './copies';
import { createLocation } from './places';
import { addMissing, resolveMissing } from './missing';
import { createSet, type SetInput } from './sets';
import { listShopping, shoppingFacets, type ShoppingGroup } from './shopping';
import {
  csvField,
  loadBrickLinkMaps,
  toBrickLinkXml,
  toPlainCsv,
  toRebrickableCsv,
} from './shopping-export';
import { createTheme } from './themes';
import { createWorld, type TestWorld } from './test-helpers';

let w: TestWorld;

beforeEach(async () => {
  w = await createWorld();
  await w.db.insert(rbPartCategories).values([
    { id: 11, name: 'Bricks' },
    { id: 14, name: 'Plates' },
  ]);
  await w.db.insert(rbParts).values([
    { partNum: '3001', name: 'Brick 2 x 4', partCatId: 11 },
    { partNum: '3001old', name: 'Brick 2 x 4 old', partCatId: 11 },
    { partNum: '3023', name: 'Plate 1 x 2', partCatId: 14 },
  ]);
  await w.db.insert(rbColors).values([
    { id: 0, name: 'Black', rgb: '05131D', isTrans: false },
    { id: 4, name: 'Red', rgb: 'C91A09', isTrans: false },
    { id: 15, name: 'White', rgb: 'FFFFFF', isTrans: false },
  ]);
  await w.db.insert(rbMinifigs).values({ figNum: 'fig-1', name: 'Captain' });
  await w.db.insert(rbElements).values({ elementId: '300126', partNum: '3001', colorId: 0 });
  await w.db.insert(rbPartRelationships).values([
    { relType: 'A', childPartNum: '3001old', parentPartNum: '3001' },
    { relType: 'P', childPartNum: '3023pr1', parentPartNum: '3023' }, // printed: not an "any will do"
  ]);
});

let n = 0;
async function mk(
  name: string,
  copyCount = 1,
  over: Partial<SetInput> = {},
  copyInput: Parameters<typeof addCopies>[2] = { buildState: 'built' },
) {
  const set = await createSet(w.admin, {
    brandId: w.legoId,
    setNumber: String(++n),
    name,
    ...over,
  });
  const made = copyCount ? await addCopies(w.admin, set.id, copyInput, copyCount) : [];
  return { set, copies: made };
}

const part = (partNum: string, colorId: number, quantity: number) => ({
  kind: 'part' as const,
  partNum,
  colorId,
  quantity,
});

describe('grouping', () => {
  it('sums a part and colour across copies and sets, and says which sets need it', async () => {
    const a = await mk('Titanic', 2);
    const b = await mk('Hogwarts');
    await addMissing(w.admin, a.copies[0]!.id, part('3023', 4, 2));
    await addMissing(w.admin, a.copies[1]!.id, part('3023', 4, 1));
    await addMissing(w.admin, b.copies[0]!.id, part('3023', 4, 1));
    await addMissing(w.admin, b.copies[0]!.id, part('3023', 0, 5)); // another colour: its own line
    const { groups, pieces, lines } = await listShopping(w.admin);
    expect(lines).toBe(2);
    expect(pieces).toBe(9);
    const red = groups.find((g) => g.colorName === 'Red')!;
    expect(red).toMatchObject({
      partNum: '3023',
      quantity: 4,
      name: 'Plate 1 x 2',
      categoryName: 'Plates',
    });
    expect(red.sources.map((s) => [s.setName, s.copyPosition, s.copiesInSet, s.quantity])).toEqual([
      ['Titanic', 1, 2, 2],
      ['Titanic', 2, 2, 1],
      ['Hogwarts', 1, 1, 1],
    ]);
  });

  it('leaves out resolved items, sealed-or-not, and a trashed copy’s items', async () => {
    const a = await mk('Titanic', 2);
    const x = await addMissing(w.admin, a.copies[0]!.id, part('3023', 4, 2));
    await addMissing(w.admin, a.copies[1]!.id, part('3001', 0, 3));
    await resolveMissing(w.admin, x.id, 'bought');
    expect((await listShopping(w.admin)).groups.map((g) => g.partNum)).toEqual(['3001']);
    await trashCopy(w.admin, a.copies[1]!.id);
    expect((await listShopping(w.admin)).groups).toEqual([]);
  });

  it('keeps minifigures and free-text pieces as their own lines (same text merges, ignoring case)', async () => {
    const a = await mk('Titanic');
    await addMissing(w.admin, a.copies[0]!.id, { kind: 'minifig', figNum: 'fig-1', quantity: 1 });
    await addMissing(w.admin, a.copies[0]!.id, {
      kind: 'other',
      description: 'Sticker sheet',
      quantity: 1,
    });
    const b = await mk('Other set');
    await addMissing(w.admin, b.copies[0]!.id, {
      kind: 'other',
      description: 'sticker SHEET',
      quantity: 2,
    });
    const { groups } = await listShopping(w.admin);
    expect(groups.map((g) => [g.kind, g.name, g.quantity])).toEqual([
      ['minifig', 'Captain', 1],
      ['other', 'Sticker sheet', 3],
    ]);
  });

  it('adds element ids and "any of these will do" hints, but not printed variants', async () => {
    const a = await mk('Titanic');
    await addMissing(w.admin, a.copies[0]!.id, part('3001', 0, 1));
    await addMissing(w.admin, a.copies[0]!.id, part('3023', 4, 1));
    const { groups } = await listShopping(w.admin);
    const brick = groups.find((g) => g.partNum === '3001')!;
    expect(brick).toMatchObject({ elementId: '300126', hints: ['3001old'] });
    expect(groups.find((g) => g.partNum === '3023')).toMatchObject({ elementId: null, hints: [] });
  });
});

describe('scope and sorting', () => {
  it('limits to chosen sets, copies, brands, themes (with children), owners, places and colours', async () => {
    const cada = await createBrand(w.admin, { name: 'CaDA' });
    const star = await createTheme(w.admin, { name: 'Star Wars' });
    const ucs = await createTheme(w.admin, { name: 'UCS', parentId: star.id });
    const attic = await createLocation(w.admin, 'Attic');
    const shelf = await createLocation(w.admin, 'Shelf', attic.id);
    const a = await mk(
      'A',
      1,
      { themeId: ucs.id },
      { buildState: 'built', locationId: shelf.id, ownerUserId: w.member.viewer.userId },
    );
    const b = await mk('B', 1, { brandId: cada.id });
    await addMissing(w.admin, a.copies[0]!.id, part('3001', 0, 1));
    await addMissing(w.admin, b.copies[0]!.id, part('3023', 4, 1));
    const names = async (scope: Parameters<typeof listShopping>[1]) =>
      (await listShopping(w.admin, scope)).groups.map((g) => g.partNum);

    expect(await names({ setIds: [a.set.id] })).toEqual(['3001']);
    expect(await names({ copyIds: [b.copies[0]!.id] })).toEqual(['3023']);
    expect(await names({ brandIds: [cada.id] })).toEqual(['3023']);
    expect(await names({ themeIds: [star.id] })).toEqual(['3001']);
    expect(await names({ locationIds: [attic.id] })).toEqual(['3001']);
    expect(await names({ locationIds: ['none'] })).toEqual(['3023']);
    expect(await names({ ownerIds: [w.member.viewer.userId] })).toEqual(['3001']);
    expect(await names({ ownerIds: ['none'] })).toEqual(['3023']);
    expect(await names({ colorIds: [4] })).toEqual(['3023']);
    expect((await names({})).toSorted()).toEqual(['3001', '3023']);
  });

  it('sorts by colour (parts first), by category or by set', async () => {
    const a = await mk('Zebra');
    const b = await mk('Apple');
    await addMissing(w.admin, a.copies[0]!.id, part('3023', 15, 1)); // White plate
    await addMissing(w.admin, a.copies[0]!.id, part('3001', 4, 1)); // Red brick
    await addMissing(w.admin, b.copies[0]!.id, part('3023', 0, 1)); // Black plate
    await addMissing(w.admin, b.copies[0]!.id, {
      kind: 'other',
      description: 'Sticker',
      quantity: 1,
    });
    const order = async (sort: 'color' | 'category' | 'set') =>
      (await listShopping(w.admin, { sort })).groups.map((g) => g.colorName ?? g.name);
    expect(await order('color')).toEqual(['Black', 'Red', 'White', 'Sticker']);
    expect(await order('category')).toEqual(['Red', 'Black', 'White', 'Sticker']); // Bricks, then Plates by colour, then uncategorised
    expect((await order('set'))[0]).toBe('Black'); // Apple's lines first
  });
});

describe('visibility', () => {
  it('refuses kid profiles outright', async () => {
    await expect(listShopping(w.kid)).rejects.toThrow(/cannot see the shopping list/);
    await expect(shoppingFacets(w.kid)).rejects.toThrow(/cannot see/);
  });

  it('never includes another household’s items', async () => {
    const a = await mk('Mine');
    await addMissing(w.admin, a.copies[0]!.id, part('3001', 0, 1));
    expect((await listShopping(w.other)).groups).toEqual([]);
  });

  it('offers filter choices only for things open items use', async () => {
    const a = await mk('A', 1, {}, { buildState: 'built', ownerUserId: w.member.viewer.userId });
    await addMissing(w.admin, a.copies[0]!.id, part('3001', 4, 1));
    const f = await shoppingFacets(w.admin);
    expect(f.colors).toEqual([{ id: 4, name: 'Red' }]);
    expect(f.owners).toEqual([{ id: w.member.viewer.userId, name: 'Mia' }]);
    expect(f.hasUnowned).toBe(false);
  });
});

describe('exports', () => {
  async function sample() {
    await w.db.insert(rbColorMappings).values([
      {
        id: 0,
        extSystem: 'BL',
        extId: '11',
        extDescr: '["Black"]',
        isExportId: true,
        isImportId: true,
      },
      {
        id: 4,
        extSystem: 'BL',
        extId: '5',
        extDescr: '["Red"]',
        isExportId: true,
        isImportId: true,
      },
      {
        id: 4,
        extSystem: 'BL',
        extId: '99',
        extDescr: '["Red old"]',
        isExportId: false,
        isImportId: true,
      },
      {
        id: 4,
        extSystem: 'BO',
        extId: '21',
        extDescr: '["Red"]',
        isExportId: true,
        isImportId: true,
      },
    ]);
    await w.db.insert(rbPartMappings).values([
      { partNum: '3001', extSystem: 'BL', extId: '3001', isExportId: true, isImportId: true },
      { partNum: '3023', extSystem: 'BL', extId: '3023', isExportId: false, isImportId: true },
      { partNum: '3023', extSystem: 'BL', extId: '3023b', isExportId: true, isImportId: true },
    ]);
    await w.db.insert(rbSetMappings).values({ setNum: 'fig-1', extSystem: 'BL', extId: 'sw0001' });
    const a = await mk('Titanic');
    await addMissing(w.admin, a.copies[0]!.id, part('3001', 0, 4));
    await addMissing(w.admin, a.copies[0]!.id, part('3023', 4, 2));
    await addMissing(w.admin, a.copies[0]!.id, { kind: 'minifig', figNum: 'fig-1', quantity: 1 });
    await addMissing(w.admin, a.copies[0]!.id, {
      kind: 'other',
      description: '=HYPERLINK("x")',
      quantity: 1,
    });
    return (await listShopping(w.admin)).groups;
  }

  it('writes a BrickLink wanted list using the export ids, and lists what has no BrickLink id', async () => {
    const groups = await sample();
    const { xml, unmapped } = toBrickLinkXml(groups, await loadBrickLinkMaps(w.db, groups));
    expect(xml).toContain(
      '<ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>3001</ITEMID><COLOR>11</COLOR><MINQTY>4</MINQTY></ITEM>',
    );
    expect(xml).toContain('<ITEMID>3023b</ITEMID><COLOR>5</COLOR><MINQTY>2</MINQTY>'); // the export row, the BL (not BO) colour
    expect(xml).toContain(
      '<ITEM><ITEMTYPE>M</ITEMTYPE><ITEMID>sw0001</ITEMID><MINQTY>1</MINQTY></ITEM>',
    );
    expect(xml.startsWith('<INVENTORY>')).toBe(true);
    expect(xml.trimEnd().endsWith('</INVENTORY>')).toBe(true);
    expect(unmapped.map((g) => g.kind)).toEqual(['other']);
  });

  it('leaves out parts with no BrickLink part or colour id and reports them', async () => {
    const groups = await sample();
    const { xml, unmapped } = toBrickLinkXml(groups, {
      parts: new Map([['3001', '3001']]),
      colors: new Map(),
      figs: new Map(),
    });
    expect(xml).not.toContain('<ITEM>');
    expect(unmapped).toHaveLength(4);
  });

  it('escapes XML special characters', () => {
    const g: ShoppingGroup = {
      kind: 'part',
      partNum: 'a&b',
      colorId: 1,
      figNum: null,
      quantity: 1,
      name: '',
      colorName: null,
      rgb: null,
      categoryName: null,
      elementId: null,
      sources: [],
      hints: [],
      key: 'k',
    };
    const { xml } = toBrickLinkXml([g], {
      parts: new Map([['a&b', 'x<y>"z']]),
      colors: new Map([[1, '1']]),
      figs: new Map(),
    });
    expect(xml).toContain('<ITEMID>x&lt;y&gt;&quot;z</ITEMID>');
  });

  it('writes the Rebrickable parts list with only parts', async () => {
    const groups = await sample();
    const { csv, skipped } = toRebrickableCsv(groups);
    expect(csv).toBe('Part,Color,Quantity\r\n3001,0,4\r\n3023,4,2\r\n');
    expect(skipped.map((g) => g.kind).toSorted()).toEqual(['minifig', 'other']);
  });

  it('writes a plain CSV with sets and alternates, quoting and neutralising spreadsheet formulas', async () => {
    const groups = await sample();
    const text = toPlainCsv(groups);
    const lines = text.trimEnd().split('\r\n');
    expect(lines[0]).toBe('Type,Part or figure,Name,Colour,Element id,Quantity,Sets,Alternates');
    expect(lines).toContain('Part,3001,Brick 2 x 4,Black,300126,4,Titanic x4,3001old');
    // Quoted because of the inner quotes, with the apostrophe guard in front of the formula.
    expect(text).toContain('"\'=HYPERLINK(""x"")"');
  });

  it('csvField quotes and guards', () => {
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('line\nbreak')).toBe('"line\nbreak"');
    expect(csvField('=1+1')).toBe("'=1+1");
    expect(csvField('+1')).toBe("'+1");
    expect(csvField('-2')).toBe("'-2");
    expect(csvField('@sum')).toBe("'@sum");
    expect(csvField(-5)).toBe('-5'); // numbers are numbers
    expect(csvField(null)).toBe('');
  });
});

describe('store trips', () => {
  it('allocates a bought quantity to the oldest rows first', async () => {
    const { allocateOldestFirst } = await import('./shopping');
    const at = (n: number) => new Date(2026, 0, n);
    const sources = [
      { itemId: 'new', quantity: 3, createdAt: at(5) },
      { itemId: 'old', quantity: 3, createdAt: at(1) },
    ];
    expect(allocateOldestFirst(sources, 4)).toEqual([
      { itemId: 'old', quantity: 3 },
      { itemId: 'new', quantity: 1 },
    ]);
    expect(allocateOldestFirst(sources, 2)).toEqual([{ itemId: 'old', quantity: 2 }]);
    expect(allocateOldestFirst(sources, 99)).toHaveLength(2);
    expect(allocateOldestFirst(sources, 0)).toEqual([]);
  });

  it('marks several rows bought in one transaction, or none of them', async () => {
    const { markBoughtBatch } = await import('./missing');
    const a = await mk('A', 2);
    const x = await addMissing(w.admin, a.copies[0]!.id, part('3001', 0, 3));
    const y = await addMissing(w.admin, a.copies[1]!.id, part('3001', 0, 3));
    const z = await addMissing(w.admin, a.copies[1]!.id, part('3023', 4, 1));

    // One bad allocation (more than is missing) undoes the good ones before it.
    await expect(
      markBoughtBatch(w.admin, [
        { itemId: x.id, quantity: 3 },
        { itemId: z.id, quantity: 5 },
      ]),
    ).rejects.toThrow(/Only 1 is missing/);
    expect((await listShopping(w.admin)).pieces).toBe(7);

    await markBoughtBatch(w.admin, [
      { itemId: x.id, quantity: 3 },
      { itemId: y.id, quantity: 1 },
      { itemId: z.id, quantity: 0 },
    ]);
    const { groups } = await listShopping(w.admin);
    expect(groups.map((g) => [g.partNum, g.quantity])).toEqual([
      ['3001', 2],
      ['3023', 1],
    ]);
    await expect(markBoughtBatch(w.kid, [{ itemId: x.id, quantity: 1 }])).rejects.toThrow(
      /cannot make changes/,
    );
  });

  it('lists the ids of every set matching library filters, not one page', async () => {
    const { libraryMatchingSetIds } = await import('./library');
    const { parseLibraryFilters } = await import('./library-filters');
    const a = await mk('A');
    await mk('B', 0);
    const ids = await libraryMatchingSetIds(w.admin, parseLibraryFilters({}));
    expect(ids).toEqual([a.set.id]);
    expect(
      await libraryMatchingSetIds(w.admin, parseLibraryFilters({ unowned: '1' })),
    ).toHaveLength(2);
    expect(await libraryMatchingSetIds(w.other, parseLibraryFilters({ unowned: '1' }))).toEqual([]);
  });
});
