import { test, expect } from '@playwright/test';
import { API_BASE, TEST_LEAD_ID, TEST_MACHINE_IDS, TEST_MATERIAL_IDS } from './fixtures/constants';

test.describe('Production — QC Fail → Rework', () => {
  test.describe.configure({ mode: 'serial' });

  let woId: string;
  let createdScheduleId: string;

  test('should create WO, submit mixing log with quarantine, verify QC pending', async ({ request }) => {
    const woRes = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 200, targetCompletion: '2026-08-01' }
    });
    expect(woRes.status()).toBe(201);
    woId = (await woRes.json()).id;

    const scheduleRes = await request.post(`${API_BASE}/production/schedules`, {
      data: {
        workOrderId: woId,
        machineId: TEST_MACHINE_IDS.mixing,
        stage: 'MIXING',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        targetQty: 200,
        formulaDetails: [{ materialId: TEST_MATERIAL_IDS.raw, qtyTheoretical: 40, category: 'RAW' }],
      }
    });
    expect(scheduleRes.status()).toBe(201);
    createdScheduleId = (await scheduleRes.json()).id;
  });

  test('should submit log with quarantine to trigger PENDING_QC', async ({ request }) => {
    const logRes = await request.post(`${API_BASE}/production/${woId}/submit-log`, {
      data: {
        stage: 'MIXING', inputQty: 200, goodQty: 0, rejectQty: 0,
        quarantineQty: 200, notes: 'Awaiting QC',
        nextStage: 'FILLING', machineId: TEST_MACHINE_IDS.mixing,
      }
    });
    expect(logRes.ok()).toBeTruthy();

    const woCheckRes = await request.get(`${API_BASE}/production/work-orders`);
    const wo = (await woCheckRes.json()).find((w: any) => w.id === woId);
    expect(wo).toBeDefined();
    expect(['PENDING_QC', 'WAITING_MATERIAL']).toContain(wo!.stage);
  });
});
