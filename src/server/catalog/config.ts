import path from 'node:path';

/** Everything the catalog import reads from the environment (docs/PLAN.md section 10). */
export interface CatalogConfig {
  /** True lets the import fetch the downloads page itself; otherwise an admin pastes it. */
  pageFetch: boolean;
  pageUrl: string;
  allowedOrigins: string[];
  /** Covers are only ever downloaded from this origin. */
  imageOrigin: string;
  userAgent: string;
  dataDir: string;
}

export function catalogConfig(
  env: Record<string, string | undefined> = process.env,
): CatalogConfig {
  const origins = (
    env.REBRICKABLE_ALLOWED_ORIGINS ?? 'https://rebrickable.com,https://cdn.rebrickable.com'
  )
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return {
    pageFetch: env.REBRICKABLE_PAGE_FETCH === 'true',
    pageUrl: env.REBRICKABLE_DOWNLOADS_PAGE ?? 'https://rebrickable.com/downloads/',
    allowedOrigins: origins,
    imageOrigin: (env.CATALOG_IMAGE_ORIGIN ?? 'https://cdn.rebrickable.com').replace(/\/$/, ''),
    userAgent: `BrickBin/${env.APP_VERSION ?? '0.1'} (+https://brick-bin.app)`,
    dataDir: path.resolve(/* turbopackIgnore: true */ env.DATA_DIR ?? './data'),
  };
}

/** Where catalog files live under DATA_DIR. */
export const catalogPaths = (dataDir: string) => ({
  root: path.join(dataDir, 'catalog'),
  tmp: path.join(dataDir, 'catalog', 'tmp'),
  ldraw: path.join(dataDir, 'catalog', 'ldraw'),
  schema: path.join(dataDir, 'catalog', 'downloads_schema.svg'),
});

/** The key the once-a-day-per-URL rule uses: the address without its cache-busting query string. */
export function fileKey(url: string): string {
  const u = new URL(url);
  return `${u.origin}${u.pathname}`;
}
