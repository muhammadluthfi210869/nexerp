import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['line'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  webServer: {
    command: 'cd backend && npx nest start --watch',
    url: 'http://localhost:3002/api/docs',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'production-e2e',
      testMatch: '**/production/*.spec.ts',
    },
    {
      name: 'scm-e2e',
      testMatch: '**/scm-*.spec.ts',
      use: {
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'scm-e2e-api',
      testMatch: '**/scm-*.spec.ts',
      use: {
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'legality-e2e',
      testMatch: '**/legality-*.spec.ts',
      use: {
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'smoke-api',
      testMatch: '**/communication-protocol.spec.ts',
      use: {
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'golden-thread',
      testMatch: '**/golden-thread/*.spec.ts',
      use: {
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'error-paths',
      testMatch: '**/error-paths.spec.ts',
      use: {
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'edge-cases',
      testMatch: '**/edge-cases.spec.ts',
      use: {
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'all-e2e',
      testMatch: '**/*.spec.ts',
      use: {
        baseURL: 'http://localhost:3002',
      },
    },
  ],
});
