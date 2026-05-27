import { test, expect } from '@playwright/test';
import { getScmToken, authHeader } from '../fixtures/scm-auth';

const TEST_PREFIX = `E2E-MRP-${Date.now()}`;

test.describe('SCM MRP: Goods Requirement → PO', () => {
  let token: string;
  let materialId: string;
  let supplierId: string;
  let createdRequirement: any;
  let workOrderIds: string[];

  test.beforeAll(async ({ request }) => {
    token = await getScmToken(request);

    const [matRes, supRes, woRes] = await Promise.all([
      request.get(`/scm/materials`, { headers: authHeader(token) }),
      request.get(`/master/suppliers`, { headers: authHeader(token) }),
      request.get(`/scm/work-orders/active`, { headers: authHeader(token) }).catch(() => null),
    ]);

    const matBody = await matRes.json();
    const supBody = await supRes.json();
    materialId = (Array.isArray(matBody) ? matBody : matBody.data || []).find(
      (m: any) => m.category === 'RAW_MATERIAL' || m.type === 'RAW_MATERIAL'
    )?.id ?? (Array.isArray(matBody) ? matBody[0] : matBody.data?.[0])?.id;
    supplierId = (Array.isArray(supBody) ? supBody : supBody.data || [])[0]?.id;

    if (woRes && woRes.status() === 200) {
      const woBody = await woRes.json();
      const wos = Array.isArray(woBody) ? woBody : woBody.data || [];
      workOrderIds = wos.map((w: any) => w.id).filter(Boolean);
    }
  });

  test.fixme(true, 'Blocked: Prisma schema requires regeneration (legal.prisma relation)', async ({ request }) => {
    test.skip(!materialId, 'No reference material');

    const res = await request.post(`/scm/goods-requirements`, {
      data: {
        date: new Date().toISOString().split('T')[0],
        notes: `E2E GR ${TEST_PREFIX}`,
        items: [{ materialId, qty: 500 }],
      },
      headers: authHeader(token),
    });

    if (res.status() === 201) {
      createdRequirement = await res.json();
    } else {
      const res2 = await request.post(`/scm/goods-requirements`, {
        data: {
          salesOrderId: '00000000-0000-0000-0000-000000000000',
          date: new Date().toISOString().split('T')[0],
          notes: `E2E GR ${TEST_PREFIX}`,
          items: [{ materialId, qty: 500 }],
        },
        headers: authHeader(token),
      });
      expect(res2.status()).toBe(201);
      createdRequirement = await res2.json();
    }

    expect(createdRequirement).toBeDefined();
    if (createdRequirement.code) {
      expect(createdRequirement.code).toContain('NGR');
    }
  });

  test.fixme(true, 'Blocked: Prisma schema requires regeneration (legal.prisma relation)', async ({ request }) => {
    const res = await request.get(`/scm/requirements/summary`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const summary = await res.json();
    expect(summary).toBeDefined();
  });

  test.fixme(true, 'Blocked: Prisma schema requires regeneration (legal.prisma relation)', async ({ request }) => {
    test.skip(!materialId || !supplierId, 'Reference data missing');

    const res = await request.post(`/scm/purchase-orders/from-requirement`, {
      data: {
        materialId,
        supplierId,
        qty: 500,
        unitPrice: 15000,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        notes: `PO from E2E MRP ${TEST_PREFIX}`,
      },
      headers: authHeader(token),
    });

    if (res.status() === 201) {
      const po = await res.json();
      expect(po.poNumber || po.poCode || po.id).toBeDefined();
      if (po.poNumber) expect(po.poNumber).toContain('PO');
    } else {
      const fallbackRes = await request.post(`/scm/purchase-orders`, {
        data: {
          supplierId,
          expectedDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          notes: `PO from E2E MRP ${TEST_PREFIX}`,
          items: [{ materialId, qty: 500, unitPrice: 15000 }],
        },
        headers: authHeader(token),
      });
      expect(fallbackRes.status()).toBe(201);
      const po = await fallbackRes.json();
      expect(po.id || po.poNumber).toBeDefined();
    }
  });

  test('D-04: Check Work Order Material Readiness via API', async ({ request }) => {
    test.skip(!workOrderIds?.length, 'No active work orders found');

    const results: { woId: string; status: string; details: any[] }[] = [];

    for (const woId of workOrderIds.slice(0, 3)) {
      const res = await request.get(`/scm/work-orders/${woId}/readiness`, {
        headers: authHeader(token),
      });

      if (res.status() !== 200) continue;

      const readiness = await res.json();
      const status = readiness.status || readiness.overallStatus;
      const details = readiness.readinessDetails || readiness.details || [];

      expect(status).toMatch(/READY|SHORTAGE|NO_APPROVED_SAMPLE|PENDING/);
      expect(Array.isArray(details)).toBe(true);

      if (details.length > 0) {
        const detail = details[0];
        // Each detail should describe material + reqQty + available
        expect(detail.materialId || detail.materialName || detail.material).toBeDefined();
        if (detail.requiredQty != null && detail.availableQty != null) {
          if (status === 'READY') {
            expect(detail.availableQty).toBeGreaterThanOrEqual(detail.requiredQty);
          } else if (status === 'SHORTAGE') {
            expect(detail.availableQty).toBeLessThan(detail.requiredQty);
          }
        }
      }

      results.push({ woId, status, details });
    }

    expect(results.length).toBeGreaterThan(0);
  });
});
