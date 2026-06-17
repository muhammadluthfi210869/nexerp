import { test, expect } from '@playwright/test';
import { API_BASE, TEST_LEAD_ID } from './fixtures/constants';

test.describe('Production — Shortage Escalation', () => {
  test.describe.configure({ mode: 'serial' });

  test('should create WO, flag shortage, and verify escalation to WAITING_PROCUREMENT', async ({ request }) => {
    const woRes = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 1000, targetCompletion: '2026-07-30' }
    });
    expect(woRes.status()).toBe(201);
    const wo = await woRes.json();

    const reqsRes = await request.get(`${API_BASE}/production/requisitions`);
    const reqs = await reqsRes.json();
    const req = reqs.find((r: any) => r.workOrderId === wo.id || r.workOrder?.id === wo.id);
    expect(req).toBeDefined();

    const shortageRes = await request.post(`${API_BASE}/production/requisitions/${req!.id}/shortage`);
    expect(shortageRes.status()).toBe(201);

    const activeRes = await request.get(`${API_BASE}/production/active`);
    const active = await activeRes.json();
    const escalated = active.find((w: any) => w.id === wo.id);
    expect(escalated).toBeDefined();
    expect(escalated!.stage).toBe('WAITING_PROCUREMENT');
  });
});
