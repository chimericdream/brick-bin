import type { NextConfig } from 'next';

// Extra hostnames server actions accept requests from (reverse proxies, Tailscale names, ...),
// as a comma-separated list. Next.js bakes this config in at build time, so for the published image
// scripts/start-standalone.mjs applies the container's ALLOWED_ORIGINS when it starts; this read
// covers `pnpm dev` and `pnpm start`.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // CSV imports are posted to a server action; the app caps the file at 2 MB itself.
    serverActions: { bodySizeLimit: '3mb', allowedOrigins },
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
};

export default nextConfig;
