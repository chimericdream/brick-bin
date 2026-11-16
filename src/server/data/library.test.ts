import { beforeEach, describe, expect, it } from 'vitest';

import { createBrand } from './brands';
import { addCopies } from './copies';
import { listLibrary } from './library';
import { PAGE_SIZE, parseLibraryFilters, type LibraryFilters } from './library-filters';
import { createLocation } from './places';
import { createSet, type SetInput } from './sets';
import { createTheme } from './themes';
import { createWorld, type TestWorld } from './test-helpers';

let w: TestWorld;
beforeEach(async () => {
  w = await createWorld();
});

const f = (over: Partial<LibraryFilters> = {}, allowValue = true): LibraryFilters => ({
  ...parseLibraryFilters({}, { allowValueSort: allowValue }),
  ...over,
});

let n = 0;
const mk = async (
  over: Partial<SetInput> = {},
  copy: Parameters<typeof addCopies>[2] | null = {},
) => {
  const set = await createSet(w.admin, {
    brandId: w.legoId,
    setNumber: String(100 + n++),
    name: `Set ${n}`,
    ...over,
  });
  if (copy) await addCopies(w.admin, set.id, copy);
  return set;
};
const names = async (filters: Partial<LibraryFilters>, ctx = w.admin) =>
  (await listLibrary(ctx, f(filters))).tiles.map((t) => t.name);

describe('library listing', () => {
  it('lists owned sets by default and unowned ones on request', async () => {
    await mk({ name: 'Owned' });
    await mk({ name: 'Wanted' }, null);
    expect(await names({})).toEqual(['Owned']);
    expect(await names({ includeUnowned: true })).toEqual(['Owned', 'Wanted']);
    expect((await listLibrary(w.admin, f())).facets.unowned).toBe(1);
  });

  it('sorts set numbers naturally, so 75192 follows 7140', async () => {
    for (const num of ['75192', '7140', '10294', 'C61042W', '948']) {
      await mk({ name: `N${num}`, setNumber: num });
    }
    expect(await names({ sort: 'number' })).toEqual([
      'N948',
      'N7140',
      'N10294',
      'N75192',
      'NC61042W',
    ]);
  });

  it('sorts by name, year, pieces and recently added', async () => {
    await mk({ name: 'b', year: 2020, pieceCount: 500 });
    await mk({ name: 'A', year: 2024, pieceCount: 100 });
    await mk({ name: 'c', year: 2022, pieceCount: 900 });
    expect(await names({ sort: 'name' })).toEqual(['A', 'b', 'c']);
    expect(await names({ sort: 'year' })).toEqual(['A', 'c', 'b']);
    expect(await names({ sort: 'pieces' })).toEqual(['c', 'b', 'A']);
    expect((await names({ sort: 'recent' }))[0]).toBe('c');
  });

  it('sorts by estimated value for members', async () => {
    await mk({ name: 'cheap' }, { estimatedValueCents: 1000 });
    await mk({ name: 'dear' }, { estimatedValueCents: 90000 });
    await mk({ name: 'mid' }, { estimatedValueCents: 5000 });
    expect(await names({ sort: 'value' })).toEqual(['dear', 'mid', 'cheap']);
  });

  it('pages 24 at a time and clamps an out-of-range page', async () => {
    for (let i = 0; i < PAGE_SIZE + 5; i++) await mk({ name: `P${String(i).padStart(3, '0')}` });
    const one = await listLibrary(w.admin, f());
    expect(one).toMatchObject({ total: PAGE_SIZE + 5, pages: 2, page: 1 });
    expect(one.tiles).toHaveLength(PAGE_SIZE);
    const two = await listLibrary(w.admin, f({ page: 2 }));
    expect(two.tiles).toHaveLength(5);
    expect((await listLibrary(w.admin, f({ page: 99 }))).page).toBe(2);
  });

  it('lists every copy on the tile, oldest first, with derived completeness', async () => {
    const set = await mk({ name: 'Many' }, null);
    await addCopies(w.admin, set.id, { buildState: 'built', piecesCheckedOn: '2026-03-01' });
    await addCopies(w.admin, set.id, { buildState: 'sealed' }, 4);
    const [tile] = (await listLibrary(w.admin, f())).tiles;
    expect(tile!.copies).toHaveLength(5);
    expect(tile!.copies[0]).toMatchObject({
      buildState: 'built',
      completeness: { kind: 'complete', checkedOn: '2026-03-01' },
    });
    expect(tile!.copies[1]!.completeness).toEqual({ kind: 'sealed' });
  });
});

