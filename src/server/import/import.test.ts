import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  auditLog,
  brands,
  copies,
  rbSets,
  rbThemes,
  sets,
  themes,
  wishlistItems,
} from '../db/schema';
import { createWorld, type TestWorld } from '../data/test-helpers';
import { commitImport } from './commit';
import { detectFormat, failedRowsCsv, parseCsvText, planImport, type ImportFormat } from './plan';

let w: TestWorld;

beforeEach(async () => {
  w = await createWorld();
  await w.db.insert(rbThemes).values([
    { id: 1, name: 'Star Wars', parentId: null },
    { id: 2, name: 'Ultimate Collector Series', parentId: 1 },
    { id: 721, name: 'Icons', parentId: null },
  ]);
  await w.db.insert(rbSets).values([
    { setNum: '10294-1', name: 'Titanic', year: 2021, themeId: 721, numParts: 9092 },
    { setNum: '75192-1', name: 'Millennium Falcon', year: 2017, themeId: 2, numParts: 7541 },
  ]);
});

async function plan(text: string, force?: ImportFormat) {
  const parsed = await parseCsvText(text);
  const detected = detectFormat(parsed.headers);
  return {
    parsed,
    plan: await planImport(w.admin, parsed, force ?? detected.format, detected.mapping),
    detected,
  };
}

const REBRICKABLE = `Set Number,Quantity,Includes Spares,Inventory Ver
10294-1,2,True,1
75192-1,1,True,1
99999-1,1,True,1
`;

const BRICKSET = `Number,NumberVariant,SetName,Year,Theme,Pieces,QtyOwned,Wanted
10294,1,Titanic,2021,Icons,9090,1,false
75192,1,Millennium Falcon,2017,Star Wars,7541,0,true
`;

describe('formats', () => {
  it('recognises the Rebrickable and Brickset exports and falls back to generic', async () => {
    expect(detectFormat((await parseCsvText(REBRICKABLE)).headers).format).toBe('rebrickable');
    expect(detectFormat((await parseCsvText(BRICKSET)).headers).format).toBe('brickset');
    const generic = detectFormat(['Name', 'Maker', 'Set #', 'Price']);
    expect(generic.format).toBe('generic');
    expect(generic.mapping).toMatchObject({ name: 0, brand: 1, pricePaid: 3 });
  });

  it('reads quoted commas, CRLF and a byte order mark', async () => {
    const parsed = await parseCsvText('﻿Name,Notes\r\n"Crane, big","said ""hi"""\r\n');
    expect(parsed.headers).toEqual(['Name', 'Notes']);
    expect(parsed.rows).toEqual([['Crane, big', 'said "hi"']]);
  });
});

describe('planning', () => {
  it('resolves a Rebrickable list against the catalog and reports what is missing', async () => {
    const { plan: p } = await plan(REBRICKABLE);
    expect(p.summary).toMatchObject({ rows: 3, newSets: 2, copies: 3, failed: 1, wishlist: 0 });
    expect(p.rows.find((r) => r.failure)).toMatchObject({
      line: 4,
      failure: 'Not found in the catalog',
    });
    expect(p.rows[0]).toMatchObject({
      setNumber: '10294',
      name: 'Titanic',
      copies: 2,
      isLego: true,
    });
  });

  it('sends Brickset wanted sets to the wishlist and uses the catalog name', async () => {
    const { plan: p } = await plan(BRICKSET);
    expect(p.rows.map((r) => [r.action, r.setNumber, r.copies])).toEqual([
      ['create-set', '10294', 1],
      ['wishlist', '75192', 0],
    ]);
  });

  it('adds copies to a set that already exists and merges repeats within the file', async () => {
    const legoId = w.legoId;
    await w.admin.db.insert(sets).values({
      householdId: w.admin.householdId,
      brandId: legoId,
      setNumber: '10294',
      name: 'Titanic',
    });
    const { plan: p } = await plan(
      `Set Number,Quantity,Includes Spares\n10294-1,1,True\n75192-1,1,True\n75192-1,2,True\n`,
    );
    expect(p.rows.map((r) => r.action)).toEqual(['add-copies', 'create-set', 'add-copies']);
    expect(p.summary).toMatchObject({ newSets: 1, existingSets: 2, copies: 4 });
  });

  it('explains every kind of bad row, and the failed-rows file keeps the originals', async () => {
    const text = [
      'Name,Brand,Set #,Qty,Price',
      'Crane,Mould King,13124,2,59.99', // ok, new brand
      ',Mould King,13125,1,', // no name
      'Tower,,13126,1,', // no brand
      'Tank,Mould King,,1,', // no number
      'Boat,Mould King,13127,lots,', // bad quantity
      'Plane,Mould King,13128,1,$$$', // bad price
      'Truck,Mould King,13129,99,', // too many
      '"=HYPERLINK(""x"")",Mould King,13130,0,', // zero copies, formula-like name
    ].join('\n');
    const { plan: p, parsed } = await plan(text);
    expect(p.rows.map((r) => r.failure)).toEqual([
      null,
      'No name, and the number is not in the catalog',
      'No brand, and the number is not in the catalog',
      'No set number',
      '"lots" is not a number of copies',
      '"$$$" is not a price',
      'More than 50 copies of one set',
      'Zero copies and not on the wanted list',
    ]);
    expect(p.summary.newBrands).toEqual(['Mould King']);
    const csv = failedRowsCsv(parsed.headers, p);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('Name,Brand,Set #,Qty,Price,Import problem');
    expect(lines).toHaveLength(8);
    expect(csv).toContain("'=HYPERLINK"); // formulas are defused
    // The failed file imports again once fixed: it parses back to the same columns.
    expect((await parseCsvText(csv)).rows[0]).toHaveLength(6);
  });

  it('caps the file at 2000 rows and says so', async () => {
    const body = Array.from({ length: 2005 }, (_, i) => `Set ${i},LEGO,${i}`).join('\n');
    const { plan: p } = await plan(`Name,Brand,Set #\n${body}`);
    expect(p.tooMany).toBe(true);
    expect(p.summary.rows).toBe(2000);
  });
});

