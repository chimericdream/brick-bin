import { readFile } from 'node:fs/promises';

import { getApiContext } from '@/server/auth/current';
import { catalogConfig, catalogPaths } from '@/server/catalog/config';

export const dynamic = 'force-dynamic';

/**
 * The saved "how the files fit together" diagram, from our own server. It is shown in an <img>, and
 * the sandbox policy means no script inside it could ever run, even if the file were opened directly.
 */
export async function GET() {
  const ctx = await getApiContext();
  if (!ctx) return new Response('Unauthorized', { status: 401 });
  try {
    const svg = await readFile(catalogPaths(catalogConfig().dataDir).schema);
    return new Response(new Uint8Array(svg), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Security-Policy': 'sandbox',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
