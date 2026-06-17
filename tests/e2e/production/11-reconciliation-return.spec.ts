import { test, expect } from '@playwright/test';
import { API_BASE, TEST_LEAD_ID, TEST_MATERIAL_IDS } from './fixtures/constants';

test.describe('Production — Reconciliation & Material Return', () => {
  test.describe.configure({ mode: 'serial' });

  let woId: string;

  test('setup: create WO for reconciliation test', async ({ request }) => {
    const woRes = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 150, targetCompletion: '2026-08-05' }
    });
    expect(woRes.status()).toBe(201);
    woId = (await woRes.json()).id;
  });

  test('should return material to warehouse', async ({ request }) => {
    const returnRes = await request.post(`${API_BASE}/production/reconciliation/return`, {
      data: {
        workOrderId: woId,
        materialId: TEST_MATERIAL_IDS.raw,
        qtyReturned: 5,
        reason: 'E2E Test: Excess material from batch',
      }
    });
    expect(returnRes.status()).toBe(201);
    const ret = await returnRes.json();
    expect(ret.status).toBe('PENDING');
  });
});
