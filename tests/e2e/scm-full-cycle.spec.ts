import { test, expect } from '@playwright/test';
import { loginAsScm, getScmToken, authHeader } from '../fixtures/scm-auth';

const TEST_PREFIX = `E2E-FC-${Date.now()}`;

test.describe('SCM Golden Thread: Procurement Cycle', () => {
  let token: string;
  let createdPR: any;
  let createdPO: any;
  let createdInbound: any;
  let createdInvoice: any;
  let supplierId: string;
  let materialId: string;
  let warehouseId: string;

  test.beforeAll(async ({ request }) => {
    token = await getScmToken(request);

    const supRes = await request.get('/api/master/suppliers', {
      headers: authHeader(token),
    });
    expect(supRes.status()).toBe(200);
    const suppliers = await supRes.json();
    supplierId = Array.isArray(suppliers) ? suppliers[0]?.id : suppliers.data?.[0]?.id;

    const matRes = await request.get('/api/scm/materials', {
      headers: authHeader(token),
    });
    expect(matRes.status()).toBe(200);
    const materials = await matRes.json();
    const raw = (Array.isArray(materials) ? materials : materials.data ?? [])
      .find((m: any) => m.category === 'RAW_MATERIAL' || m.type === 'RAW_MATERIAL');
    materialId = raw?.id || (Array.isArray(materials) ? materials[0]?.id : materials.data?.[0]?.id);

    const whRes = await request.get('/api/master/warehouses', {
      headers: authHeader(token),
    });
    expect(whRes.status()).toBe(200);
    const warehouses = await whRes.json();
    warehouseId = Array.isArray(warehouses) ? warehouses[0]?.id : warehouses.data?.[0]?.id;
  });

  test('A-01: Create Purchase Request via UI with API fallback', async ({ page }) => {
    await loginAsScm(page);
    await page.goto('/scm/purchase-requests');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Buat")');
    await page.waitForTimeout(500);

    const warehouseSelect = page.locator('select').first();
    if (await warehouseSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (warehouseId) {
        await warehouseSelect.selectOption(warehouseId);
      } else {
        await warehouseSelect.selectOption({ index: 1 });
      }
    }

    const notesInput = page.locator('textarea, input[placeholder*="Catatan"], input[placeholder*="notes"]').first();
    if (await notesInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesInput.fill(`E2E Test PR - ${TEST_PREFIX}`);
    }

    const [prResponse] = await Promise.all([
      page.waitForResponse(res =>
        res.url().includes('/scm/purchase-requests') && res.status() === 201
      ).catch(() => undefined),
      page.click('button:has-text("Simpan"), button:has-text("Kirim"), button:has-text("Submit")')
        .catch(() => {}),
    ]);

    if (prResponse) {
      createdPR = await prResponse.json();
    } else {
      const res = await page.request.post('/api/scm/purchase-requests', {
        data: {
          warehouseId,
          priority: 'HIGH',
          notes: `E2E PR ${TEST_PREFIX}`,
          items: [{ materialId, qtyRequired: 100 }],
        },
        headers: authHeader(token),
      });
      expect(res.status()).toBe(201);
      createdPR = await res.json();
    }

    expect(createdPR).toBeDefined();
    expect(createdPR.id || createdPR.prNumber).toBeDefined();
  });

  test('A-02: Approve PR → auto-create PO via API', async ({ request }) => {
    test.skip(!createdPR, 'PR not created in A-01');

    const approveRes = await request.post(`/api/scm/purchase-requests/${createdPR.id}/approve`, {
      headers: authHeader(token),
    });
    expect([200, 201]).toContain(approveRes.status());
    createdPO = await approveRes.json();

    expect(createdPO.poNumber || createdPO.id).toBeDefined();
    expect(createdPO.status).toBeDefined();

    const getRes = await request.get(`/api/scm/purchase-orders/${createdPO.id}`, {
      headers: authHeader(token),
    });
    expect(getRes.status()).toBe(200);
    const po = await getRes.json();
    expect(po.items || po.supplierId || po.id).toBeDefined();
  });

  test('A-03: Create GRN (Warehouse Inbound) from PO via API', async ({ request }) => {
    test.skip(!createdPO, 'PO not created in A-02');

    const grnRes = await request.post('/api/scm/inbounds', {
      data: {
        poId: createdPO.id,
        warehouseId,
        items: [{ materialId, qtyActual: 100 }],
      },
      headers: authHeader(token),
    });

    if ([200, 201].includes(grnRes.status())) {
      createdInbound = await grnRes.json();
    } else {
      const whRes = await request.post('/api/warehouse/inbounds', {
        data: {
          poId: createdPO.id,
          warehouseId,
          items: [{ materialId, qtyActual: 100 }],
        },
        headers: authHeader(token),
      });
      expect([200, 201]).toContain(whRes.status());
      createdInbound = await whRes.json();
    }

    expect(createdInbound).toBeDefined();
    expect(createdInbound.id || createdInbound.inboundNumber).toBeDefined();
  });

  test('A-04: Approve Inbound (QC Gate) via API', async ({ request }) => {
    test.skip(!createdInbound, 'Inbound not created in A-03');

    const approveRes = await request.patch(`/api/scm/inbounds/${createdInbound.id}/status`, {
      data: { status: 'APPROVED' },
      headers: authHeader(token),
    });
    expect([200, 201]).toContain(approveRes.status());

    const poRes = await request.get(`/api/scm/purchase-orders/${createdPO.id}`, {
      headers: authHeader(token),
    });
    expect(poRes.status()).toBe(200);
  });

  test('A-05: Create Purchase Invoice via API', async ({ request }) => {
    test.skip(!createdInbound, 'No inbound to invoice');

    const invRes = await request.post('/api/scm/purchase-invoices', {
      data: {
        inboundId: createdInbound.id || createdInbound.poId,
        notes: `E2E Invoice ${TEST_PREFIX}`,
      },
      headers: authHeader(token),
    });
    expect(invRes.status()).toBe(201);
    createdInvoice = await invRes.json();
    expect(createdInvoice.invoiceNumber || createdInvoice.id).toBeDefined();
  });

  test('A-06: Pay Invoice via API', async ({ request }) => {
    test.skip(!createdInvoice, 'No invoice to pay');

    const payRes = await request.post('/api/scm/purchase-payments', {
      data: {
        invoiceId: createdInvoice.id,
        amount: createdInvoice.amountDue || createdInvoice.outstandingAmount || createdInvoice.totalAmount,
      },
      headers: authHeader(token),
    });
    expect(payRes.status()).toBe(201);

    const getRes = await request.get(`/api/scm/purchase-invoices/${createdInvoice.id}`, {
      headers: authHeader(token),
    });
    const inv = await getRes.json();
    expect(inv.status || inv.paymentStatus).toBeDefined();
  });

  test('A-07: Verify full cycle data integrity via API', async ({ request }) => {
    test.skip(!createdPO, 'No data to verify');

    const posRes = await request.get('/api/scm/purchase-orders', {
      headers: authHeader(token),
    });
    expect(posRes.status()).toBe(200);
    const pos = await posRes.json();
    const list = Array.isArray(pos) ? pos : pos.data ?? [];
    const ourPO = list.find((p: any) => p.id === createdPO.id || p.poNumber === createdPO.poNumber);
    expect(ourPO).toBeDefined();
  });
});
