import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { auditLog, copies, sets } from '../db/schema';
import { historyFor } from './audit';
import { createBrand, deleteBrand, listBrandsWithCounts } from './brands';
import { completenessOf } from './completeness';
import { addCopies, listCopiesForSet, setBuildState, trashCopy, updateCopy } from './copies';
import {
  createLocation,
  deleteLocation,
  listLocationOptions,
  listLocationsWithCounts,
  updateLocation,
} from './places';
import { createSet, DuplicateSetError, getSet, setCoverImage, trashSet, updateSet } from './sets';
import { listTags } from './tags';
import { createTheme, deleteTheme, listThemeOptions, mergeThemes } from './themes';
import { createWorld, type TestWorld } from './test-helpers';

let w: TestWorld;
beforeEach(async () => {
  w = await createWorld();
});

const base = (brandId: string, over: Record<string, unknown> = {}) => ({
  brandId,
  setNumber: '10294',
  name: 'Titanic',
  ...over,
});

describe('first run', () => {
  it('seeds LEGO as the first brand', async () => {
    const list = await listBrandsWithCounts(w.admin);
    expect(list.map((b) => [b.name, b.isLego])).toEqual([['LEGO', true]]);
  });
});

describe('brands', () => {
  it('rejects a duplicate name regardless of case and keeps households apart', async () => {
    await createBrand(w.admin, { name: 'Mould King' });
    await expect(createBrand(w.admin, { name: 'mould king' })).rejects.toThrow(/already exists/);
    await createBrand(w.other, { name: 'Mould King' });
  });

  it('deletes an unused brand but never one with sets', async () => {
    const mk = await createBrand(w.admin, { name: 'CaDA' });
    const set = await createSet(w.admin, base(mk.id));
    expect(await deleteBrand(w.admin, mk.id)).toEqual({ ok: false, reason: 'has_sets', sets: 1 });
    await trashSet(w.admin, set.id);
    // A trashed set still points at the brand.
    expect((await deleteBrand(w.admin, mk.id)).ok).toBe(false);
    const unused = await createBrand(w.admin, { name: 'COBI' });
    expect(await deleteBrand(w.admin, unused.id)).toEqual({ ok: true });
  });

  it('kids cannot add brands', async () => {
    await expect(createBrand(w.kid, { name: 'X' })).rejects.toThrow(/cannot make changes/);
  });
});

