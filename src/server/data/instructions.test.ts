import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { setInstructions, sets } from '../db/schema';
import type { StoredPdf } from '../files';
import { historyFor } from './audit';
import {
  DuplicateInstructionError,
  addFileInstruction,
  addLinkInstruction,
  getInstruction,
  instructionCounts,
  listInstructions,
  moveInstruction,
  renameInstruction,
  trashInstruction,
} from './instructions';
import { createSet, trashSet } from './sets';
import { createWorld, type TestWorld } from './test-helpers';
import { listTrash, purgeExpiredTrash, purgeTrashed, restoreTrashed } from './trash';

let w: TestWorld;
beforeEach(async () => {
  w = await createWorld();
});

const mkSet = (over: Record<string, unknown> = {}) =>
  createSet(w.admin, {
    brandId: w.legoId,
    setNumber: String(Math.random()).slice(2, 8),
    name: 'Set',
    ...over,
  });

let n = 0;
const pdf = (sha = `sha${n++}`.padEnd(64, '0'), setId = 'x'): StoredPdf => ({
  relPath: `instructions/hh/${setId}-${sha.slice(0, 16)}.pdf`,
  bytes: 1234,
  sha256: sha,
});

describe('adding and listing', () => {
  it('stores a file instruction, audits it, and lists in the order added', async () => {
    const set = await mkSet();
    const a = await addFileInstruction(w.member, set.id, {
      label: 'Book 1',
      stored: pdf('a'.repeat(64), set.id),
      sourceUrl: 'https://maker.example/b1.pdf',
    });
    await addLinkInstruction(w.member, set.id, {
      label: 'Maker page',
      url: 'https://maker.example/set',
    });
    const b = await addFileInstruction(w.member, set.id, {
      label: 'Book 2',
      stored: pdf('b'.repeat(64), set.id),
    });
    expect((await listInstructions(w.admin, set.id)).map((i) => i.label)).toEqual([
      'Book 1',
      'Maker page',
      'Book 2',
    ]);
    expect(a).toMatchObject({
      kind: 'file',
      fileBytes: 1234,
      sourceUrl: 'https://maker.example/b1.pdf',
      createdByUserId: w.member.viewer.userId,
    });
    expect(b.sortOrder).toBe(2);
    const history = await historyFor(w.admin, 'instruction', a.id);
    expect(history[0]!.changes.label).toEqual([null, 'Book 1']);
  });

  it('refuses the same PDF twice for one set, but allows it again after the first is trashed', async () => {
    const set = await mkSet();
    const sha = 'c'.repeat(64);
    const first = await addFileInstruction(w.admin, set.id, {
      label: 'Book',
      stored: pdf(sha, set.id),
    });
    await expect(
      addFileInstruction(w.admin, set.id, { label: 'Again', stored: pdf(sha, set.id) }),
    ).rejects.toBeInstanceOf(DuplicateInstructionError);
    await trashInstruction(w.admin, first.id);
    await addFileInstruction(w.admin, set.id, { label: 'Again', stored: pdf(sha, set.id) });
    // The same bytes for a different set are fine.
    const other = await mkSet({ name: 'Other' });
    await addFileInstruction(w.admin, other.id, { label: 'Book', stored: pdf(sha, other.id) });
  });

  it('only accepts http(s) links and a label', async () => {
    const set = await mkSet();
    for (const url of [
      'javascript:alert(1)',
      'ftp://x.example/a',
      'not a url',
      'data:text/html,hi',
      '',
    ]) {
      await expect(addLinkInstruction(w.admin, set.id, { label: 'x', url })).rejects.toThrow();
    }
    await expect(
      addLinkInstruction(w.admin, set.id, { label: '  ', url: 'https://x.example' }),
    ).rejects.toThrow();
    await addLinkInstruction(w.admin, set.id, { label: 'ok', url: 'http://x.example/a' });
  });

  it('kids cannot add, rename, move or remove', async () => {
    const set = await mkSet();
    const ins = await addLinkInstruction(w.admin, set.id, { label: 'L', url: 'https://x.example' });
    await expect(
      addLinkInstruction(w.kid, set.id, { label: 'x', url: 'https://x.example' }),
    ).rejects.toThrow(/cannot make changes/);
    await expect(addFileInstruction(w.kid, set.id, { label: 'x', stored: pdf() })).rejects.toThrow(
      /cannot make changes/,
    );
    await expect(renameInstruction(w.kid, ins.id, 'y')).rejects.toThrow(/cannot make changes/);
    await expect(moveInstruction(w.kid, ins.id, 'up')).rejects.toThrow(/cannot make changes/);
    await expect(trashInstruction(w.kid, ins.id)).rejects.toThrow(/cannot make changes/);
  });
});

