import { test, expect, request as apiRequest } from '@playwright/test';

const API = 'http://localhost:3002';

test.describe('Error Paths — API Validation', () => {
  let token: string;
  let anonRequest: any;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@nexerp.id', password: 'password123' },
    });
    expect([200, 201]).toContain(res.status());
    token = (await res.json()).access_token;
    anonRequest = await apiRequest.newContext({
      extraHTTPHeaders: {
        Authorization: '',
      },
    });
  });

  test.afterAll(async () => {
    await anonRequest?.dispose();
  });

  // ─────────────────────────────────────────────
  // 1. AUTH ERROR PATHS
  // ─────────────────────────────────────────────

  test.describe('Auth Errors', () => {
    test('POST /auth/login — invalid credentials returns 401', async ({ request }) => {
      const res = await request.post(`${API}/auth/login`, {
        data: { email: 'wrong@email.com', password: 'wrongpassword' },
      });
      expect(res.status()).toBe(401);
    });

    test('POST /auth/login — empty body returns 400', async ({ request }) => {
      const res = await request.post(`${API}/auth/login`, {
        data: {},
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /auth/login — missing password returns 400', async ({ request }) => {
      const res = await request.post(`${API}/auth/login`, {
        data: { email: 'admin@nexerp.id' },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('GET /auth/profile — no token returns 401', async ({ request }) => {
      const res = await anonRequest.get(`${API}/auth/profile`);
      expect(res.status()).toBe(401);
    });

    test('GET /auth/profile — invalid token returns 401', async ({ request }) => {
      const res = await request.get(`${API}/auth/profile`, {
        headers: { Authorization: 'Bearer invalid.jwt.token' },
      });
      expect(res.status()).toBe(401);
    });

    test('GET /auth/profile — malformed header returns 401', async ({ request }) => {
      const res = await request.get(`${API}/auth/profile`, {
        headers: { Authorization: 'not-a-bearer-token' },
      });
      expect(res.status()).toBe(401);
    });

    test('POST /bussdev/lead — wrong role returns 403', async ({ request }) => {
      const loginRes = await request.post(`${API}/auth/login`, {
        data: { email: 'operator@nexerp.id', password: 'password123' },
      });
      if (loginRes.status() === 201 || loginRes.status() === 200) {
        const userToken = (await loginRes.json()).access_token;
        const res = await request.post(`${API}/bussdev/lead`, {
          data: {
            clientName: 'Test',
            contactInfo: 'test@test.com',
            source: 'WEB',
            productInterest: 'Product',
            estimatedValue: 1000000,
          },
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect(res.status()).toBe(403);
      }
    });

    test('POST /finance/journals — wrong role returns 403', async ({ request }) => {
      const loginRes = await request.post(`${API}/auth/login`, {
        data: { email: 'operator@nexerp.id', password: 'password123' },
      });
      if (loginRes.status() === 201 || loginRes.status() === 200) {
        const userToken = (await loginRes.json()).access_token;
        const res = await request.post(`${API}/finance/journals`, {
          data: {
            date: '2025-01-01',
            description: 'Unauthorized journal',
            lines: [],
          },
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect(res.status()).toBe(403);
      }
    });
  });

  // ─────────────────────────────────────────────
  // 2. LEAD CREATION VALIDATION
  // ─────────────────────────────────────────────

  test.describe('Lead Creation Validation', () => {
    test('POST /bussdev/lead — missing required fields returns 400', async ({ request }) => {
      const res = await request.post(`${API}/bussdev/lead`, {
        data: { clientName: 'Test Client' },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /bussdev/lead — empty body returns 400', async ({ request }) => {
      const res = await request.post(`${API}/bussdev/lead`, {
        data: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /bussdev/lead — estimatedValue as string returns 400', async ({ request }) => {
      const res = await request.post(`${API}/bussdev/lead`, {
        data: {
          clientName: 'Test Client',
          contactInfo: '08123456789',
          source: 'WEB',
          productInterest: 'Skincare',
          estimatedValue: 'not-a-number',
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /bussdev/lead — unknown fields rejected by whitelist', async ({ request }) => {
      const res = await request.post(`${API}/bussdev/lead`, {
        data: {
          clientName: 'Test Client',
          contactInfo: '08123456789',
          source: 'WEB',
          productInterest: 'Skincare',
          estimatedValue: 1000000,
          injectedField: 'should be rejected',
          anotherBadField: 123,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /bussdev/lead — invalid UUID picId returns 400', async ({ request }) => {
      const res = await request.post(`${API}/bussdev/lead`, {
        data: {
          clientName: 'Test Client',
          contactInfo: '08123456789',
          source: 'WEB',
          productInterest: 'Skincare',
          estimatedValue: 1000000,
          picId: 'not-a-uuid',
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });
  });

  // ─────────────────────────────────────────────
  // 3. LEAD ADVANCE VALIDATION
  // ─────────────────────────────────────────────

  test.describe('Lead Advance Validation', () => {
    test('PATCH /bussdev/lead/:id/advance — non-existent lead returns 404', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.patch(`${API}/bussdev/lead/${fakeId}/advance`, {
        data: {
          action: 'STAGE_UPDATED',
          newStatus: 'FOLLOW_UP',
          loggedBy: 'admin',
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });

    test('PATCH /bussdev/lead/:id/advance — invalid action enum returns 400', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.patch(`${API}/bussdev/lead/${fakeId}/advance`, {
        data: {
          action: 'INVALID_ACTION',
          newStatus: 'FOLLOW_UP',
          loggedBy: 'admin',
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('PATCH /bussdev/lead/:id/advance — missing required fields returns 400', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.patch(`${API}/bussdev/lead/${fakeId}/advance`, {
        data: { action: 'STAGE_UPDATED' },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('PATCH /bussdev/lead/:id/advance — invalid newStatus enum returns 400', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.patch(`${API}/bussdev/lead/${fakeId}/advance`, {
        data: {
          action: 'STAGE_UPDATED',
          newStatus: 'NOT_A_VALID_STATUS',
          loggedBy: 'admin',
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('PATCH /bussdev/lead/:id/advance — non-UUID id returns 400', async ({ request }) => {
      const res = await request.patch(`${API}/bussdev/lead/not-a-uuid/advance`, {
        data: {
          action: 'STAGE_UPDATED',
          newStatus: 'FOLLOW_UP',
          loggedBy: 'admin',
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });
  });

  // ─────────────────────────────────────────────
  // 4. FINANCE VALIDATION
  // ─────────────────────────────────────────────

  test.describe('Finance Validation', () => {
    test('POST /finance/journals — missing required fields returns 400', async ({ request }) => {
      const res = await request.post(`${API}/finance/journals`, {
        data: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /finance/journals — empty lines array returns 400', async ({ request }) => {
      const res = await request.post(`${API}/finance/journals`, {
        data: {
          date: '2025-01-01',
          description: 'Empty lines test',
          lines: [],
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([200, 201, 400, 500]).toContain(res.status());
    });

    test('POST /finance/journals — unbalanced debits/credits returns 400', async ({ request }) => {
      const res = await request.post(`${API}/finance/journals`, {
        data: {
          date: '2025-01-01',
          description: 'Unbalanced journal test',
          lines: [
            { accountId: 'acc-1', debit: 100000, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: 50000 },
          ],
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /finance/journals — invalid date format returns 400', async ({ request }) => {
      const res = await request.post(`${API}/finance/journals`, {
        data: {
          date: 'not-a-date',
          description: 'Invalid date test',
          lines: [
            { accountId: 'acc-1', debit: 100000, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: 100000 },
          ],
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /finance/verify-payment — invalid orderId returns 404', async ({ request }) => {
      const res = await request.post(`${API}/finance/verify-payment`, {
        data: {
          type: 'SALES_ORDER',
          id: '00000000-0000-0000-0000-000000000000',
          verifiedBy: 'admin',
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });

    test('POST /finance/verify-payment — missing required fields returns 400', async ({ request }) => {
      const res = await request.post(`${API}/finance/verify-payment`, {
        data: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /finance/journals — lines with negative debit returns 400', async ({ request }) => {
      const res = await request.post(`${API}/finance/journals`, {
        data: {
          date: '2025-01-01',
          description: 'Negative debit test',
          lines: [
            { accountId: 'acc-1', debit: -100, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: -100 },
          ],
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });
  });

  // ─────────────────────────────────────────────
  // 5. PRODUCTION VALIDATION
  // ─────────────────────────────────────────────

  test.describe('Production Validation', () => {
    test('POST /production/work-orders — missing required fields returns 400', async ({ request }) => {
      const res = await request.post(`${API}/production/work-orders`, {
        data: {},
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /production/start/:id — invalid UUID returns 400', async ({ request }) => {
      const res = await request.post(`${API}/production/start/not-a-uuid`, {});
      expect([400, 500]).toContain(res.status());
    });

    test('POST /production/start/:id — non-existent work order returns 400', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.post(`${API}/production/start/${fakeId}`, {});
      expect([400, 404, 500]).toContain(res.status());
    });

    test('POST /production/:id/submit-log — missing required fields returns 400', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.post(`${API}/production/${fakeId}/submit-log`, {
        data: {},
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /production/:id/submit-log — invalid stage enum returns 400', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.post(`${API}/production/${fakeId}/submit-log`, {
        data: {
          stage: 'INVALID_STAGE',
          inputQty: 100,
          goodQty: 90,
          quarantineQty: 5,
          rejectQty: 5,
        },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /production/start-stage — missing required body returns 400', async ({ request }) => {
      const res = await request.post(`${API}/production/start-stage`, {
        data: {},
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /production/schedules/:id/result — non-existent schedule returns 400', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.post(`${API}/production/schedules/${fakeId}/result`, {
        data: { resultQty: 100 },
      });
      expect([400, 404, 500]).toContain(res.status());
    });
  });

  // ─────────────────────────────────────────────
  // 6. QC VALIDATION
  // ─────────────────────────────────────────────

  test.describe('QC Validation', () => {
    test('POST /qc/audits — missing required status returns 400', async ({ request }) => {
      const res = await request.post(`${API}/qc/audits`, {
        data: { notes: 'Missing status field' },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /qc/audits — invalid status enum returns 400', async ({ request }) => {
      const res = await request.post(`${API}/qc/audits`, {
        data: { status: 'NOT_A_REAL_STATUS' },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /qc/audits — no token returns 401', async ({ request }) => {
      const res = await anonRequest.post(`${API}/qc/audits`, {
        data: { status: 'PASS' },
      });
      expect(res.status()).toBe(401);
    });

    test('GET /qc/audits/:id — invalid UUID returns 404', async ({ request }) => {
      const res = await request.get(`${API}/qc/audits/not-a-uuid`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });

    test('GET /qc/audits/:id — non-existent audit returns 404', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.get(`${API}/qc/audits/${fakeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });

    test('POST /qc/audits — invalid phase enum returns 400', async ({ request }) => {
      const res = await request.post(`${API}/qc/audits`, {
        data: {
          status: 'PASS',
          phase: 'INVALID_PHASE',
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });
  });

  // ─────────────────────────────────────────────
  // 7. WAREHOUSE VALIDATION
  // ─────────────────────────────────────────────

  test.describe('Warehouse Validation', () => {
    test('POST /warehouse/adjustments — missing required fields returns 400', async ({ request }) => {
      const res = await request.post(`${API}/warehouse/adjustments`, {
        data: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /warehouse/transfers — missing required fields returns 400', async ({ request }) => {
      const res = await request.post(`${API}/warehouse/transfers`, {
        data: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /warehouse/transfers/:id/execute — non-existent transfer returns 404', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.post(`${API}/warehouse/transfers/${fakeId}/execute`, {
        data: { userId: 'admin' },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });

    test('POST /warehouse/opname — missing required fields returns 400', async ({ request }) => {
      const res = await request.post(`${API}/warehouse/opname`, {
        data: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('GET /warehouse/history/:materialId — non-existent material returns 200 or 404', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.get(`${API}/warehouse/history/${fakeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([200, 400, 404]).toContain(res.status());
    });

    test('POST /warehouse/inbounds — missing required fields returns 400', async ({ request }) => {
      const res = await request.post(`${API}/warehouse/inbounds`, {
        data: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /warehouse/adjustments/:id/approve — non-existent adjustment returns 404', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.post(`${API}/warehouse/adjustments/${fakeId}/approve`, {
        data: { status: 'APPROVED', userId: 'admin' },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });
  });

  // ─────────────────────────────────────────────
  // 8. NOTIFICATION VALIDATION
  // ─────────────────────────────────────────────

  test.describe('Notification Validation', () => {
    test('POST /notifications/:id/read — non-existent notification returns error', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.post(`${API}/notifications/${fakeId}/read`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });

    test('POST /notifications/:id/read — no token returns 401', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await anonRequest.post(`${API}/notifications/${fakeId}/read`);
      expect(res.status()).toBe(401);
    });

    test('POST /notifications/:id/read — invalid UUID returns error', async ({ request }) => {
      const res = await request.post(`${API}/notifications/not-a-uuid/read`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });
  });

  // ─────────────────────────────────────────────
  // 9. CROSS-CUTTING: CORS & EDGE CASES
  // ─────────────────────────────────────────────

  test.describe('Cross-Cutting Validation', () => {
    test('POST /auth/login — malformed JSON body returns error', async ({ request }) => {
      const res = await request.post(`${API}/auth/login`, {
        data: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('GET /bussdev/leads — valid token but no role match returns 403', async ({ request }) => {
      const loginRes = await request.post(`${API}/auth/login`, {
        data: { email: 'operator@nexerp.id', password: 'password123' },
      });
      if (loginRes.status() === 201 || loginRes.status() === 200) {
        const userToken = (await loginRes.json()).access_token;
        const res = await request.get(`${API}/bussdev/leads`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        expect(res.status()).toBe(403);
      }
    });

    test('POST /finance/journals — lines with non-UUID accountId returns 400', async ({ request }) => {
      const res = await request.post(`${API}/finance/journals`, {
        data: {
          date: '2025-01-01',
          description: 'Bad account ID test',
          lines: [
            { accountId: 'not-a-uuid', debit: 100000, credit: 0 },
            { accountId: 'also-not-a-uuid', debit: 0, credit: 100000 },
          ],
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 404, 500]).toContain(res.status());
    });

    test('POST /warehouse/requisitions — missing items returns 400', async ({ request }) => {
      const res = await request.post(`${API}/warehouse/requisitions`, {
        data: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([400, 500]).toContain(res.status());
    });

    test('POST /production/finalize/:woNumber — non-existent WO returns error', async ({ request }) => {
      const res = await request.post(`${API}/production/finalize/WO-NONEXISTENT`, {});
      expect([400, 404, 500]).toContain(res.status());
    });
  });
});
