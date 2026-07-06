import { execFileSync } from 'child_process';
import { chromium, FullConfig, APIRequestContext, BrowserContext } from '@playwright/test';
import path from 'path';

const seedCandidates = [
  { email: process.env.E2E_LOGIN_EMAIL || 'admin@dreamlab.com', password: process.env.E2E_LOGIN_PASSWORD || 'password123' },
  { email: 'admin@nexerp.id', password: 'password123' },
  { email: 'zaki@dreamlab.com', password: 'password123' },
];

async function tryLogin(request: APIRequestContext, context: BrowserContext) {
  for (const credentials of seedCandidates) {
    const res = await request.post('http://localhost:3002/auth/login', {
      data: credentials,
    });

    if (!res.ok()) {
      continue;
    }

    const body = await res.json();
    const token = body.access_token;
    process.env.E2E_AUTH_TOKEN = token;

    await context.addCookies([
      { name: 'e2e_token', value: token, domain: 'localhost', path: '/' },
    ]);
    await context.storageState({ path: 'storageState.json' });
    return true;
  }

  return false;
}

function seedBackend() {
  const backendDir = path.join(process.cwd(), 'backend');

  execFileSync(
    process.execPath,
    ['-r', 'ts-node/register/transpile-only', './prisma/seed-personnel.ts'],
    {
      cwd: backendDir,
      stdio: 'inherit',
      env: process.env,
    },
  );

  execFileSync(
    process.execPath,
    ['-r', 'ts-node/register/transpile-only', './prisma/seed-e2e-users.ts'],
    {
      cwd: backendDir,
      stdio: 'inherit',
      env: process.env,
    },
  );
}

async function globalSetup(config: FullConfig) {
  seedBackend();

  const browser = await chromium.launch();
  const context = await browser.newContext();

  if (!(await tryLogin(context.request, context))) {
    await browser.close();
    throw new Error('Auth setup failed after seeding backend');
  }

  await browser.close();
}

export default globalSetup;
