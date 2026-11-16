import { readdir, stat, statfs } from 'node:fs/promises';
import path from 'node:path';

/** Total size of the files under a folder, or 0 if it does not exist. Skips nothing; folders are flat. */
export async function dirSize(dir: string): Promise<number> {
  let total = 0;
  let entries: import('node:fs').Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) total += await dirSize(p);
    else if (e.isFile()) total += (await stat(p).catch(() => null))?.size ?? 0;
  }
  return total;
}

/** Free space on the volume that holds `dir` (or its nearest existing parent). Null if unknown. */
export async function freeBytes(dir: string): Promise<number | null> {
  let at = dir;
  for (let i = 0; i < 6; i++) {
    try {
      const s = await statfs(at);
      return Number(s.bavail) * Number(s.bsize);
    } catch {
      at = path.dirname(at);
    }
  }
  return null;
}

export function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} KB`;
  return `${n} B`;
}
