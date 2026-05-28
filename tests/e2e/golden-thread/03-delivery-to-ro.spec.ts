import { test, expect } from '@playwright/test';

const API = 'http://localhost:3002';

test.describe('Golden Thread 3: Delivery → Invoice → Payment → RO', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });

  let token: string;

  test('Step 0: Authenticate', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@nexerp.id', password: 'password123' },
    });
    expect([200, 201]).toContain(res.status());
    token = (await res.json()).access_token;
  });

  // Step 1: Warehouse — check delivery readiness
  test('Step 1: Warehouse — Check inbounds', async ({ request }) => {
    const res = await request.get(`${API}/warehouse/inbounds`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  // Step 2: Warehouse — check release requests
  test('Step 2: Warehouse — Check release requests', async ({ request }) => {
    const res = await request.get(`${API}/warehouse/release-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  // Step 3: Logistics — check deliverables
  test('Step 3: Logistics — Check deliverable orders', async ({ request }) => {
    const res = await request.get(`${API}/logistics/deliverable`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  // Step 4: Finance — Check invoices
  test('Step 4: Finance — Check invoices', async ({ request }) => {
    const res = await request.get(`${API}/finance/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  // Step 5: Finance — Check final invoices
  test('Step 5: Finance — Check final invoices', async ({ request }) => {
    const res = await request.get(`${API}/finance/invoices/final`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  // Step 6: Finance — Check AR hub
  test('Step 6: Finance — Check AR Hub pending', async ({ request }) => {
    const res = await request.get(`${API}/finance/ar-hub/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  // Step 7: Finance — Check payment verification
  test('Step 7: Finance — Verify payment endpoint reachable', async ({ request }) => {
    const res = await request.post(`${API}/finance/verify-payment`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { orderId: 'nonexistent', amount: 10000, method: 'BANK_TRANSFER' },
    });
    expect([200, 201, 400, 404, 500]).toContain(res.status());
  });

  // Step 8: BussDev — Check retention engine
  test('Step 8: BussDev — Check repeat order retention', async ({ request }) => {
    const res = await request.get(`${API}/bussdev/analytics/lost-churn`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  // Step 9: BussDev — Check leads by RO group
  test('Step 9: BussDev — Check RO leads', async ({ request }) => {
    const res = await request.get(`${API}/bussdev/leads/group/ro`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  // Step 10: Finance — Reports
  test('Step 10: Finance — Trial balance report', async ({ request }) => {
    const res = await request.get(`${API}/finance/reports/trial-balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });
});
