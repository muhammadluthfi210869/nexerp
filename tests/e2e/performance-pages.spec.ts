import { test, expect } from '@playwright/test';

const FRONTEND = 'http://localhost:3000';
const API = 'http://localhost:3002';

test.describe('Page Load Performance', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@nexerp.id', password: 'password123' },
    });
    expect([200, 201]).toContain(res.status());
    token = (await res.json()).access_token;
  });

  const routes = [
    { path: '/dashboard', name: 'Main Dashboard' },
    { path: '/bussdev/dashboard', name: 'BussDev Dashboard' },
    { path: '/finance/dashboard', name: 'Finance Dashboard' },
    { path: '/production/dashboard', name: 'Production Dashboard' },
    { path: '/qc/dashboard', name: 'QC Dashboard' },
    { path: '/rnd/dashboard', name: 'R&D Dashboard' },
    { path: '/scm/dashboard', name: 'SCM Dashboard' },
    { path: '/warehouse', name: 'Warehouse' },
    { path: '/hr', name: 'HR' },
    { path: '/legality/dashboard', name: 'Legality Dashboard' },
  ];

  for (const { path, name } of routes) {
    test(`${name} loads within 5 seconds`, async ({ page }) => {
      await page.addInitScript((t: string) => {
        localStorage.setItem('access_token', t);
        localStorage.setItem('token', t);
      }, token);

      const start = Date.now();
      await page.goto(`${FRONTEND}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const domTime = Date.now() - start;

      await page.waitForTimeout(2000);

      const bodyChildren = await page.locator('body > *').count();
      expect(bodyChildren).toBeGreaterThan(0);
      expect(domTime).toBeLessThan(5000);

      console.log(`  ${name}: ${domTime}ms (DOM loaded)`);
    });
  }
});