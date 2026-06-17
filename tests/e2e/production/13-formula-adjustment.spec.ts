import { test, expect } from '@playwright/test';
import { API_BASE } from './fixtures/constants';

test.describe('Production — Formula Adjustment', () => {
  test('should create and retrieve formula adjustment request', async ({ request }) => {
    const adjRes = await request.post(`${API_BASE}/production/formula-adjustments`, {
      data: {
        formulaId: '00000000-0000-4000-0000-000000000001',
        requestedBy: 'e2e-user-prod',
        reason: 'E2E Test: Adjust concentration',
        changes: { raw_material: { concentration: { old: 5, new: 4.5 } } },
      }
    });
    expect(adjRes.status()).toBe(201);
    const adj = await adjRes.json();
    expect(adj.status).toBe('REQUESTED');

    const listRes = await request.get(`${API_BASE}/production/formula-adjustments`);
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    expect(Array.isArray(list)).toBeTruthy();
  });
});
