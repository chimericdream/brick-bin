import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  UploadError,
  fileSize,
  fileStream,
  parseRange,
  removeStoredFile,
  resolveStored,
  streamPdfToDisk,
} from './files';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'bb-files-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function* chunks(...parts: (string | Buffer)[]) {
  for (const p of parts) yield Buffer.from(p);
}

const opts = (maxBytes = 1000) => ({ dataDir: dir, householdId: 'hh', setId: 'set1', maxBytes });
const folder = () => path.join(dir, 'instructions', 'hh');

describe('streamPdfToDisk', () => {
  it('stores a PDF under its hash, with size and sha256, even when the magic bytes are split across chunks', async () => {
    const body = '%PDF-1.7 hello world';
    const stored = await streamPdfToDisk(chunks('%P', 'DF', '-1.7 ', 'hello world'), opts());
    expect(stored.bytes).toBe(body.length);
    expect(stored.sha256).toBe(createHash('sha256').update(body).digest('hex'));
    expect(stored.relPath).toBe(`instructions/hh/set1-${stored.sha256.slice(0, 16)}.pdf`);
    expect(await readFile(path.join(dir, stored.relPath), 'utf8')).toBe(body);
    expect(await readdir(folder())).toEqual([path.basename(stored.relPath)]); // no .part left
  });

  it('puts identical bytes at the same path', async () => {
    const a = await streamPdfToDisk(chunks('%PDF-same'), opts());
    const b = await streamPdfToDisk(chunks('%PDF-same'), opts());
    expect(b.relPath).toBe(a.relPath);
    expect(await readdir(folder())).toHaveLength(1);
  });

  it('rejects a file that is not a PDF, whatever it is called', async () => {
    await expect(streamPdfToDisk(chunks('GIF89a not a pdf'), opts())).rejects.toMatchObject({
      code: 'not_pdf',
    });
    await expect(streamPdfToDisk(chunks('%PD'), opts())).rejects.toMatchObject({ code: 'not_pdf' });
    expect(await readdir(folder())).toEqual([]);
  });

  it('rejects an empty body', async () => {
    await expect(streamPdfToDisk(chunks(), opts())).rejects.toMatchObject({ code: 'empty' });
    expect(await readdir(folder())).toEqual([]);
  });

  it('stops at the size limit mid-stream and cleans up', async () => {
    const big = chunks('%PDF-', 'x'.repeat(400), 'x'.repeat(400));
    await expect(streamPdfToDisk(big, opts(500))).rejects.toMatchObject({ code: 'too_large' });
    expect(await readdir(folder())).toEqual([]);
    await expect(
      streamPdfToDisk(chunks('%PDF-', 'x'.repeat(10)), opts(500)),
    ).resolves.toBeDefined();
  });

  it('cleans up when the source fails halfway', async () => {
    async function* dropped() {
      yield Buffer.from('%PDF-1.4 start');
      throw new Error('connection reset');
    }
    await expect(streamPdfToDisk(dropped(), opts())).rejects.toThrow(/connection reset/);
    expect(await readdir(folder())).toEqual([]);
  });

  it('reports UploadError instances', async () => {
    const e = await streamPdfToDisk(chunks('nope'), opts()).catch((x) => x);
    expect(e).toBeInstanceOf(UploadError);
  });
});

describe('resolveStored and removeStoredFile', () => {
  it('never resolves a path outside the data directory', () => {
    expect(resolveStored(dir, 'instructions/hh/a.pdf')).toBe(
      path.join(dir, 'instructions', 'hh', 'a.pdf'),
    );
    expect(resolveStored(dir, '../secret')).toBeNull();
    expect(resolveStored(dir, 'a/../../secret')).toBeNull();
    expect(resolveStored(dir, '/etc/passwd')).toBeNull();
    expect(resolveStored(dir, '')).toBeNull();
  });

  it('removes a stored file, and ignores missing and escaping paths', async () => {
    const stored = await streamPdfToDisk(chunks('%PDF-1'), opts());
    await removeStoredFile(dir, stored.relPath);
    expect(await fileSize(path.join(dir, stored.relPath))).toBeNull();
    await removeStoredFile(dir, stored.relPath);
    await removeStoredFile(dir, '../outside');
    await removeStoredFile(dir, null);
  });
});

describe('parseRange', () => {
  it('returns null with no header', () => {
    expect(parseRange(null, 100)).toBeNull();
  });

  it('parses a closed range, an open end and a suffix', () => {
    expect(parseRange('bytes=0-9', 100)).toEqual({ start: 0, end: 9 });
    expect(parseRange('bytes=90-', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=-500', 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange('bytes=50-5000', 100)).toEqual({ start: 50, end: 99 });
  });

  it('rejects ranges that cannot be satisfied or are not understood', () => {
    for (const bad of [
      'bytes=100-',
      'bytes=50-10',
      'bytes=-0',
      'bytes=-',
      'bytes=0-1,5-6',
      'items=0-1',
      'bytes=a-b',
      '',
    ]) {
      expect(parseRange(bad || 'bytes=', 100), bad).toBe('invalid');
    }
  });
});

describe('fileStream', () => {
  it('streams a slice of a file', async () => {
    const stored = await streamPdfToDisk(chunks('%PDF-0123456789'), opts());
    const abs = path.join(dir, stored.relPath);
    const read = async (range?: { start: number; end: number }) => {
      const out: Buffer[] = [];
      for await (const c of fileStream(abs, range) as unknown as AsyncIterable<Uint8Array>)
        out.push(Buffer.from(c));
      return Buffer.concat(out).toString();
    };
    expect(await read()).toBe('%PDF-0123456789');
    expect(await read({ start: 5, end: 8 })).toBe('0123');
    expect(await fileSize(abs)).toBe(15);
  });
});
