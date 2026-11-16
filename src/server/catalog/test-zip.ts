// Test-only helpers: build ZIPs in memory. Not imported by production code.
import yazl from 'yazl';

/** A valid 1x1 PNG. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Builds a ZIP with the given entries. yazl refuses names like "../x", so to forge one, add the entry
 * under a same-length placeholder and list it in `forged` (placeholder to real name); the bytes of
 * the name are patched in the local header and the central directory.
 */
export async function makeZip(
  entries: Record<string, Buffer | string>,
  forged: Record<string, string> = {},
): Promise<Buffer> {
  const built = await new Promise<Buffer>((resolve, reject) => {
    const zip = new yazl.ZipFile();
    for (const [name, content] of Object.entries(entries)) {
      zip.addBuffer(Buffer.isBuffer(content) ? content : Buffer.from(content), name, {
        forceDosTimestamp: true,
      });
    }
    const chunks: Buffer[] = [];
    zip.outputStream.on('data', (c: Buffer) => chunks.push(c));
    zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)));
    zip.outputStream.on('error', reject);
    zip.end();
  });
  for (const [placeholder, real] of Object.entries(forged)) {
    if (placeholder.length !== real.length) throw new Error('A forged name must keep its length');
    const from = Buffer.from(placeholder);
    const to = Buffer.from(real);
    for (let at = built.indexOf(from); at !== -1; at = built.indexOf(from, at + from.length)) {
      to.copy(built, at);
    }
  }
  return built;
}
