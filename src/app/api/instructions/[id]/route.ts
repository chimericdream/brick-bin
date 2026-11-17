import { getApiContext } from '@/server/auth/current';
import { getInstruction } from '@/server/data/instructions';
import { fileSize, fileStream, parseRange, resolveStored } from '@/server/files';
import { instructionsDataDir, pdfFileName } from '@/server/instructions-config';

export const dynamic = 'force-dynamic';

const notFound = () => new Response('Not found', { status: 404 });

async function serve(req: Request, id: string, head: boolean) {
  const ctx = await getApiContext();
  if (!ctx) return new Response('Unauthorized', { status: 401 });
  // Visibility is checked with the set: a hidden set's PDF answers exactly like an unknown one.
  const ins = await getInstruction(ctx, id);
  if (!ins || ins.kind !== 'file' || !ins.filePath) return notFound();
  const abs = resolveStored(instructionsDataDir(), ins.filePath);
  const size = abs ? await fileSize(abs) : null;
  if (!abs || size === null) return notFound();

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${pdfFileName(ins.label)}"`,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  };

  // Range support lets a phone's PDF viewer jump to a page without loading the whole file.
  const range = parseRange(req.headers.get('range'), size);
  if (range === 'invalid') {
    return new Response(null, {
      status: 416,
      headers: { ...baseHeaders, 'Content-Range': `bytes */${size}` },
    });
  }
  if (range) {
    return new Response(head ? null : fileStream(abs, range), {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
        'Content-Length': String(range.end - range.start + 1),
      },
    });
  }
  return new Response(head ? null : fileStream(abs), {
    headers: { ...baseHeaders, 'Content-Length': String(size) },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return serve(req, (await params).id, false);
}

export async function HEAD(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return serve(req, (await params).id, true);
}