describe('sets', () => {
  it('creates a set with tags, audits it and stamps the author', async () => {
    const set = await createSet(
      w.member,
      base(w.legoId, { tags: ['Christmas 2025', 'christmas 2025', 'Display'] }),
    );
    expect(set.createdByUserId).toBe(w.member.viewer.userId);
    const detail = await getSet(w.admin, set.id);
    expect(detail?.tags).toEqual(['Christmas 2025', 'Display']);
    const history = await historyFor(w.admin, 'set', set.id);
    expect(history).toHaveLength(1);
    expect(history[0]!.changes.name).toEqual([null, 'Titanic']);
    expect(history[0]!.changes.tags).toEqual([null, ['Christmas 2025', 'Display']]);
  });

  it('refuses a duplicate brand + number, case-insensitively, but not once the first is trashed', async () => {
    const first = await createSet(w.admin, base(w.legoId, { setNumber: 'C61042w' }));
    await expect(
      createSet(w.admin, base(w.legoId, { setNumber: 'c61042W' })),
    ).rejects.toBeInstanceOf(DuplicateSetError);
    await trashSet(w.admin, first.id);
    await createSet(w.admin, base(w.legoId, { setNumber: 'C61042W' }));
  });

  it('allows unnumbered sets to repeat', async () => {
    await createSet(w.admin, base(w.legoId, { setNumber: '', name: 'Kit A' }));
    await createSet(w.admin, base(w.legoId, { setNumber: null, name: 'Kit B' }));
  });

  it('audits only what changed on update, including tags', async () => {
    const set = await createSet(w.admin, base(w.legoId, { tags: ['a'] }));
    await updateSet(w.admin, set.id, base(w.legoId, { name: 'Titanic II', tags: ['a', 'b'] }));
    await updateSet(w.admin, set.id, base(w.legoId, { name: 'Titanic II', tags: ['a', 'b'] }));
    const history = await historyFor(w.admin, 'set', set.id);
    expect(history).toHaveLength(2);
    expect(history[0]!.changes).toEqual({
      name: ['Titanic', 'Titanic II'],
      tags: [['a'], ['a', 'b']],
    });
  });

  it('rejects a brand or theme from another household', async () => {
    const otherBrand = await createBrand(w.other, { name: 'Elsewhere' });
    await expect(createSet(w.admin, base(otherBrand.id))).rejects.toThrow(/Unknown brand/);
    const otherTheme = await createTheme(w.other, { name: 'Space' });
    await expect(createSet(w.admin, base(w.legoId, { themeId: otherTheme.id }))).rejects.toThrow(
      /Unknown theme/,
    );
  });

  it('is invisible to another household', async () => {
    const set = await createSet(w.admin, base(w.legoId));
    expect(await getSet(w.other, set.id)).toBeNull();
    expect(await getSet(w.admin, 'not-a-uuid')).toBeNull();
  });

  it('records cover changes and returns the old path', async () => {
    const set = await createSet(w.admin, base(w.legoId));
    expect(await setCoverImage(w.admin, set.id, 'covers/a.png')).toBeNull();
    expect(await setCoverImage(w.admin, set.id, 'covers/b.png')).toBe('covers/a.png');
  });

  it('refuses to trash a set that has live copies', async () => {
    const set = await createSet(w.admin, base(w.legoId));
    const [copy] = await addCopies(w.admin, set.id, {});
    expect(await trashSet(w.admin, set.id)).toEqual({ ok: false, reason: 'has_copies', copies: 1 });
    await trashCopy(w.admin, copy!.id);
    expect(await trashSet(w.admin, set.id)).toEqual({ ok: true });
    expect(await getSet(w.admin, set.id)).toBeNull();
  });
});

describe('themes', () => {
  it('builds path labels and merges one theme into another', async () => {
    const sw = await createTheme(w.admin, { name: 'Star Wars' });
    const ucs = await createTheme(w.admin, { name: 'Ultimate Collector Series', parentId: sw.id });
    const dupe = await createTheme(w.admin, { name: 'Star wars (dup)' });
    expect((await listThemeOptions(w.admin)).map((o) => o.label)).toEqual([
      'Star Wars',
      'Star Wars › Ultimate Collector Series',
      'Star wars (dup)',
    ]);
    const set = await createSet(w.admin, base(w.legoId, { themeId: dupe.id }));
    await mergeThemes(w.admin, dupe.id, sw.id);
    expect((await getSet(w.admin, set.id))?.themePath.map((t) => t.name)).toEqual(['Star Wars']);
    expect(await deleteTheme(w.admin, sw.id)).toMatchObject({ ok: false, reason: 'in_use' });
    expect(await deleteTheme(w.admin, ucs.id)).toEqual({ ok: true });
  });

  it('refuses to put a theme inside its own child', async () => {
    const a = await createTheme(w.admin, { name: 'A' });
    const b = await createTheme(w.admin, { name: 'B', parentId: a.id });
    await expect(mergeThemes(w.admin, a.id, b.id)).rejects.toThrow(/inside itself/);
  });
});

