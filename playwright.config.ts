import { defineConfig, devices } from '@playwright/test';
import { testConfig } from './src/config';

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  projects: [
      {
          name: 'api',
          testDir: './src/tests/api',
          use: {
              baseURL: testConfig.petstoreBaseUrl,
              extraHTTPHeaders: {Accept: 'application/json'},
          },
      },
      {
          name: 'ui',
          testDir: './src/tests/ui',
          use: {
              ...devices['Desktop Chrome'],
              baseURL: testConfig.orangeHrmBaseUrl,
              trace: 'on-first-retry',
              screenshot: 'only-on-failure',
              video: 'retain-on-failure',
          },
      },
      ...(testConfig.crossBrowser
          ? [
              {
                  name: 'ui-firefox',
                  testDir: './tests/ui',
                  use: {...devices['Desktop Firefox'], baseURL: testConfig.orangeHrmBaseUrl},
              },
              {
                  name: 'ui-webkit',
                  testDir: './tests/ui',
                  use: {...devices['Desktop Safari'], baseURL: testConfig.orangeHrmBaseUrl},
              },
          ]
          : []),
  ],
});
