import { Readable } from 'node:stream';

import { getApiContext } from '@/server/auth/current';
import { DuplicateInstructionError, addFileInstruction } from '@/server/data/instructions';
import { isUuid } from '@/server/data/ids';
import { UploadError, removeStoredFile, streamPdfToDisk } from '@/server/files';
import { instructionsDataDir, instructionsMaxBytes } from '@/server/instructions-config';
import { getSet } from '@/server/data/sets';
import { instructionFileInUse } from '@/server/data/instructions-files';

export const dynamic = 'force-dynamic';

const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Streams one PDF to disk. This is a route handler, not a server action, because PDFs run 20 to 150 MB
 * and actions have a body limit. The body is the raw file; the set and the name travel in headers
 * (`x-set-id`, and `x-label` URL-encoded). Checked as it arrives: signed in as a member or admin,
 * under the size limit, and starting with `%PDF-` whatever the type says.
 */
export async function POST(req: Request) {
  const ctx = await getApiContext();
  if (!ctx) return fail(401, 'Sign in first.');
  if (ctx.viewer.role === 'restricted') return fail(403, 'Kid profiles cannot add instructions.');

  const setId = req.headers.get('x-set-id') ?? '';
  const label = decodeURIComponent(req.headers.get('x-label') ?? '').trim();
  if (!isUuid(setId) || !(await getSet(ctx, setId))) return fail(404, 'Set not found.');
  if (!label) return fail(400, 'Give the instructions a name.');
  if (!req.body) return fail(400, 'No file was sent.');

  const max = instructionsMaxBytes();
  const declared = Number(req.headers.get('content-length') ?? NaN);
  if (Number.isFinite(declared) && declared > max) {
    return fail(413, `That file is larger than the ${Math.round(max / 1_048_576)} MB limit.`);
  }

  const dataDir = instructionsDataDir();
  let stored;
  try {
    stored = await streamPdfToDisk(Readable.fromWeb(req.body as never), {
      dataDir,
      householdId: ctx.householdId,
      setId,
      maxBytes: max,
    });
  } catch (e) {
    if (e instanceof UploadError) {
      return fail(e.code === 'too_large' ? 413 : e.code === 'not_pdf' ? 415 : 400, e.message);
    }
    return fail(500, 'The upload failed. Try again.');
  }

  try {
    const row = await addFileInstruction(ctx, setId, { label, stored });
    return Response.json({ id: row.id }, { status: 201 });
  } catch (e) {
    // Delete the file only if nothing points at it: a repeat upload shares its path with the first.
    if (!(await instructionFileInUse(ctx.db, stored.relPath)))
      await removeStoredFile(dataDir, stored.relPath);
    if (e instanceof DuplicateInstructionError) return fail(409, e.message);
    return fail(
      400,
      e instanceof Error && e.name !== 'ZodError' ? e.message : 'Check the name and try again.',
    );
  }
}
