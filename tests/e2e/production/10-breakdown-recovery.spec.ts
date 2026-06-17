import { test, expect } from '@playwright/test';
import { API_BASE, TEST_LEAD_ID, TEST_MACHINE_IDS } from './fixtures/constants';

test.describe('Production — Breakdown & Recovery', () => {
  test.describe.configure({ mode: 'serial' });

  let woId: string;

  test('setup: create WO for breakdown test', async ({ request }) => {
    const woRes = await request.post(`${API_BASE}/production/work-orders`, {
      data: { leadId: TEST_LEAD_ID, targetQty: 300, targetCompletion: '2026-08-10' }
    });
    expect(woRes.status()).toBe(201);
    woId = (await woRes.json()).id;
  });

  test('should report breakdown and set machine to DOWN', async ({ request }) => {
    const brkRes = await request.post(`${API_BASE}/production/breakdown`, {
      data: {
        workOrderId: woId,
        stage: 'MIXING',
        machineId: TEST_MACHINE_IDS.mixing,
        notes: 'E2E Test: Motor failure simulation',
      }
    });
    expect(brkRes.status()).toBe(201);
    const brk = await brkRes.json();
    expect(brk.notes).toContain('CRITICAL_ALERT');

    const machinesRes = await request.get(`${API_BASE}/production/machines`);
    const machines = await machinesRes.json();
    const machine = machines.find((m: any) => m.id === TEST_MACHINE_IDS.mixing);
    expect(machine).toBeDefined();
    expect(machine!.status).toBe('DOWN');
  });
});
