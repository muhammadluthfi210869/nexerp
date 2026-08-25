import { defineConfig } from '@playwright/test';
import * as path from 'path';

// R4-Gate-1 Day-1 Playwright config:
// - Uses Biznet production frontend via SSH tunnel at http://127.0.0.1:3001
// - Uses Biznet r4-shadow-backend at http://127.0.0.1:4001 via SSH tunnel
// - All /api/* calls are intercepted by `r4-day1.spec.ts` route() and redirected to localhost:4001
// - NO writes touch the protected production DB — all writes go to the migrated real-data shadow
const here = __dirname;
export default defineConfig({
  testDir: here,
  testMatch: /r4-day1\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: path.join(here, '..', '..', 'playwright-report', 'r4-day1-results.json') }]],
  use: {
    baseURL: 'http://127.0.0.1:3001',
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
    actionTimeout: 20000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
  },
});
