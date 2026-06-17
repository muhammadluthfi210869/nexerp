import { test, expect } from '@playwright/test';
import { API_BASE, TEST_LEAD_ID } from './fixtures/constants';

test.describe('Production — Concurrent Work Orders', () => {
  test('should create two WOs simultaneously and verify both created', async ({ request }) => {
    const [wo1, wo2] = await Promise.all([
      request.post(`${API_BASE}/production/work-orders`, {
        data: { leadId: TEST_LEAD_ID, targetQty: 300, targetCompletion: '2026-07-30' }
      }),
      request.post(`${API_BASE}/production/work-orders`, {
        data: { leadId: TEST_LEAD_ID, targetQty: 500, targetCompletion: '2026-08-15' }
      }),
    ]);
    expect(wo1.status()).toBe(201);
    expect(wo2.status()).toBe(201);

    const [wo1Body, wo2Body] = await Promise.all([wo1.json(), wo2.json()]);
    const activeRes = await request.get(`${API_BASE}/production/active`);
    const active = await activeRes.json();
    const createdWOs = active.filter((w: any) =>
      w.id === wo1Body.id || w.id === wo2Body.id
    );
    expect(createdWOs.length).toBe(2);
  });
});