describe('visibility', () => {
  it('kids open instructions of sets they can see, and never of hidden or foreign sets', async () => {
    const shown = await mkSet({ name: 'Shown' });
    const hidden = await mkSet({ name: 'Present', hiddenFromRestricted: true });
    const a = await addLinkInstruction(w.admin, shown.id, { label: 'A', url: 'https://x.example' });
    const b = await addLinkInstruction(w.admin, hidden.id, {
      label: 'B',
      url: 'https://x.example',
    });
    expect((await getInstruction(w.kid, a.id))?.id).toBe(a.id);
    expect(await getInstruction(w.kid, b.id)).toBeNull();
    expect(await listInstructions(w.kid, hidden.id)).toEqual([]);
    expect(await getInstruction(w.other, a.id)).toBeNull();
    expect(await getInstruction(w.admin, 'not-a-uuid')).toBeNull();
  });

  it('hides a trashed set’s instructions, and they come back with it', async () => {
    const set = await mkSet();
    const ins = await addLinkInstruction(w.admin, set.id, { label: 'A', url: 'https://x.example' });
    await trashSet(w.admin, set.id);
    expect(await getInstruction(w.admin, ins.id)).toBeNull();
    expect(await listInstructions(w.admin, set.id)).toEqual([]);
    await restoreTrashed(w.admin, 'set', set.id);
    expect((await getInstruction(w.admin, ins.id))?.label).toBe('A');
  });

  it('counts only live instructions of the sets asked about', async () => {
    const a = await mkSet({ name: 'A' });
    const b = await mkSet({ name: 'B' });
    await addLinkInstruction(w.admin, a.id, { label: '1', url: 'https://x.example' });
    const two = await addLinkInstruction(w.admin, a.id, { label: '2', url: 'https://x.example' });
    await trashInstruction(w.admin, two.id);
    const counts = await instructionCounts(w.admin, [a.id, b.id]);
    expect(counts.get(a.id)).toBe(1);
    expect(counts.get(b.id)).toBeUndefined();
  });
});

describe('editing', () => {
  it('renames (audited, no-op skipped) and moves up and down', async () => {
    const set = await mkSet();
    const a = await addLinkInstruction(w.admin, set.id, { label: 'A', url: 'https://x.example' });
    const b = await addLinkInstruction(w.admin, set.id, { label: 'B', url: 'https://x.example' });
    const c = await addLinkInstruction(w.admin, set.id, { label: 'C', url: 'https://x.example' });
    await renameInstruction(w.admin, a.id, 'Alpha');
    await renameInstruction(w.admin, a.id, 'Alpha');
    expect(
      (await historyFor(w.admin, 'instruction', a.id)).filter(
        (h) => h.changes.label && h.action === 'update',
      ),
    ).toHaveLength(1);

    await moveInstruction(w.admin, c.id, 'up');
    expect((await listInstructions(w.admin, set.id)).map((i) => i.label)).toEqual([
      'Alpha',
      'C',
      'B',
    ]);
    await moveInstruction(w.admin, c.id, 'up');
    await moveInstruction(w.admin, c.id, 'up'); // already first: nothing happens
    expect((await listInstructions(w.admin, set.id)).map((i) => i.label)).toEqual([
      'C',
      'Alpha',
      'B',
    ]);
    await moveInstruction(w.admin, b.id, 'down'); // already last
    expect((await listInstructions(w.admin, set.id)).map((i) => i.label)).toEqual([
      'C',
      'Alpha',
      'B',
    ]);
  });
});