describe('commit', () => {
  it('creates brands, themes, sets, copies and wishes with an audit row per entity, in one go', async () => {
    const { plan: p } = await plan(
      `Name,Brand,Theme,Set #,Qty,Price,Notes\nCrane,Mould King,Technic-ish,13124,2,59.99,gift\nTitanic,LEGO,,10294,1,,\n`,
    );
    const baseline = (await w.db.select().from(auditLog)).length;
    const result = await commitImport(w.admin, p, { buildState: 'built' });
    expect(result).toMatchObject({ setsCreated: 2, copiesAdded: 3, brandsCreated: 1 });
    const crane = (await w.db.select().from(sets).where(eq(sets.name, 'Crane')))[0]!;
    expect(crane.setNumber).toBe('13124');
    const cs = await w.db.select().from(copies).where(eq(copies.setId, crane.id));
    expect(cs).toHaveLength(2);
    expect(cs[0]).toMatchObject({ buildState: 'built', pricePaidCents: 5999, notes: 'gift' });
    expect((await w.db.select().from(themes)).map((t) => t.name)).toContain('Technic-ish');
    // Titanic took its year, pieces and theme from the catalog, linked to it.
    const titanic = (await w.db.select().from(sets).where(eq(sets.name, 'Titanic')))[0]!;
    expect(titanic).toMatchObject({ year: 2021, pieceCount: 9092, rbSetNum: '10294-1' });
    const audit = (await w.db.select().from(auditLog)).slice(baseline);
    const count = (type: string) =>
      audit.filter((a) => a.entityType === type && a.action === 'create').length;
    expect({ brand: count('brand'), set: count('set'), copy: count('copy') }).toEqual({
      brand: 1,
      set: 2,
      copy: 3,
    });
  });

  it('a catalog set gets its whole catalog theme chain', async () => {
    const { plan: p } = await plan(`Set Number,Quantity,Includes Spares\n75192-1,1,True\n`);
    await commitImport(w.admin, p, { buildState: 'sealed' });
    const names = (await w.db.select().from(themes)).map((t) => t.name).toSorted();
    expect(names).toEqual(['Star Wars', 'Ultimate Collector Series']);
  });

  it('puts wanted sets on the importer’s own wishlist', async () => {
    const { plan: p } = await plan(BRICKSET);
    const result = await commitImport(w.member, p, { buildState: 'sealed' });
    expect(result).toMatchObject({ wishesAdded: 1, setsCreated: 1 });
    const [wish] = await w.db.select().from(wishlistItems);
    expect(wish).toMatchObject({
      title: 'Millennium Falcon',
      requestedByUserId: w.member.viewer.userId,
      rbSetNum: '75192-1',
    });
  });

  it('rolls everything back when any row fails to write', async () => {
    const { plan: p } = await plan(
      `Name,Brand,Set #,Qty\nOk,Mould King,1,1\nToo long,Mould King,2,1\n`,
    );
    p.rows[1]!.name = 'x'.repeat(500); // passes planning, fails the data layer's validation
    await expect(commitImport(w.admin, p, { buildState: 'sealed' })).rejects.toThrow();
    expect(await w.db.select().from(sets)).toEqual([]);
    expect((await w.db.select().from(brands)).map((b) => b.name)).not.toContain('Mould King');
    expect(await w.db.select().from(copies)).toEqual([]);
  });

  it('is refused for kid profiles', async () => {
    const { plan: p } = await plan(REBRICKABLE);
    await expect(commitImport(w.kid, p, { buildState: 'sealed' })).rejects.toThrow(
      /cannot make changes/,
    );
  });
});
