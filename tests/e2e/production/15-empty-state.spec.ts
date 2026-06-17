import { test, expect } from '@playwright/test';
import { API_BASE } from './fixtures/constants';

test.describe('Production — Empty State Handling', () => {
  test('should return array for work orders list', async ({ request }) => {
    const res = await request.get(`${API_BASE}/production/work-orders`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should return structured dashboard even with no data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/production/dashboard`);
    expect(res.ok()).toBeTruthy();
    const dash = await res.json();
    expect(dash.cards).toBeDefined();
    expect(typeof dash.cards.achievement.rate).toBe('number');
  });
});