describe('trash and files', () => {
  it('lists a trashed instruction, restores it, and refuses to restore under a trashed set', async () => {
    const set = await mkSet({ name: 'Booked' });
    const ins = await addLinkInstruction(w.admin, set.id, {
      label: 'Book',
      url: 'https://x.example',
    });
    await trashInstruction(w.admin, ins.id);
    const item = (await listTrash(w.admin)).find((t) => t.kind === 'instruction')!;
    expect(item).toMatchObject({ title: 'Book', detail: 'Instructions · Booked' });
    await w.db.update(sets).set({ deletedAt: new Date() }).where(eq(sets.id, set.id));
    expect(await restoreTrashed(w.admin, 'instruction', ins.id)).toMatchObject({
      ok: false,
      error: 'Restore the set first.',
    });
    await w.db.update(sets).set({ deletedAt: null }).where(eq(sets.id, set.id));
    expect(await restoreTrashed(w.admin, 'instruction', ins.id)).toEqual({ ok: true });
  });

  it('will not restore a PDF while the same bytes are live for the set', async () => {
    const set = await mkSet();
    const sha = 'd'.repeat(64);
    const first = await addFileInstruction(w.admin, set.id, {
      label: 'One',
      stored: pdf(sha, set.id),
    });
    await trashInstruction(w.admin, first.id);
    await addFileInstruction(w.admin, set.id, { label: 'Two', stored: pdf(sha, set.id) });
    const r = await restoreTrashed(w.admin, 'instruction', first.id);
    expect(r).toMatchObject({ ok: false });
    expect((r as { error: string }).error).toContain('already stored');
  });

  it('returns a PDF for deletion only when no other row uses it', async () => {
    const set = await mkSet();
    const sha = 'e'.repeat(64);
    const stored = pdf(sha, set.id);
    const first = await addFileInstruction(w.admin, set.id, { label: 'One', stored });
    await trashInstruction(w.admin, first.id);
    const second = await addFileInstruction(w.admin, set.id, { label: 'Two', stored }); // same bytes, same path
    // The live copy still needs the file.
    expect(await purgeTrashed(w.admin, 'instruction', first.id)).toEqual({ ok: true, files: [] });
    await trashInstruction(w.admin, second.id);
    expect(await purgeTrashed(w.admin, 'instruction', second.id)).toEqual({
      ok: true,
      files: [stored.relPath],
    });
  });

  it('deleting a set for good returns every file it held, and its rows go with it', async () => {
    const set = await mkSet();
    const a = pdf('f'.repeat(64), set.id);
    const b = pdf('1'.repeat(64), set.id);
    await addFileInstruction(w.admin, set.id, { label: 'A', stored: a });
    await addFileInstruction(w.admin, set.id, { label: 'B', stored: b });
    await addLinkInstruction(w.admin, set.id, { label: 'Link', url: 'https://x.example' });
    await trashSet(w.admin, set.id);
    const result = await purgeTrashed(w.admin, 'set', set.id);
    expect(result.ok && result.files.toSorted()).toEqual([a.relPath, b.relPath].toSorted());
    expect(await w.db.select().from(setInstructions)).toEqual([]);
  });

  it('the expiry purge returns files of expired sets and expired instructions', async () => {
    const dying = await mkSet({ name: 'Dying' });
    const living = await mkSet({ name: 'Living' });
    const a = pdf('2'.repeat(64), dying.id);
    const b = pdf('3'.repeat(64), living.id);
    await addFileInstruction(w.admin, dying.id, { label: 'A', stored: a });
    const kept = await addFileInstruction(w.admin, living.id, { label: 'B', stored: b });
    await trashSet(w.admin, dying.id);
    await trashInstruction(w.admin, kept.id);
    const old = new Date(Date.now() - 40 * 86_400_000);
    await w.db.update(sets).set({ deletedAt: old }).where(eq(sets.id, dying.id));
    await w.db
      .update(setInstructions)
      .set({ deletedAt: old })
      .where(eq(setInstructions.id, kept.id));
    const result = await purgeExpiredTrash(w.db, new Date(), 30);
    expect(result.purged).toBe(2);
    expect(result.files.toSorted()).toEqual([a.relPath, b.relPath].toSorted());
  });
});