describe('library filters', () => {
  it('searches name, number, brand, theme and designer', async () => {
    const mouldKing = await createBrand(w.admin, { name: 'Mould King' });
    const tech = await createTheme(w.admin, { name: 'Technic' });
    await mk({ name: 'Crane', setNumber: '42100' });
    await mk({ name: 'Tractor', brandId: mouldKing.id, setNumber: '13124' });
    await mk({ name: 'Rover', themeId: tech.id, setNumber: '1' });
    await mk({ name: 'Lamp', designer: 'Studio Lumen', setNumber: '2' });
    expect(await names({ q: 'crane' })).toEqual(['Crane']);
    expect(await names({ q: '13124' })).toEqual(['Tractor']);
    expect(await names({ q: 'mould' })).toEqual(['Tractor']);
    expect(await names({ q: 'technic' })).toEqual(['Rover']);
    expect(await names({ q: 'lumen' })).toEqual(['Lamp']);
    expect(await names({ q: '100%_' })).toEqual([]);
  });

  it('filters by brand, theme tree, year range, piece band and tag', async () => {
    const cada = await createBrand(w.admin, { name: 'CaDA' });
    const star = await createTheme(w.admin, { name: 'Star Wars' });
    const ucs = await createTheme(w.admin, { name: 'UCS', parentId: star.id });
    await mk({ name: 'A', themeId: ucs.id, year: 2020, pieceCount: 5000, tags: ['gift'] });
    await mk({ name: 'B', brandId: cada.id, year: 2024, pieceCount: 200 });
    await mk({ name: 'C', themeId: star.id, year: 2022, pieceCount: 1500, tags: ['Gift', 'xmas'] });
    expect(await names({ brands: [cada.id] })).toEqual(['B']);
    expect(await names({ themes: [star.id] })).toEqual(['A', 'C']);
    expect(await names({ themes: [ucs.id] })).toEqual(['A']);
    expect(await names({ yearMin: 2021, yearMax: 2023 })).toEqual(['C']);
    expect(await names({ bands: ['3000'] })).toEqual(['A']);
    expect(await names({ bands: ['lt250', '1000'] })).toEqual(['B', 'C']);
    expect(await names({ tags: ['gift'] })).toEqual(['A', 'C']);
    expect(await names({ tags: ['gift'], bands: ['1000'] })).toEqual(['C']);
  });

  it('filters by build state, completeness, owner and place (including sub-places)', async () => {
    const attic = await createLocation(w.admin, 'Attic');
    const shelf = await createLocation(w.admin, 'Shelf', attic.id);
    await mk({ name: 'Sealed' }, { buildState: 'sealed' });
    await mk(
      { name: 'BuiltChecked' },
      { buildState: 'built', piecesCheckedOn: '2026-01-01', locationId: shelf.id },
    );
    await mk(
      { name: 'BuiltUnchecked' },
      { buildState: 'built', ownerUserId: w.member.viewer.userId },
    );
    expect(await names({ states: ['built'] })).toEqual(['BuiltChecked', 'BuiltUnchecked']);
    expect(await names({ completeness: ['complete'] })).toEqual(['BuiltChecked']);
    expect(await names({ completeness: ['not_checked'] })).toEqual(['BuiltUnchecked']);
    expect(await names({ completeness: ['missing'] })).toEqual([]);
    expect(await names({ locations: [attic.id] })).toEqual(['BuiltChecked']);
    expect(await names({ locations: ['none'] })).toEqual(['BuiltUnchecked', 'Sealed']);
    expect(await names({ owners: [w.member.viewer.userId] })).toEqual(['BuiltUnchecked']);
    expect(await names({ owners: ['none'] })).toEqual(['BuiltChecked', 'Sealed']);
    // Conditions apply to the same copy: no built copy is sealed.
    expect(await names({ states: ['built', 'sealed'], completeness: ['complete'] })).toEqual([
      'BuiltChecked',
    ]);
  });
});

