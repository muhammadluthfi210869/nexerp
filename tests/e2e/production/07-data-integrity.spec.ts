import { test, expect } from '@playwright/test';
import { API_BASE, TEST_LEAD_ID } from './fixtures/constants';

test.describe('Data Integrity & Edge Cases', () => {
  test('7.1 WO number is unique', async ({ request }) => {
    const res1 = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 50, targetCompletion: '2026-07-30' }
    });
    const wo1 = await res1.json();

    const res2 = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 50, targetCompletion: '2026-07-30' }
    });
    const wo2 = await res2.json();

    // Even though data is identical, woNumbers should be unique
    expect(wo1.woNumber).not.toBe(wo2.woNumber);
  });

  test('7.2 Start production with invalid WO returns 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/production/start/invalid-id-12345`);
    expect(res.status()).toBe(400);
  });

  test('7.3 Transaction rollback on partial failure', async ({ request }) => {
    // Try to create schedule with non-existent material → should rollback
    const woRes = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 100, targetCompletion: '2026-07-30' }
    });
    const wo = await woRes.json();

    const schRes = await request.post(`${API_BASE}/production/schedules`, {
      data: {
        workOrderId: wo.id,
        machineId: '00000000-0000-0000-0000-000000000999',
        stage: 'MIXING',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        targetQty: 100,
      }
    });
    expect(schRes.status()).toBe(400); // Should fail with bad machine

    // Verify no partial schedule was created
    const schedulesRes = await request.get(`${API_BASE}/production/schedules?stage=MIXING`);
    const schedules = await schedulesRes.json();
    const orphaned = schedules.filter((s: any) => s.workOrderId === wo.id);
    expect(orphaned.length).toBe(0); // Rollback succeeded
  });

  test('7.4 Empty WO list returns empty array not error', async ({ request }) => {
    const res = await request.get(`${API_BASE}/production/work-orders?stage=NONEXISTENT`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('7.5 Dashboard without data returns safe defaults', async ({ request }) => {
    const res = await request.get(`${API_BASE}/production/dashboard`);
    expect(res.ok()).toBeTruthy();
    const dash = await res.json();
    
    // Should never return null/undefined for critical fields
    expect(dash.cards).not.toBeNull();
    expect(dash.cards.achievement).not.toBeNull();
    expect(dash.cards.achievement.rate).toBeDefined();
    expect(typeof dash.cards.achievement.rate).toBe('number');
    
    expect(dash.workshops).not.toBeNull();
    expect(dash.precisionTracking).toBeDefined();
    expect(Array.isArray(dash.precisionTracking)).toBeTruthy();
  });
});
