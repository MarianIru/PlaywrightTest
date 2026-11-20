import { defineConfig, devices } from "@playwright/test";
import { testConfig } from "./src/config";

const deviceByBrowser = {
  chromium: devices["Desktop Chrome"],
  firefox: devices["Desktop Firefox"],
  webkit: devices["Desktop Safari"],
};

type BrowserName = keyof typeof deviceByBrowser;

// Shared settings for every UI project; only the browser differs.
const uiUse = (browser: BrowserName) => ({
  ...deviceByBrowser[browser],
  baseURL: testConfig.orangeHrmBaseUrl,
  headless: true,
  trace: "on-first-retry" as const,
  screenshot: "only-on-failure" as const,
  video: "retain-on-failure" as const,
});

export default defineConfig({
  testDir: "./src/tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // the OrangeHRM demo is a shared, slow public site; override with --workers=N
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],

  projects: [
    {
      name: "api",
      testDir: "./src/tests/api",
      use: {
        baseURL: testConfig.petstoreBaseUrl,
        extraHTTPHeaders: { Accept: "application/json" },
      },
    },
    {
      // Browser comes from BROWSER (default chromium); this is what the CI matrix uses.
      name: "ui",
      testDir: "./src/tests/ui",
      use: uiUse(testConfig.browser),
    },
    // CROSS_BROWSER=true adds Firefox and WebKit projects, smoke tests only.
    ...(testConfig.crossBrowser
      ? (["firefox", "webkit"] as const).map((browser) => ({
          name: `ui-${browser}`,
          testDir: "./src/tests/ui",
          grep: /@smoke/,
          use: uiUse(browser),
        }))
      : []),
  ],
});