describe('copies', () => {
  it('creates several identical copies in one go, each audited', async () => {
    const set = await createSet(w.admin, base(w.legoId));
    const made = await addCopies(w.admin, set.id, { buildState: 'sealed' }, 5);
    expect(made).toHaveLength(5);
    const rows = await w.db.select().from(copies).where(eq(copies.setId, set.id));
    expect(rows).toHaveLength(5);
    const audits = await w.db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'copy'), eq(auditLog.action, 'create')));
    expect(audits).toHaveLength(5);
    await expect(addCopies(w.admin, set.id, {}, 0)).rejects.toThrow();
    await expect(addCopies(w.admin, set.id, {}, 51)).rejects.toThrow();
  });

  it('audits each build state change and skips no-ops', async () => {
    const set = await createSet(w.admin, base(w.legoId));
    const [copy] = await addCopies(w.admin, set.id, {});
    await setBuildState(w.member, copy!.id, 'in_progress');
    await setBuildState(w.member, copy!.id, 'in_progress');
    await setBuildState(w.member, copy!.id, 'built');
    const history = await historyFor(w.admin, 'copy', copy!.id);
    expect(history.map((h) => h.changes.buildState)).toEqual([
      ['in_progress', 'built'],
      ['sealed', 'in_progress'],
      [null, 'sealed'],
    ]);
  });

  it('rejects a place or owner from another household', async () => {
    const set = await createSet(w.admin, base(w.legoId));
    const foreign = await createLocation(w.other, 'Garage');
    await expect(addCopies(w.admin, set.id, { locationId: foreign.id })).rejects.toThrow(
      /Unknown place/,
    );
    await expect(
      addCopies(w.admin, set.id, { ownerUserId: w.other.viewer.userId }),
    ).rejects.toThrow(/Unknown owner/);
  });

  it('derives completeness and lists copies with owner and place path', async () => {
    const set = await createSet(w.admin, base(w.legoId));
    const attic = await createLocation(w.admin, 'Attic');
    const shelf = await createLocation(w.admin, 'Shelf 1', attic.id);
    const [a, b] = await addCopies(
      w.admin,
      set.id,
      { buildState: 'built', locationId: shelf.id, ownerUserId: w.member.viewer.userId },
      2,
    );
    await updateCopy(w.admin, b!.id, { buildState: 'built', piecesCheckedOn: '2026-03-14' });
    const cards = await listCopiesForSet(w.admin, set.id);
    expect(cards.map((c) => c.copy.id)).toEqual([a!.id, b!.id]);
    expect(cards[0]!.locationPath).toBe('Attic › Shelf 1');
    expect(cards[0]!.ownerName).toBe('Mia');
    expect(cards[0]!.completeness).toEqual({ kind: 'not_checked' });
    expect(cards[1]!.completeness).toEqual({ kind: 'complete', checkedOn: '2026-03-14' });
  });

  it('completenessOf follows the plan', () => {
    const c = { piecesCheckedOn: null as string | null, missingPieces: 0 };
    expect(completenessOf({ ...c, buildState: 'sealed', missingPieces: 3 })).toEqual({
      kind: 'sealed',
    });
    expect(completenessOf({ ...c, buildState: 'built', missingPieces: 4 })).toEqual({
      kind: 'missing',
      pieces: 4,
    });
    expect(completenessOf({ ...c, buildState: 'opened' })).toEqual({ kind: 'not_checked' });
  });
});

describe('places', () => {
  it('guards deletes and loops, and counts copies up the tree', async () => {
    const set = await createSet(w.admin, base(w.legoId));
    const attic = await createLocation(w.admin, 'Attic');
    const shelf = await createLocation(w.admin, 'Shelf 1', attic.id);
    await addCopies(w.admin, set.id, { locationId: shelf.id }, 2);
    const counts = await listLocationsWithCounts(w.admin);
    expect(counts.map((c) => [c.name, c.copies, c.total])).toEqual([
      ['Attic', 0, 2],
      ['Shelf 1', 2, 2],
    ]);
    expect(await deleteLocation(w.admin, attic.id)).toMatchObject({ reason: 'has_children' });
    expect(await deleteLocation(w.admin, shelf.id)).toMatchObject({ reason: 'has_copies' });
    await expect(
      updateLocation(w.admin, attic.id, { name: 'Attic', parentId: shelf.id }),
    ).rejects.toThrow(/sub-places/);
    const empty = await createLocation(w.admin, 'Garage');
    expect(await deleteLocation(w.admin, empty.id)).toEqual({ ok: true });
    expect((await listLocationOptions(w.admin)).map((o) => o.label)).toEqual([
      'Attic',
      'Attic › Shelf 1',
    ]);
  });
});

