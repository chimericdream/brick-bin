import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // CSV imports are posted to a server action; the app caps the file at 2 MB itself.
    serverActions: { bodySizeLimit: '3mb' },
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
};

export default nextConfig;