describe('facet counts', () => {
  it('count sets under every other active filter, not under their own', async () => {
    const cada = await createBrand(w.admin, { name: 'CaDA' });
    await mk({ name: 'L1' }, { buildState: 'built' });
    await mk({ name: 'L2' }, { buildState: 'sealed' });
    await mk({ name: 'C1', brandId: cada.id }, { buildState: 'built' });

    const all = (await listLibrary(w.admin, f())).facets;
    expect(all.brands).toEqual({ [w.legoId]: 2, [cada.id]: 1 });
    expect(all.states).toEqual({ built: 2, sealed: 1 });

    // Picking "built" narrows brand counts but leaves the build-state counts alone.
    const built = (await listLibrary(w.admin, f({ states: ['built'] }))).facets;
    expect(built.brands).toEqual({ [w.legoId]: 1, [cada.id]: 1 });
    expect(built.states).toEqual({ built: 2, sealed: 1 });

    // Picking a brand narrows the state counts but keeps the other brands selectable.
    const lego = (await listLibrary(w.admin, f({ brands: [w.legoId] }))).facets;
    expect(lego.states).toEqual({ built: 1, sealed: 1 });
    expect(lego.brands).toEqual({ [w.legoId]: 2, [cada.id]: 1 });
  });

  it('roll theme and place counts up their trees, counting a set once', async () => {
    const star = await createTheme(w.admin, { name: 'Star Wars' });
    const ucs = await createTheme(w.admin, { name: 'UCS', parentId: star.id });
    const attic = await createLocation(w.admin, 'Attic');
    const a = await createLocation(w.admin, 'A', attic.id);
    const b = await createLocation(w.admin, 'B', attic.id);
    const set = await mk({ name: 'Two places', themeId: ucs.id }, null);
    await addCopies(w.admin, set.id, { locationId: a.id });
    await addCopies(w.admin, set.id, { locationId: b.id });
    await mk({ name: 'Plain', themeId: star.id }, {});
    const { facets } = await listLibrary(w.admin, f());
    expect(facets.themes).toEqual({ [star.id]: 2, [ucs.id]: 1 });
    expect(facets.locations).toMatchObject({ [attic.id]: 1, [a.id]: 1, [b.id]: 1, none: 1 });
  });

  it('count piece bands, tags, completeness and owners', async () => {
    await mk({ name: 'S', pieceCount: 100, tags: ['x'] }, { buildState: 'sealed' });
    await mk(
      { name: 'B', pieceCount: 3500, tags: ['x', 'y'] },
      { buildState: 'built', ownerUserId: w.member.viewer.userId },
    );
    const { facets } = await listLibrary(w.admin, f());
    expect(facets.bands).toEqual({ lt250: 1, '250': 0, '1000': 0, '3000': 1 });
    expect(facets.tags).toEqual({ x: 2, y: 1 });
    expect(facets.completeness).toEqual({ missing: 0, complete: 0, not_checked: 1 });
    expect(facets.owners).toEqual({ none: 1, [w.member.viewer.userId]: 1 });
  });
});

describe('visibility in the library', () => {
  it('hides hidden sets, and leaks nothing through counts, tags or themes', async () => {
    const secret = await createTheme(w.admin, { name: 'Surprise' });
    const open = await createTheme(w.admin, { name: 'Open' });
    await mk({ name: 'Visible', themeId: open.id, tags: ['shared'] }, { buildState: 'built' });
    await mk(
      {
        name: 'Present',
        themeId: secret.id,
        hiddenFromRestricted: true,
        tags: ['secret'],
        pieceCount: 5000,
      },
      { buildState: 'sealed' },
    );
    const kid = await listLibrary(w.kid, f({}, false));
    expect(kid.tiles.map((t) => t.name)).toEqual(['Visible']);
    expect(kid.total).toBe(1);
    expect(kid.facets.tags).toEqual({ shared: 1 });
    expect(kid.facets.themes[secret.id]).toBeUndefined();
    expect(kid.facets.states).toEqual({ built: 1 });
    expect(kid.facets.bands['3000']).toBe(0);
    // A tile never tells a kid that anything is hidden.
    expect(kid.tiles[0]!.hiddenFromRestricted).toBe(false);

    const admin = await listLibrary(w.admin, f());
    expect(admin.total).toBe(2);
    expect(admin.tiles.find((t) => t.name === 'Present')!.hiddenFromRestricted).toBe(true);
  });

  it('a kid asking for the value sort or a hidden theme filter gets nothing extra', async () => {
    const secret = await createTheme(w.admin, { name: 'Surprise' });
    await mk({ name: 'Present', themeId: secret.id, hiddenFromRestricted: true });
    const parsed = parseLibraryFilters(
      { sort: 'value', theme: secret.id },
      { allowValueSort: false },
    );
    expect(parsed.sort).toBe('name');
    expect((await listLibrary(w.kid, parsed)).tiles).toEqual([]);
  });

  it('never returns another household’s sets', async () => {
    await mk({ name: 'Mine' });
    expect((await listLibrary(w.other, f({ includeUnowned: true }))).tiles).toEqual([]);
  });
});
