import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /(\.spec\.(ts|js))$/i,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL — use port 3003 (matches npm run dev -- -p 3003) */
    baseURL: 'http://localhost:3003',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* UAT pre-flight: a screenshot of the broken page is the review artifact */
    screenshot: 'only-on-failure',

    /* Bound every action. The default is no timeout, so one action that can
       never settle (an element that disables itself or navigates away
       mid-click) burns the whole test budget and reports itself as the defect. */
    actionTimeout: 15_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Serve a production build on :3003 — the same thing scripts/test-browser-agent.sh does,
     for the case where someone runs `npx playwright test` directly. It used to be
     `npm run dev`, which compiles each route on first request, one at a time: a 264-route
     sweep over the dev server takes ~10 minutes and can only ever time out, and the dev
     error overlay changes what the assertions see. `next start` needs a build — run
     `npm run build` first, or use the runner, which builds and guards the port for you. */
  webServer: {
    command: 'npx next start -p 3003',
    url: 'http://localhost:3003',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
