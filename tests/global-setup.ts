import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const request = context.request;

  try {
    const res = await request.post('http://localhost:3002/auth/login', {
      data: { email: 'admin@nexerp.id', password: 'password123' },
    });

    if (res.ok()) {
      const body = await res.json();
      const token = body.access_token;
      process.env.E2E_AUTH_TOKEN = token;

      // Store auth state for use in tests
      await context.addCookies([
        { name: 'e2e_token', value: token, domain: 'localhost', path: '/' },
      ]);
      await context.storageState({ path: 'storageState.json' });
    } else {
      console.warn('Auth setup failed:', res.status(), await res.text());
    }
  } catch (e) {
    console.warn('Auth setup error:', e);
  }

  await browser.close();
}

export default globalSetup;
