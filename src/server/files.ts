import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/**
 * Large files (instruction PDFs) are streamed to and from disk, never held in memory. Paths stay
 * relative to DATA_DIR in the database and are resolved here, with a check that nothing escapes it.
 */

const PDF_MAGIC = Buffer.from('%PDF-');

export class UploadError extends Error {
  constructor(
    message: string,
    public code: 'too_large' | 'not_pdf' | 'empty',
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

export interface StoredPdf {
  /** Relative to DATA_DIR. */
  relPath: string;
  bytes: number;
  sha256: string;
}

/** The absolute path for a stored relative path, or null if it would leave `dataDir`. */
export function resolveStored(dataDir: string, rel: string): string | null {
  const root = path.resolve(dataDir);
  const abs = path.resolve(root, rel);
  return abs.startsWith(root + path.sep) ? abs : null;
}

/**
 * Streams a PDF to `DATA_DIR/instructions/<household>/<set>-<sha16>.pdf`. The body is checked as it
 * arrives: it must start with `%PDF-` (whatever the content type claims) and stay under `maxBytes`.
 * The SHA-256 is computed on the way, and the file only gets its final name once complete, so a
 * dropped connection never leaves a half-written PDF behind. The same bytes for the same set land on
 * the same path.
 */
export async function streamPdfToDisk(
  source: AsyncIterable<Uint8Array>,
  opts: { dataDir: string; householdId: string; setId: string; maxBytes: number },
): Promise<StoredPdf> {
  const folder = path.join(opts.dataDir, 'instructions', opts.householdId);
  await mkdir(folder, { recursive: true });
  const part = path.join(folder, `${opts.setId}-${randomBytes(8).toString('hex')}.part`);
  const hash = createHash('sha256');
  let bytes = 0;
  let head = Buffer.alloc(0);

  async function* guarded() {
    for await (const chunk of source) {
      const buf = Buffer.from(chunk);
      if (head.length < PDF_MAGIC.length) {
        head = Buffer.concat([head, buf]).subarray(0, PDF_MAGIC.length);
        if (head.length >= PDF_MAGIC.length && !head.equals(PDF_MAGIC)) {
          throw new UploadError('That file is not a PDF.', 'not_pdf');
        }
      }
      bytes += buf.length;
      if (bytes > opts.maxBytes) {
        throw new UploadError(
          `That file is larger than the ${Math.round(opts.maxBytes / 1_048_576)} MB limit.`,
          'too_large',
        );
      }
      hash.update(buf);
      yield buf;
    }
  }

  try {
    await pipeline(guarded, createWriteStream(part));
    if (bytes === 0) throw new UploadError('The file is empty.', 'empty');
    if (!head.equals(PDF_MAGIC)) throw new UploadError('That file is not a PDF.', 'not_pdf');
  } catch (e) {
    await rm(part, { force: true });
    throw e;
  }

  const sha256 = hash.digest('hex');
  const relPath = path.posix.join(
    'instructions',
    opts.householdId,
    `${opts.setId}-${sha256.slice(0, 16)}.pdf`,
  );
  const dest = path.join(opts.dataDir, relPath);
  // The same bytes again: keep the one that is there.
  await rename(part, dest);
  return { relPath, bytes, sha256 };
}

/** Removes a stored file if it is inside `dataDir`. Missing files are fine. */
export async function removeStoredFile(dataDir: string, rel: string | null | undefined) {
  if (!rel) return;
  const abs = resolveStored(dataDir, rel);
  if (abs) await rm(abs, { force: true });
}

export interface ByteRange {
  start: number;
  end: number;
}

/**
 * A single `Range: bytes=a-b` header against a file of `size` bytes. Returns the range to send,
 * `null` for no header (send everything), or `'invalid'` for a range that cannot be satisfied.
 * Suffix ranges (`-500`) and open ends (`500-`) work. Several ranges are not supported.
 */
export function parseRange(header: string | null, size: number): ByteRange | null | 'invalid' {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return 'invalid';
  let start: number;
  let end: number;
  if (m[1] === '') {
    const suffix = Number(m[2]);
    if (suffix === 0) return 'invalid';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (!Number.isSafeInteger(start) || start >= size || start > end) return 'invalid';
  return { start, end };
}

/** A web stream of a file (or a slice of it) for a `Response`. */
export function fileStream(abs: string, range?: ByteRange): ReadableStream<Uint8Array> {
  return Readable.toWeb(createReadStream(abs, range)) as ReadableStream<Uint8Array>;
}

export async function fileSize(abs: string): Promise<number | null> {
  try {
    const s = await stat(abs);
    return s.isFile() ? s.size : null;
  } catch {
    return null;
  }
}
