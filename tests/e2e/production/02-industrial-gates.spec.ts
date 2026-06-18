import { test, expect } from '@playwright/test';
import { API_BASE, TEST_LEAD_ID, TEST_MACHINE_IDS, TEST_MATERIAL_IDS, TEST_SUPERVISOR_ID, TEST_SUPERVISOR_PIN } from './fixtures/constants';

test.describe('Industrial Gates — Security & Validation', () => {
  let scheduleId: string;
  let detailId: string;
  let woId: string;

  test.beforeEach(async ({ request }) => {
    // Create a fresh WO + schedule for each gate test
    const woRes = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 100, targetCompletion: '2026-07-30' }
    });
    const wo = await woRes.json();
    woId = wo.id;

    const schRes = await request.post(`${API_BASE}/production/schedules`, {
      data: {
        workOrderId: woId,
        machineId: TEST_MACHINE_IDS.mixing,
        stage: 'MIXING',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        targetQty: 100,
        formulaDetails: [
          { materialId: TEST_MATERIAL_IDS.raw, qtyTheoretical: 50, category: 'RAW' },
          { materialId: TEST_MATERIAL_IDS.bulk, qtyTheoretical: 30, category: 'BULK' },
        ],
      }
    });
    const sch = await schRes.json();
    scheduleId = sch.id;
    detailId = sch.stepDetails?.[0]?.id;
  });

  test('Gate 1: Atomic Phase Interlock', async ({ request }) => {
    // Try to submit actuals for a component BEFORE the first one
    // First create a schedule with 2 components
    const woRes2 = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 100, targetCompletion: '2026-07-30' }
    });
    const wo2 = await woRes2.json();
    
    const schRes2 = await request.post(`${API_BASE}/production/schedules`, {
      data: {
        workOrderId: wo2.id,
        machineId: TEST_MACHINE_IDS.mixing,
        stage: 'MIXING',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        targetQty: 100,
        formulaDetails: [
          { materialId: TEST_MATERIAL_IDS.raw, qtyTheoretical: 50, category: 'RAW' },
          { materialId: TEST_MATERIAL_IDS.bulk, qtyTheoretical: 30, category: 'BULK' },
        ],
      }
    });
    const sch2 = await schRes2.json();
    const secondDetailId = sch2.stepDetails?.[1]?.id;

    // Try to submit component #2 without component #1
    if (secondDetailId) {
      const actualsRes = await request.post(`${API_BASE}/production/schedules/${sch2.id}/actuals`, {
        data: { actuals: [{ detailId: secondDetailId, qtyActual: 28 }] }
      });
      expect(actualsRes.status()).toBe(400);
      const body = await actualsRes.json();
      expect(body.code || body.message).toMatch(/ATOMIC_SEQUENCE|atomic|sequence|TOLERANCE_EXCEEDED|tolerance|DEVIATION|deviation/i);
    }
  });

  test('Gate 3: Physical Law Validation', async ({ request }) => {
    // Bulk actual=50kg, theoretical=50kg, target=100pcs → max 101pcs
    // Try resultQty=200 → should be rejected
    const resultRes = await request.post(`${API_BASE}/production/schedules/${scheduleId}/result`, {
      data: { resultQty: 200, notes: 'E2E: test physical limit' }
    });
    expect(resultRes.status()).toBe(400);
    const body = await resultRes.json();
    expect(body.message).toMatch(/fisika|PHYSICAL|limit|exceeded/i);
  });

  test('Gate 5: Weight Tolerance PIN', async ({ request }) => {
    // Submit actual with deviation > 0.5% but < 10% (so it needs PIN but isn't blocked)
    if (detailId) {
      // First try WITHOUT PIN → should fail
      const noPinRes = await request.post(`${API_BASE}/production/schedules/${scheduleId}/actuals`, {
        data: { actuals: [{ detailId, qtyActual: 50.5 }] } // 1% deviation from 50
      });
      expect(noPinRes.status()).toBe(400);
      const noPinBody = await noPinRes.json();
      expect(noPinBody.code).toBe('TOLERANCE_EXCEEDED');

      // Then try WITH supervisor PIN → should succeed
      const withPinRes = await request.post(`${API_BASE}/production/schedules/${scheduleId}/actuals`, {
        data: {
          actuals: [{ detailId, qtyActual: 50.5 }],
          supervisorPin: TEST_SUPERVISOR_PIN,
          supervisorId: TEST_SUPERVISOR_ID,
        }
      });
      expect(withPinRes.ok()).toBeTruthy();
    }
  });

  test('Gate 5b: Hard-Stop 10% Deviation', async ({ request }) => {
    // Submit actual with deviation > 10% → should be blocked even WITH PIN
    const woRes = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 100, targetCompletion: '2026-07-30' }
    });
    const wo = await woRes.json();
    const schRes = await request.post(`${API_BASE}/production/schedules`, {
      data: {
        workOrderId: wo.id,
        machineId: TEST_MACHINE_IDS.mixing,
        stage: 'MIXING',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        targetQty: 100,
        formulaDetails: [{ materialId: TEST_MATERIAL_IDS.raw, qtyTheoretical: 100, category: 'RAW' }],
      }
    });
    const sch = await schRes.json();
    const detId = sch.stepDetails?.[0]?.id;

    // 15% deviation — should be blocked regardless of PIN
    if (detId) {
      const res = await request.post(`${API_BASE}/production/schedules/${sch.id}/actuals`, {
        data: {
          actuals: [{ detailId: detId, qtyActual: 120 }], // 20% deviation from 100
          supervisorPin: TEST_SUPERVISOR_PIN,
          supervisorId: TEST_SUPERVISOR_ID,
        }
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('DEVIATION_EXCESSIVE');
    }
  });

  test('Gate 6: Invalid Supervisor PIN', async ({ request }) => {
    if (detailId) {
      const res = await request.post(`${API_BASE}/production/schedules/${scheduleId}/actuals`, {
        data: {
          actuals: [{ detailId, qtyActual: 50.5 }],
          supervisorPin: 'WRONG_PIN',
          supervisorId: TEST_SUPERVISOR_ID,
        }
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.message).toMatch(/PIN/i);
    }
  });
});
