import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const url = 'https://kil.nexerp.id/login';
console.log('Navigating to', url);

// Capture network errors
page.on('console', msg => {
  if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
});
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
page.on('requestfailed', req => console.log('REQ FAIL:', req.url(), req.failure()?.errorText));

const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
console.log('HTTP', resp.status());

// Wait for login form to render
await page.waitForTimeout(3000);

// Take screenshot of login page
await page.screenshot({ path: 'C:/GAWE/Web Dev/Porto Aureon/ERP FROM ZERO/artifacts/kil-login-page.png', fullPage: false });
console.log('Login screenshot saved');

// Try to fill form and submit
try {
  await page.fill('input[type="email"]', 'superadmin@nexerp.com');
  await page.fill('input[type="password"]', 'wrong-password-to-test');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/GAWE/Web Dev/Porto Aureon/ERP FROM ZERO/artifacts/kil-login-attempt.png', fullPage: false });
  console.log('After submit screenshot saved');
} catch (e) {
  console.log('Form interaction error:', e.message);
}

await browser.close();
