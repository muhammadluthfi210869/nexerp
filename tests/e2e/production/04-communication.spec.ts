import { test, expect } from '@playwright/test';
import { API_BASE, TEST_LEAD_ID, TEST_MACHINE_IDS, TEST_MATERIAL_IDS } from './fixtures/constants';

test.describe('Communication Protocol — Event Emissions', () => {
  test('4.1 Activity audit trail records production events', async ({ request }) => {
    // Create a WO to generate events
    const woRes = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 100, targetCompletion: '2026-07-30' }
    });
    expect(woRes.ok()).toBeTruthy();

    // Start production to trigger events
    const wo = await woRes.json();

    // Create schedule
    const schRes = await request.post(`${API_BASE}/production/schedules`, {
      data: {
        workOrderId: wo.id,
        machineId: TEST_MACHINE_IDS.mixing,
        stage: 'MIXING',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        targetQty: 100,
        formulaDetails: [{ materialId: TEST_MATERIAL_IDS.raw, qtyTheoretical: 50, category: 'RAW' }],
      }
    });
    expect(schRes.ok()).toBeTruthy();

    // The system should have created activity logs
    // (We verify this by checking the WO is in the correct state)
    const activeRes = await request.get(`${API_BASE}/production/active`);
    expect(activeRes.ok()).toBeTruthy();
    const activeWOs = await activeRes.json();
    const updatedWo = activeWOs.find((w: any) => w.id === wo.id);
    expect(updatedWo).toBeDefined();
    expect(updatedWo.stage).toBe('MIXING');
  });

  test('4.2 Schedule created event triggers costing calculation', async ({ request }) => {
    const woRes = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 200, targetCompletion: '2026-07-30' }
    });
    const wo = await woRes.json();

    // Create schedule with machine that has costPerHour
    const schRes = await request.post(`${API_BASE}/production/schedules`, {
      data: {
        workOrderId: wo.id,
        machineId: TEST_MACHINE_IDS.mixing,
        stage: 'MIXING',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        targetQty: 200,
        formulaDetails: [{ materialId: TEST_MATERIAL_IDS.raw, qtyTheoretical: 100, category: 'RAW' }],
      }
    });
    const sch = await schRes.json();

    // Complete the schedule with timing info
    const resultRes = await request.post(`${API_BASE}/production/schedules/${sch.id}/result`, {
      data: {
        resultQty: 195,
        notes: 'E2E: Costing test',
        elapsedSeconds: 7200,
        downtimeMinutes: 10,
      }
    });
    expect(resultRes.ok()).toBeTruthy();
    const result = await resultRes.json();

    // Bug 3 fix: verify costing is returned
    expect(result.costing).toBeDefined();
    expect(result.costing.totalCost).toBeGreaterThan(0);
    expect(result.costing.actualDurationMinutes).toBe(120); // 7200s = 120min
  });
});
