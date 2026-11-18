import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A fully static site: `next build` writes plain files to site/out, which any host can serve.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // pnpm keeps the packages in the repository root's store, so Turbopack needs that root.
  turbopack: { root: path.resolve(import.meta.dirname, '..') },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
};

export default nextConfig;
