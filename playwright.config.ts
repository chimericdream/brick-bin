import { defineConfig, devices } from '@playwright/test';

import { APP_PORT, BASE_URL, DATA_DIR, DATABASE_URL, MOCK_URL } from './e2e/support/env';
import { ADMIN } from './e2e/support/roles';

const ci = !!process.env.CI;

export default defineConfig({
  testDir: './e2e/specs',
  outputDir: './e2e/.tmp/test-results',
  // One app instance and one database are shared, so tests run one at a time.
  workers: 1,
  fullyParallel: false,
  retries: ci ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: ci,
  reporter: ci
    ? [['list'], ['html', { open: 'never', outputFolder: 'e2e/.tmp/report' }]]
    : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      // First-run flow on an empty database; creates the role accounts and their logins.
      name: 'setup',
      testMatch: /00-first-run\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: /\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: ADMIN.storageState },
    },
    // Visual reference screenshots: E2E_SCREENSHOTS=1 pnpm shots
    ...(process.env.E2E_SCREENSHOTS
      ? [
          {
            name: 'screenshots',
            testDir: './e2e/screenshots',
            testMatch: /.shots.ts/,
            dependencies: ['setup'],
            use: {
              ...devices['Desktop Chrome'],
              viewport: { width: 1440, height: 900 },
              storageState: ADMIN.storageState,
            },
          },
        ]
      : []),
  ],
  webServer: [
    {
      command: 'node e2e/start-app.mjs',
      url: `${BASE_URL}/api/health`,
      // The database is recreated on start, so never reuse a running instance.
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        E2E_APP_PORT: String(APP_PORT),
        DATABASE_URL,
        DATA_DIR,
        COOKIE_SECURE: 'false',
        NODE_ENV: 'production',
        // The import talks to a mock on loopback; no test ever contacts rebrickable.com.
        REBRICKABLE_ALLOWED_ORIGINS: MOCK_URL,
        REBRICKABLE_DOWNLOADS_PAGE: `${MOCK_URL}/downloads/`,
        CATALOG_IMAGE_ORIGIN: MOCK_URL,
        UPC_BASE_URL: `${MOCK_URL}/upc`,
        // A small cap, so the size limit can be tested with a small file.
        INSTRUCTIONS_MAX_MB: '1',
        ...(process.env.E2E_SKIP_BUILD ? { E2E_SKIP_BUILD: process.env.E2E_SKIP_BUILD } : {}),
      },
    },
  ],
});
