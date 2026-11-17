import { Readable } from 'node:stream';

import { z } from 'zod';

import { getApiContext } from '@/server/auth/current';
import { DuplicateInstructionError, addFileInstruction } from '@/server/data/instructions';
import { instructionFileInUse } from '@/server/data/instructions-files';
import { getSet } from '@/server/data/sets';
import { UploadError, removeStoredFile, streamPdfToDisk } from '@/server/files';
import { instructionsDataDir, instructionsMaxBytes } from '@/server/instructions-config';
import { SafeFetchError, safeFetch } from '@/server/net/safe-fetch';

export const dynamic = 'force-dynamic';

const body = z.object({
  setId: z.uuid(),
  label: z.string().trim().min(1, 'Give the instructions a name').max(120),
  url: z.string().trim().min(1).max(1000),
});

const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Saves a PDF from a web address, so the booklet survives the maker taking it down. One file per
 * click, started by a person, which keeps it inside the "no background downloading" rule. The address
 * goes through the SSRF guard (public https only, every redirect checked), and the bytes must start
 * with `%PDF-` whatever the server says they are.
 */
export async function POST(req: Request) {
  const ctx = await getApiContext();
  if (!ctx) return fail(401, 'Sign in first.');
  if (ctx.viewer.role === 'restricted') return fail(403, 'Kid profiles cannot add instructions.');

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'Check the form.');
  const { setId, label, url } = parsed.data;
  if (!(await getSet(ctx, setId))) return fail(404, 'Set not found.');

  const max = instructionsMaxBytes();
  const dataDir = instructionsDataDir();
  let stored;
  let finalUrl = url;
  try {
    const res = await safeFetch(url, {
      maxBytes: max,
      userAgent: 'BrickBin (+https://brick-bin.app)',
    });
    finalUrl = res.finalUrl;
    stored = await streamPdfToDisk(Readable.from(res.body), {
      dataDir,
      householdId: ctx.householdId,
      setId,
      maxBytes: max,
    });
  } catch (e) {
    if (e instanceof SafeFetchError) return fail(e.code === 'too_large' ? 413 : 400, e.message);
    if (e instanceof UploadError) {
      return fail(
        e.code === 'too_large' ? 413 : 415,
        e.code === 'not_pdf' ? 'That address did not return a PDF.' : e.message,
      );
    }
    return fail(502, 'The download failed. Try again.');
  }

  try {
    const row = await addFileInstruction(ctx, setId, { label, stored, sourceUrl: finalUrl });
    return Response.json({ id: row.id }, { status: 201 });
  } catch (e) {
    if (!(await instructionFileInUse(ctx.db, stored.relPath)))
      await removeStoredFile(dataDir, stored.relPath);
    if (e instanceof DuplicateInstructionError) return fail(409, e.message);
    return fail(400, 'Could not save it.');
  }
}
