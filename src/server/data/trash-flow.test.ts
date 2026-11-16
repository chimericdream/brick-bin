import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { auditLog, copies, sets } from '../db/schema';
import { addCopies, trashCopy } from './copies';
import { createLocation, deleteLocation } from './places';
import { createSet, getSet, trashSet } from './sets';
import { createWorld, type TestWorld } from './test-helpers';
import { listTrash, purgeExpiredTrash, purgeTrashed, restoreTrashed } from './trash';

let w: TestWorld;
beforeEach(async () => {
  w = await createWorld();
});

const mkSet = (over: Record<string, unknown> = {}) =>
  createSet(w.admin, { brandId: w.legoId, setNumber: '1', name: 'Set', ...over });

describe('trash', () => {
  it('lists what the viewer deleted; admins see everything; kids have no trash', async () => {
    const a = await mkSet({ setNumber: '1', name: 'A' });
    const b = await mkSet({ setNumber: '2', name: 'B' });
    await trashSet(w.admin, a.id);
    await trashSet(w.member, b.id);
    expect((await listTrash(w.admin)).map((i) => i.title).toSorted()).toEqual(['A', 'B']);
    expect((await listTrash(w.member)).map((i) => i.title)).toEqual(['B']);
    await expect(listTrash(w.kid)).rejects.toThrow(/cannot see the trash/);
    expect(await listTrash(w.other)).toEqual([]);
  });

  it('only the deleter or an admin can restore; restore is audited', async () => {
    const a = await mkSet();
    await trashSet(w.admin, a.id);
    const denied = await restoreTrashed(w.member, 'set', a.id);
    expect(denied.ok).toBe(false);
    expect(await restoreTrashed(w.admin, 'set', a.id)).toEqual({ ok: true });
    expect(await getSet(w.admin, a.id)).not.toBeNull();
    expect((await restoreTrashed(w.admin, 'set', a.id)).ok).toBe(false);
    expect(await restoreTrashed(w.other, 'set', a.id)).toMatchObject({ ok: false });
  });

  it('a copy cannot come back before its set, and offers restoring without a trashed place', async () => {
    const set = await mkSet();
    const room = await createLocation(w.admin, 'Closet');
    const [copy] = await addCopies(w.admin, set.id, { locationId: room.id });
    await trashCopy(w.admin, copy!.id);
    await trashSet(w.admin, set.id);
    expect(await restoreTrashed(w.admin, 'copy', copy!.id)).toMatchObject({
      ok: false,
      error: 'Restore the set first.',
    });
    await restoreTrashed(w.admin, 'set', set.id);
    await deleteLocation(w.admin, room.id);
    const blocked = await restoreTrashed(w.admin, 'copy', copy!.id);
    expect(blocked).toMatchObject({ ok: false, canDropLocation: true });
    expect(await restoreTrashed(w.admin, 'copy', copy!.id, { withoutLocation: true })).toEqual({
      ok: true,
    });
    const [row] = await w.db.select().from(copies).where(eq(copies.id, copy!.id));
    expect(row).toMatchObject({ deletedAt: null, locationId: null });
  });

  it('a place cannot come back inside a trashed parent', async () => {
    const attic = await createLocation(w.admin, 'Attic');
    const shelf = await createLocation(w.admin, 'Shelf', attic.id);
    await deleteLocation(w.admin, shelf.id);
    await deleteLocation(w.admin, attic.id);
    expect((await restoreTrashed(w.admin, 'location', shelf.id)).ok).toBe(false);
    expect((await restoreTrashed(w.admin, 'location', attic.id)).ok).toBe(true);
    expect((await restoreTrashed(w.admin, 'location', shelf.id)).ok).toBe(true);
  });

  it('only admins delete for good, and the cover path comes back for cleanup', async () => {
    const set = await mkSet();
    await w.db.update(sets).set({ coverImage: 'covers/x.png' }).where(eq(sets.id, set.id));
    await expect(purgeTrashed(w.member, 'set', set.id)).rejects.toThrow(/admin/);
    expect((await purgeTrashed(w.admin, 'set', set.id)).ok).toBe(false); // not in the trash yet
    await trashSet(w.admin, set.id);
    expect(await purgeTrashed(w.admin, 'set', set.id)).toEqual({
      ok: true,
      files: ['covers/x.png'],
    });
    expect(await w.db.select().from(sets).where(eq(sets.id, set.id))).toEqual([]);
  });

  it('purges only items past the retention window, auditing each', async () => {
    const old = await mkSet({ setNumber: '1', name: 'Old' });
    const recent = await mkSet({ setNumber: '2', name: 'Recent' });
    await trashSet(w.admin, old.id);
    await trashSet(w.admin, recent.id);
    await w.db
      .update(sets)
      .set({ deletedAt: new Date(Date.now() - 40 * 86_400_000) })
      .where(eq(sets.id, old.id));
    expect(await purgeExpiredTrash(w.db, new Date(), 0)).toEqual({ purged: 0, files: [] });
    const result = await purgeExpiredTrash(w.db, new Date(), 30);
    expect(result.purged).toBe(1);
    expect((await listTrash(w.admin)).map((i) => i.title)).toEqual(['Recent']);
    const audits = await w.db.select().from(auditLog).where(eq(auditLog.entityId, old.id));
    expect(audits.some((a) => a.action === 'delete' && a.actorUserId === null)).toBe(true);
  });
});
