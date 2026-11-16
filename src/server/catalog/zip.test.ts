import { mkdtemp, readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rm } from 'node:fs/promises';

import { TINY_PNG, makeZip } from './test-zip';
import { extractLdraw, findEntry, listEntries, listPartImages, openZip } from './zip';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'bb-zip-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const zipAt = async (
  entries: Record<string, Buffer | string>,
  forged: Record<string, string> = {},
) => {
  const file = path.join(dir, 'in.zip');
  await writeFile(file, await makeZip(entries, forged));
  return file;
};

describe('reading a ZIP', () => {
  it('lists entries and streams one by name', async () => {
    const file = await zipAt({ 'a.csv': 'x,y\n1,2\n', 'b.csv': 'z\n' });
    expect(await listEntries(file)).toEqual(['a.csv', 'b.csv']);
    const zip = await openZip(file);
    const found = await findEntry(zip, 'b.csv');
    const chunks: Buffer[] = [];
    for await (const c of found!.stream) chunks.push(c as Buffer);
    expect(Buffer.concat(chunks).toString()).toBe('z\n');
    expect(await findEntry(await openZip(file), 'nope.csv')).toBeNull();
    zip.close();
  });
});

describe('extractLdraw', () => {
  it('writes flat PNGs and returns part numbers', async () => {
    const file = await zipAt({
      '3001.png': TINY_PNG,
      '2454a.png': TINY_PNG,
      '973c02h02.png': TINY_PNG,
    });
    const dest = path.join(dir, 'ldraw', '15');
    await mkdir(path.dirname(dest), { recursive: true });
    const result = await extractLdraw(file, dest);
    expect(result.parts.toSorted()).toEqual(['2454a', '3001', '973c02h02']);
    expect(result.rejected).toEqual([]);
    expect((await readdir(dest)).toSorted()).toEqual(['2454a.png', '3001.png', '973c02h02.png']);
    expect(await listPartImages(dest)).toHaveLength(3);
  });

  it('rejects zip-slip names, folders, non-PNG names, fake PNGs and oversize entries', async () => {
    const file = await zipAt(
      {
        'good.png': TINY_PNG,
        'sub/inner.png': TINY_PNG,
        'notes.txt': 'hello',
        'fake.png': 'this is not an image',
        'big.png': Buffer.concat([TINY_PNG, Buffer.alloc(200)]),
      },
      { '..!evil.png': '../evil.png' },
    );
    const dest = path.join(dir, 'ldraw', '1');
    const result = await extractLdraw(file, dest, { maxEntryBytes: 150 });
    expect(result.parts).toEqual(['good']);
    expect(result.rejected).toHaveLength(4);
    expect(await readdir(dest)).toEqual(['good.png']);
  });

  it('refuses a whole ZIP that holds a path-traversal name, and writes nothing outside the folder', async () => {
    const file = await zipAt(
      { 'good.png': TINY_PNG, '..!evil.png': TINY_PNG },
      { '..!evil.png': '../evil.png' },
    );
    const dest = path.join(dir, 'ldraw', '9');
    await mkdir(path.dirname(dest), { recursive: true });
    await expect(extractLdraw(file, dest)).rejects.toThrow(/invalid relative path/);
    await expect(readFile(path.join(dir, 'evil.png'))).rejects.toThrow();
    await expect(readFile(path.join(dir, 'ldraw', 'evil.png'))).rejects.toThrow();
    expect(await readdir(path.join(dir, 'ldraw'))).toEqual([]); // no temp folder left either
  });

  it('replaces the previous folder, and leaves it alone when the new ZIP is unreadable', async () => {
    const dest = path.join(dir, 'ldraw', '7');
    await extractLdraw(await zipAt({ 'old.png': TINY_PNG }), dest);
    const next = path.join(dir, 'next.zip');
    await writeFile(next, await makeZip({ 'new.png': TINY_PNG }));
    await extractLdraw(next, dest);
    expect(await readdir(dest)).toEqual(['new.png']);

    const broken = path.join(dir, 'broken.zip');
    await writeFile(broken, 'this is not a zip');
    await expect(extractLdraw(broken, dest)).rejects.toThrow();
    expect(await readdir(dest)).toEqual(['new.png']);
    expect((await readdir(path.join(dir, 'ldraw'))).toSorted()).toEqual(['7']); // no temp folders left
  });

  it('refuses a ZIP with too many files', async () => {
    const entries: Record<string, Buffer> = {};
    for (let i = 0; i < 5; i++) entries[`p${i}.png`] = TINY_PNG;
    await expect(
      extractLdraw(await zipAt(entries), path.join(dir, 'ldraw', '2'), { maxEntries: 3 }),
    ).rejects.toThrow(/too many/);
  });
});
