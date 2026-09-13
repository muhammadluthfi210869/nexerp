// Wave 4 / D3 — AlertEngineService unit tests.
//
// Mirrors the crm/__tests__/kpi.service.spec.ts pattern: jest with
// mocked PrismaService. Real YAML load via the bundled alert-rules.yaml
// in the same dir (loaded at module init via path.join(__dirname, ...)).

import { AlertEngineService } from '@/modules/decision-support/alert-engine.service';

describe('AlertEngineService', () => {
  let service: AlertEngineService;
  const prismaMock: any = {
    materialItem: { findMany: jest.fn() },
    purchaseOrder: { findMany: jest.fn() },
    invoice: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AlertEngineService(prismaMock);
    service.onModuleInit();
    // Default: empty results → no alerts fire
    prismaMock.materialItem.findMany.mockResolvedValue([]);
    prismaMock.purchaseOrder.findMany.mockResolvedValue([]);
    prismaMock.invoice.findMany.mockResolvedValue([]);
  });

  it('loads all 5 default rules from alert-rules.yaml', () => {
    const rules = service.listRules();
    expect(rules.length).toBe(5);
    const ids = rules.map((r) => r.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'low-stock',
        'overdue-po',
        'blocked-approval',
        'kpi-decline',
        'high-value-pending',
      ]),
    );
  });

  it('each loaded rule has the required fields populated', () => {
    const rules = service.listRules();
    for (const r of rules) {
      expect(r.id).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.metric).toBeTruthy();
      expect(r.comparator).toBeTruthy();
      expect(r.severity).toBeTruthy();
      expect(typeof r.threshold).toBe('number');
      expect(Array.isArray(r.recipients)).toBe(true);
      expect(typeof r.enabled).toBe('boolean');
    }
  });

  it('setRuleEnabled toggles rule + returns false on unknown rule', () => {
    expect(service.setRuleEnabled('low-stock', false)).toBe(true);
    const rules = service.listRules();
    const low = rules.find((r) => r.id === 'low-stock');
    expect(low?.enabled).toBe(false);
    expect(service.setRuleEnabled('does-not-exist', true)).toBe(false);
  });

  it('evaluateAll returns [] when all rules disabled', async () => {
    service.setRuleEnabled('low-stock', false);
    service.setRuleEnabled('overdue-po', false);
    service.setRuleEnabled('blocked-approval', false);
    service.setRuleEnabled('kpi-decline', false);
    service.setRuleEnabled('high-value-pending', false);
    const alerts = await service.evaluateAll();
    expect(alerts).toEqual([]);
  });

  it('evalBlockedApproval returns alert when PENDING_APPROVAL PO > 3 days exists', async () => {
    const staleRows = [
      {
        id: 'po-stale-1',
        poNumber: 'PO-OLD-001',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'po-stale-2',
        poNumber: 'PO-OLD-002',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ];
    // Two PO rules call findMany (overdue-po + blocked-approval).
    // Return stale rows for both.
    prismaMock.purchaseOrder.findMany.mockResolvedValue(staleRows);
    const alerts = await service.evaluateAll();
    const blocked = alerts.find((a) => a.ruleId === 'blocked-approval');
    expect(blocked).toBeDefined();
    expect(blocked?.severity).toBe('HIGH');
    expect(blocked?.observedValue).toBe(2);
    expect(blocked?.contextRefs[0].entityType).toBe('PurchaseOrder');
  });

  it('evalLowStock returns alert when reorderPoint breach exists', async () => {
    prismaMock.materialItem.findMany.mockResolvedValue([
      {
        id: 'mat-1',
        code: 'RAW-001',
        name: 'Test Material',
        stockQty: { toString: () => '5' },
        reorderPoint: { toString: () => '10' },
      },
    ]);
    const alerts = await service.evaluateAll();
    const low = alerts.find((a) => a.ruleId === 'low-stock');
    expect(low).toBeDefined();
    expect(low?.observedValue).toBe(1);
  });

  it('evalHighValuePending returns alert when invoice > 100M unpaid', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        invoiceNumber: 'INV-HV-001',
        amountDue: { toString: () => '150000000' },
      },
    ]);
    const alerts = await service.evaluateAll();
    const hv = alerts.find((a) => a.ruleId === 'high-value-pending');
    expect(hv).toBeDefined();
    expect(hv?.severity).toBe('CRITICAL');
  });

  it('evaluateAll uses 60s cache — second call within window hits the same path', async () => {
    await service.evaluateAll();
    const callsAfterFirst = prismaMock.purchaseOrder.findMany.mock.calls.length;
    await service.evaluateAll();
    const callsAfterSecond = prismaMock.purchaseOrder.findMany.mock.calls.length;
    expect(callsAfterSecond).toBe(callsAfterFirst);
  });

  it('state.transition event busts the cache', async () => {
    await service.evaluateAll();
    const callsAfterFirst = prismaMock.purchaseOrder.findMany.mock.calls.length;
    service.onTransition();
    await service.evaluateAll();
    const callsAfterSecond = prismaMock.purchaseOrder.findMany.mock.calls.length;
    expect(callsAfterSecond).toBeGreaterThan(callsAfterFirst);
  });
});