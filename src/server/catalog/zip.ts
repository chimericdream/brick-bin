import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import yauzl from 'yauzl';

export interface ZipFile {
  entries: () => AsyncGenerator<{ name: string; size: number; open: () => Promise<Readable> }>;
  close: () => void;
}

/** Opens a ZIP on disk for streaming reads. Entries are read one at a time and never held in memory. */
export function openZip(file: string): Promise<ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(file, { lazyEntries: true, autoClose: false }, (err, zip) => {
      if (err || !zip) return reject(err ?? new Error('Could not open the ZIP'));
      resolve({
        close: () => zip.close(),
        async *entries() {
          const queue: yauzl.Entry[] = [];
          let done = false;
          let failure: Error | null = null;
          let wake: (() => void) | null = null;
          zip.on('entry', (e: yauzl.Entry) => {
            queue.push(e);
            wake?.();
          });
          zip.on('end', () => {
            done = true;
            wake?.();
          });
          zip.on('error', (e: Error) => {
            failure = e;
            wake?.();
          });
          zip.readEntry();
          for (;;) {
            if (failure) throw failure;
            const entry = queue.shift();
            if (!entry) {
              if (done) return;
              await new Promise<void>((r) => (wake = r));
              wake = null;
              continue;
            }
            yield {
              name: entry.fileName,
              size: entry.uncompressedSize,
              open: () =>
                new Promise<Readable>((res, rej) =>
                  zip.openReadStream(entry, (e, stream) => (e || !stream ? rej(e) : res(stream))),
                ),
            };
            zip.readEntry();
          }
        },
      });
    });
  });
}

/** The stream of one named file inside a ZIP, or null if it is not there. The ZIP stays open until `close`. */
export async function findEntry(
  zip: ZipFile,
  name: string,
): Promise<{ stream: Readable; size: number } | null> {
  for await (const e of zip.entries()) {
    if (e.name === name) return { stream: await e.open(), size: e.size };
  }
  return null;
}

/** Names of every file in a ZIP (directories included), for checking an archive before loading it. */
export async function listEntries(file: string): Promise<string[]> {
  const zip = await openZip(file);
  try {
    const names: string[] = [];
    for await (const e of zip.entries()) names.push(e.name);
    return names;
  } finally {
    zip.close();
  }
}

// PNG signature
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Part numbers are letters, digits and a few separators; never a path. */
const SAFE_PNG = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.png$/;

export interface ExtractResult {
  /** Part numbers (file names without `.png`) written. */
  parts: string[];
  /** Entries skipped, with the reason, for the run summary. */
  rejected: string[];
}

export interface ExtractOptions {
  maxEntryBytes?: number;
  maxEntries?: number;
}

/**
 * Extracts an LDraw ZIP into `destDir` (replacing it): flat `<part_num>.png` entries only. Anything
 * else is rejected, never written: names with a slash or `..` (zip-slip), non-PNG names, files over
 * the size cap, and entries that do not start with the PNG signature. The folder is built beside the
 * destination and swapped in, so a failed extraction leaves the old images alone.
 */
export async function extractLdraw(
  zipFile: string,
  destDir: string,
  opts: ExtractOptions = {},
): Promise<ExtractResult> {
  const maxEntry = opts.maxEntryBytes ?? 5 * 1024 * 1024;
  const maxEntries = opts.maxEntries ?? 100_000;
  const tmp = `${destDir}.tmp-${process.pid}`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });

  const parts: string[] = [];
  const rejected: string[] = [];
  let zip: ZipFile | null = null;
  try {
    zip = await openZip(zipFile);
    let seen = 0;
    for await (const e of zip.entries()) {
      if (e.name.endsWith('/')) continue; // a directory entry
      if (++seen > maxEntries) throw new Error('The ZIP holds too many files');
      if (
        e.name.includes('/') ||
        e.name.includes('\\') ||
        e.name.includes('..') ||
        !SAFE_PNG.test(e.name)
      ) {
        rejected.push(`${e.name.slice(0, 80)}: not a flat PNG file name`);
        continue;
      }
      if (e.size > maxEntry) {
        rejected.push(`${e.name}: larger than ${maxEntry} bytes`);
        continue;
      }
      const stream = await e.open();
      const out = path.join(tmp, e.name);
      // Check the signature on the first bytes, then write everything through.
      let head = Buffer.alloc(0);
      let bad = false;
      let written = 0;
      const guarded = async function* () {
        for await (const chunk of stream as AsyncIterable<Buffer>) {
          if (head.length < PNG.length) {
            head = Buffer.concat([head, chunk]);
            if (head.length >= PNG.length && !head.subarray(0, PNG.length).equals(PNG)) {
              bad = true;
              return;
            }
          }
          written += chunk.length;
          if (written > maxEntry) {
            bad = true;
            return;
          }
          yield chunk;
        }
      };
      await pipeline(guarded, createWriteStream(out));
      if (bad || head.length < PNG.length) {
        await rm(out, { force: true });
        rejected.push(`${e.name}: not a PNG image`);
        continue;
      }
      parts.push(e.name.slice(0, -'.png'.length));
    }
  } catch (e) {
    await rm(tmp, { recursive: true, force: true });
    throw e;
  } finally {
    zip?.close();
  }

  // Swap the finished folder in. The old folder is renamed aside first so a crash cannot leave none.
  const old = `${destDir}.old-${process.pid}`;
  await rm(old, { recursive: true, force: true });
  await rename(destDir, old).catch(() => undefined);
  try {
    await rename(tmp, destDir);
  } catch (e) {
    await rename(old, destDir).catch(() => undefined);
    throw e;
  }
  await rm(old, { recursive: true, force: true });
  return { parts, rejected };
}

/** Lists the part numbers that have an image in one colour folder. */
export async function listPartImages(colorDir: string): Promise<string[]> {
  try {
    return (await readdir(colorDir)).filter((n) => n.endsWith('.png')).map((n) => n.slice(0, -4));
  } catch {
    return [];
  }
}
