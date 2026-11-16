import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // PGlite runs the real migrations per test, which is slow on a cold start.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Playwright specs live in e2e/ and run with `pnpm e2e`.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
