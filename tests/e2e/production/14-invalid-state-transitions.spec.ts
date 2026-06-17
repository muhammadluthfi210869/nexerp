import { test, expect } from '@playwright/test';
import { API_BASE } from './fixtures/constants';

test.describe('Production — Invalid State Transitions', () => {
  test('should reject starting production on non-existent WO', async ({ request }) => {
    const res = await request.post(`${API_BASE}/production/start/00000000-0000-0000-0000-000000000999`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('should reject submitting log for non-existent WO', async ({ request }) => {
    const res = await request.post(`${API_BASE}/production/00000000-0000-0000-0000-000000000999/submit-log`, {
      data: { stage: 'MIXING', inputQty: 0, goodQty: 0, quarantineQty: 0, rejectQty: 0 }
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('should reject issuing material for non-existent requisition', async ({ request }) => {
    const res = await request.post(`${API_BASE}/production/requisitions/00000000-0000-0000-0000-000000000999/issue`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