describe('restricted viewers', () => {
  it('cannot see sets hidden from them, in lookups, counts or tags', async () => {
    const shown = await createSet(
      w.admin,
      base(w.legoId, { name: 'Shown', setNumber: '1', tags: ['open'] }),
    );
    const hidden = await createSet(
      w.admin,
      base(w.legoId, {
        name: 'Present',
        setNumber: '2',
        hiddenFromRestricted: true,
        tags: ['secret'],
      }),
    );
    const room = await createLocation(w.admin, 'Closet');
    await addCopies(w.admin, hidden.id, { locationId: room.id });
    await addCopies(w.admin, shown.id, {});

    expect(await getSet(w.kid, shown.id)).not.toBeNull();
    expect(await getSet(w.kid, hidden.id)).toBeNull();
    expect(await listCopiesForSet(w.kid, hidden.id)).toEqual([]);
    expect((await listTags(w.kid)).map((t) => t.name)).toEqual(['open']);
    expect((await listTags(w.admin)).map((t) => t.name)).toEqual(['open', 'secret']);
    expect((await listLocationsWithCounts(w.kid)).find((l) => l.name === 'Closet')?.total).toBe(0);
    expect((await listLocationsWithCounts(w.admin)).find((l) => l.name === 'Closet')?.total).toBe(
      1,
    );
    // The admin cannot delete the closet even though a kid sees it as empty.
    expect(await deleteLocation(w.admin, room.id)).toMatchObject({ reason: 'has_copies' });
  });

  it('never receives money fields, and cannot write', async () => {
    const set = await createSet(w.admin, base(w.legoId, { retailPriceCents: 14999 }));
    const [copy] = await addCopies(w.admin, set.id, {
      pricePaidCents: 9999,
      valuedOn: '2026-01-02',
    });
    expect((await getSet(w.admin, set.id))?.set.retailPriceCents).toBe(14999);
    expect((await getSet(w.kid, set.id))?.set.retailPriceCents).toBeNull();
    const [card] = await listCopiesForSet(w.kid, set.id);
    expect(card!.copy).toMatchObject({
      pricePaidCents: null,
      estimatedValueCents: null,
      valuedOn: null,
    });
    expect((await listCopiesForSet(w.admin, set.id))[0]!.copy.pricePaidCents).toBe(9999);

    await expect(createSet(w.kid, base(w.legoId, { setNumber: '9' }))).rejects.toThrow(
      /cannot make changes/,
    );
    await expect(setBuildState(w.kid, copy!.id, 'built')).rejects.toThrow(/cannot make changes/);
    await expect(trashCopy(w.kid, copy!.id)).rejects.toThrow(/cannot make changes/);
    await expect(trashSet(w.kid, set.id)).rejects.toThrow(/cannot make changes/);
    await expect(createLocation(w.kid, 'X')).rejects.toThrow(/cannot make changes/);
  });
});

describe('household isolation', () => {
  it('another household cannot touch copies or sets by id', async () => {
    const set = await createSet(w.admin, base(w.legoId));
    const [copy] = await addCopies(w.admin, set.id, {});
    await expect(setBuildState(w.other, copy!.id, 'built')).rejects.toThrow(/not found/);
    expect(await trashCopy(w.other, copy!.id)).toBe(false);
    await expect(updateSet(w.other, set.id, base(w.legoId))).rejects.toThrow();
    const [row] = await w.db.select().from(sets).where(eq(sets.id, set.id));
    expect(row!.deletedAt).toBeNull();
  });
});
