import { beforeEach, describe, expect, it } from 'vitest';

import { rbColors, rbParts } from '../db/schema';
import { createBrand } from './brands';
import { getCollection } from './collection';
import { addCopies } from './copies';
import { addMissing } from './missing';
import { createSet, type SetInput } from './sets';
import { createTheme } from './themes';
import { createWorld, type TestWorld } from './test-helpers';

let w: TestWorld;
const NOW = new Date('2026-11-16T12:00:00Z');

beforeEach(async () => {
  w = await createWorld();
});

let n = 0;
const mk = async (over: Partial<SetInput> = {}) =>
  createSet(w.admin, { brandId: w.legoId, setNumber: String(++n), name: `Set ${n}`, ...over });

describe('totals', () => {
  it('counts sets, copies and pieces (a set owned twice counts its pieces twice)', async () => {
    const a = await mk({ pieceCount: 1000 });
    const b = await mk({ pieceCount: 250 });
    await addCopies(w.admin, a.id, {}, 2);
    await addCopies(w.admin, b.id, {});
    await mk({ pieceCount: 99999 }); // no copies: not in the collection
    const c = await getCollection(w.admin, NOW);
    expect(c).toMatchObject({ sets: 2, copies: 3, pieces: 2250 });
  });

  it('sums paid and estimated value and compares only copies that have both', async () => {
    const a = await mk();
    await addCopies(w.admin, a.id, { pricePaidCents: 10_000, estimatedValueCents: 15_000 });
    await addCopies(w.admin, a.id, { pricePaidCents: 5_000 }); // no estimate
    await addCopies(w.admin, a.id, { estimatedValueCents: 2_000 }); // no price
    const c = await getCollection(w.admin, NOW);
    expect(c).toMatchObject({
      paidCents: 15_000,
      estimatedCents: 17_000,
      differenceCents: 5_000, // 15,000 - 10,000, the one copy with both
      copiesWithPrice: 2,
      copiesWithEstimate: 2,
    });
  });

  it('is zero and empty for an empty collection', async () => {
    const c = await getCollection(w.admin, NOW);
    expect(c).toMatchObject({
      sets: 0,
      copies: 0,
      pieces: 0,
      paidCents: 0,
      estimatedCents: 0,
      differenceCents: 0,
    });
    expect(c.byBrand).toEqual([]);
    expect(c.staleValues).toEqual([]);
  });
});

describe('breakdowns', () => {
  it('groups by brand, by top-level theme (children roll up) and by build state', async () => {
    const cada = await createBrand(w.admin, { name: 'CaDA' });
    const star = await createTheme(w.admin, { name: 'Star Wars' });
    const ucs = await createTheme(w.admin, { name: 'UCS', parentId: star.id });
    const a = await mk({ themeId: ucs.id });
    const b = await mk({ themeId: star.id });
    const c = await mk({ brandId: cada.id });
    await addCopies(w.admin, a.id, {
      buildState: 'built',
      estimatedValueCents: 30_000,
      pricePaidCents: 20_000,
    });
    await addCopies(w.admin, b.id, { buildState: 'sealed', estimatedValueCents: 10_000 });
    await addCopies(w.admin, c.id, { buildState: 'built' });
    const summary = await getCollection(w.admin, NOW);
    expect(summary.byBrand.map((x) => [x.name, x.copies, x.estimatedCents])).toEqual([
      ['LEGO', 2, 40_000],
      ['CaDA', 1, 0],
    ]);
    expect(summary.byTheme.map((x) => [x.name, x.copies, x.estimatedCents, x.paidCents])).toEqual([
      ['Star Wars', 2, 40_000, 20_000],
      ['No theme', 1, 0, 0],
    ]);
    expect(summary.byState).toEqual([
      { state: 'built', copies: 2 },
      { state: 'sealed', copies: 1 },
    ]);
  });

  it('lists sealed sets with how many sealed copies', async () => {
    const a = await mk({ name: 'Polybag' });
    await addCopies(w.admin, a.id, { buildState: 'sealed' }, 3);
    await addCopies(w.admin, a.id, { buildState: 'built' });
    expect((await getCollection(w.admin, NOW)).sealed).toEqual([
      { setId: a.id, name: 'Polybag', copies: 3 },
    ]);
  });
});

describe('stale values', () => {
  it('lists copies with no estimate or one older than a year, never-valued first then oldest', async () => {
    const a = await mk({ name: 'A' });
    await addCopies(w.admin, a.id, { estimatedValueCents: 100, valuedOn: '2026-10-01' }); // fresh
    await addCopies(w.admin, a.id, { estimatedValueCents: 100, valuedOn: '2025-11-16' }); // exactly a year: fresh
    await addCopies(w.admin, a.id, { estimatedValueCents: 100, valuedOn: '2025-11-15' }); // a day over
    await addCopies(w.admin, a.id, { estimatedValueCents: 100, valuedOn: '2023-01-01' }); // old
    await addCopies(w.admin, a.id, {}); // never valued
    const stale = (await getCollection(w.admin, NOW)).staleValues;
    expect(stale.map((s) => s.valuedOn)).toEqual([null, '2023-01-01', '2025-11-15']);
    expect(stale[0]).toMatchObject({ setName: 'A', estimatedCents: null });
  });
});

describe('missing pieces and access', () => {
  it('counts copies with open missing pieces, except sealed ones', async () => {
    await w.db.insert(rbParts).values({ partNum: '3023', name: 'Plate 1 x 2' });
    await w.db.insert(rbColors).values({ id: 4, name: 'Red', rgb: 'C91A09', isTrans: false });
    const a = await mk();
    const [built, sealed] = [
      (await addCopies(w.admin, a.id, { buildState: 'built' }))[0]!,
      (await addCopies(w.admin, a.id, { buildState: 'sealed' }))[0]!,
    ];
    await addMissing(w.admin, built.id, { kind: 'part', partNum: '3023', colorId: 4, quantity: 3 });
    await addMissing(w.admin, sealed.id, {
      kind: 'part',
      partNum: '3023',
      colorId: 4,
      quantity: 9,
    });
    expect((await getCollection(w.admin, NOW)).withMissing).toEqual({ copies: 1, pieces: 3 });
  });

  it('refuses kid profiles and never shows another household’s copies', async () => {
    const a = await mk();
    await addCopies(w.admin, a.id, { estimatedValueCents: 5_000 });
    await expect(getCollection(w.kid, NOW)).rejects.toThrow(/cannot see the collection/);
    expect(await getCollection(w.other, NOW)).toMatchObject({ copies: 0, estimatedCents: 0 });
  });

  it('leaves out copies of sets hidden from kids only for kids (admins still count them)', async () => {
    const a = await mk({ hiddenFromRestricted: true });
    await addCopies(w.admin, a.id, {});
    expect((await getCollection(w.member, NOW)).copies).toBe(1);
  });
});
