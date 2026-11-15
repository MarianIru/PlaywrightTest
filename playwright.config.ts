import { defineConfig, devices } from '@playwright/test';

// Trailing slash matters: Playwright resolves relative request paths ("pet/1")
// against baseURL, and without it the "/v2" segment would be dropped.
const PETSTORE_BASE_URL = process.env.PETSTORE_BASE_URL ?? 'https://petstore.swagger.io/v2/';
const ORANGEHRM_BASE_URL =
  process.env.ORANGEHRM_BASE_URL ?? 'https://opensource-demo.orangehrmlive.com/';

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  // Console output for humans, HTML for reviewers, JUnit for CI dashboards.
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Two projects keep API and UI suites separately runnable and configurable.
  projects: [
    {
      name: 'api',
      testDir: './src/tests/api',
      use: {
        baseURL: PETSTORE_BASE_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
    {
      name: 'ui',
      testDir: './src/tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ORANGEHRM_BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
  ],
});
