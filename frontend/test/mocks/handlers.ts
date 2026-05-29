import { http, HttpResponse } from 'msw';

const API_BASE = '/api';

export const handlers = [
  // Bussdev - Dashboard
  http.get(`${API_BASE}/bussdev/dashboard`, () => {
    return HttpResponse.json({
      overview: {
        totalLeads: 150,
        contactedLeads: 89,
        sampleProcess: 45,
        dpReceived: 23,
        dealConfirmed: 12,
        repeatOrder: 8,
        contactRate: '59.3%',
        sampleRate: '50.6%',
        dpRate: '51.1%',
        dealRate: '52.2%',
        retentionRate: '5.3%',
      },
      revenuePipeline: {
        totalPipelineValue: 8500000000,
        potentialSample: 3500000000,
        potentialDeal: 4200000000,
        confirmedDeal: 1800000000,
        repeatOrderValue: 950000000,
      },
      activityPerformance: {
        followUpToday: 12,
        avgResponse: 45,
        activeLeads: 98,
      },
      criticalAlerts: {
        unfollowedLeads: 5,
        stuckSamples: 3,
        stuckNego: 2,
        atRiskClients: 1,
      },
      bdPerformance: [],
      lostChurn: [],
      activityStreams: [],
    });
  }),

  // Bussdev - Leads
  http.get(`${API_BASE}/bussdev/leads`, () => {
    return HttpResponse.json([
      {
        id: '1',
        clientName: 'PT Client A',
        brandName: 'Brand A',
        status: 'NEGOTIATION',
        estimatedValue: 500000000,
        pic: { name: 'Staff A' },
        activities: [{ notes: 'Last call', createdAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        clientName: 'PT Client B',
        brandName: 'Brand B',
        status: 'NEW_LEAD',
        estimatedValue: 250000000,
        pic: { name: 'Staff B' },
        activities: [],
        createdAt: new Date().toISOString(),
      },
    ]);
  }),

  // Bussdev - Single lead balance
  http.get(`${API_BASE}/bussdev/lead/:id/balance`, ({ params }) => {
    return HttpResponse.json({
      totalEstimated: 500000000,
      totalPaid: 250000000,
      balance: 250000000,
      percentagePaid: 50,
    });
  }),

  // Bussdev - Activity stream
  http.get(`${API_BASE}/bussdev/lead/:id/activity-stream`, () => {
    return HttpResponse.json([
      {
        id: 'act-1',
        senderDivision: 'BD',
        eventType: 'STATE_CHANGE',
        notes: 'Lead created',
        createdAt: new Date().toISOString(),
        loggedBy: 'SYSTEM',
      },
    ]);
  }),

  // Bussdev - Staffs
  http.get(`${API_BASE}/bussdev/staffs`, () => {
    return HttpResponse.json([
      { id: 's1', name: 'Staff A', userId: 'u1' },
      { id: 's2', name: 'Staff B', userId: 'u2' },
    ]);
  }),

  // Bussdev - Pipeline V2
  http.get(`${API_BASE}/bussdev/pipeline-v2/leads`, () => {
    return HttpResponse.json([
      {
        id: '1',
        clientName: 'Client A',
        status: 'NEGOTIATION',
        slaDays: 5,
        estimatedValue: 500000000,
      },
    ]);
  }),

  // Bussdev - Create lead
  http.post(`${API_BASE}/bussdev/lead`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'new-lead-1',
      status: 'NEW_LEAD',
      ...(body as any),
    }, { status: 201 });
  }),

  // Bussdev - Analytics funnel
  http.get(`${API_BASE}/bussdev/analytics/funnel`, () => {
    return HttpResponse.json({
      counts: {
        totalLeads: 150,
        contactedLeads: 89,
        sampleProcess: 45,
        dpReceived: 23,
        dealConfirmed: 12,
        repeatOrder: 8,
      },
      conversion: {
        contactRate: '59.3%',
        sampleRate: '50.6%',
        dpRate: '51.1%',
        dealRate: '52.2%',
        retentionRate: '5.3%',
      },
    });
  }),

  // Bussdev - Analytics staff performance
  http.get(`${API_BASE}/bussdev/analytics/staff-performance`, () => {
    return HttpResponse.json([
      { name: 'Staff A', leads: 30, followUp: 25, crDeal: '20.0', actualRevenue: 500000000, status: 'SESUAI TARGET' },
    ]);
  }),

  // Auth
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      user: { id: 'u1', fullName: 'Admin', roles: ['SUPER_ADMIN'] },
    });
  }),

  // Generic 404 catch
  http.get(`${API_BASE}/bussdev/leads/stuck`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/bussdev/leads/group/:group`, ({ params }) => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/bussdev/samples`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/bussdev/analytics/lost-churn`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/bussdev/analytics/pipeline-granular`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/bussdev/analytics/:group`, ({ params }) => {
    return HttpResponse.json({});
  }),

  http.get(`${API_BASE}/bussdev/sales-returns`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/bussdev/pipeline-v2/audit`, () => {
    return HttpResponse.json([]);
  }),

  // Warehouse
  http.get(`${API_BASE}/warehouse/stats`, () => {
    return HttpResponse.json({
      capacity: { utility: '65.3', accuracy: 98.5, fifoScore: 8.2 },
      valuation: { total: '2.45', raw: '1.20', pack: '0.85', box: '0.25', label: '0.15' },
      turnover: { ratio: 6.5, health: 78 },
      risk: { deadStock: 1500000, criticalItems: 3, agingKarantina: 12.5 },
    });
  }),

  http.get(`${API_BASE}/warehouse/catalog`, () => {
    return HttpResponse.json([
      {
        id: 'mat-1',
        name: 'Vitamin C Powder',
        type: 'RAW_MATERIAL',
        unit: 'kg',
        stockQty: 500,
        category: { id: 'cat-1', name: 'Raw Materials' },
        inventories: [{ currentStock: 500, qcStatus: 'GOOD' }],
        valuations: [{ movingAveragePrice: 120000 }],
      },
      {
        id: 'mat-2',
        name: 'Plastic Bottle 250ml',
        type: 'PACKAGING',
        unit: 'pcs',
        stockQty: 10000,
        category: { id: 'cat-2', name: 'Packaging' },
        inventories: [{ currentStock: 10000, qcStatus: 'GOOD' }],
        valuations: [{ movingAveragePrice: 2500 }],
      },
    ]);
  }),

  http.get(`${API_BASE}/warehouse/inbounds`, () => {
    return HttpResponse.json([
      {
        id: 'inb-1',
        inboundNumber: 'GRN-001',
        status: 'PENDING',
        receivedAt: new Date().toISOString(),
        items: [
          { id: 'ii-1', materialId: 'mat-1', qtyActual: 100, material: { id: 'mat-1', name: 'Vitamin C Powder', unit: 'kg' } },
        ],
        po: { id: 'po-1', poNumber: 'PO-001', supplier: { name: 'PT Supplier A' } },
      },
    ]);
  }),

  http.get(`${API_BASE}/warehouse/audit`, () => {
    return HttpResponse.json({
      jalurA: { inbound: 15, karantina: 2, velocity: 5.0 },
      jalurB: { reqProd: 8, picking: 12, handover: 5, velocity: 4.0 },
      jalurC: { orderProc: 0, shipping: 0, delivered: 0, velocity: 0 },
      sensitiveMaterials: [],
      packagingStocks: [],
      soFulfillment: [],
      riskLoss: [],
      topRaw: [],
      topPack: [],
      productivity: [],
      recentLogs: [],
    });
  }),

  http.get(`${API_BASE}/warehouse/locations`, () => {
    return HttpResponse.json([
      { id: 'loc-1', name: 'Rack A1', capacity: 1000, currentUsage: 650, warehouseId: 'wh-1' },
      { id: 'loc-2', name: 'Rack B1', capacity: 800, currentUsage: 400, warehouseId: 'wh-1' },
    ]);
  }),

  // Master Data
  http.get(`${API_BASE}/master/customers`, () => {
    return HttpResponse.json([
      { id: 'cust-1', name: 'PT Customer A', email: 'a@customer.com', phone: '021-1234' },
      { id: 'cust-2', name: 'PT Customer B', email: 'b@customer.com', phone: '021-5678' },
    ]);
  }),

  http.get(`${API_BASE}/master/suppliers`, () => {
    return HttpResponse.json([
      { id: 'sup-1', name: 'PT Supplier A', performanceScore: 85 },
      { id: 'sup-2', name: 'PT Supplier B', performanceScore: 92 },
    ]);
  }),

  http.get(`${API_BASE}/master/categories`, () => {
    return HttpResponse.json([
      { id: 'cat-1', name: 'Raw Materials', type: 'GOODS' },
      { id: 'cat-2', name: 'Packaging', type: 'GOODS' },
      { id: 'cat-3', name: 'Supplier Category', type: 'SUPPLIER' },
    ]);
  }),

  http.get(`${API_BASE}/master/warehouses/active`, () => {
    return HttpResponse.json([
      { id: 'wh-1', name: 'Main Warehouse', status: 'ACTIVE' },
      { id: 'wh-2', name: 'Branch Warehouse', status: 'ACTIVE' },
    ]);
  }),

  http.get(`${API_BASE}/master/materials`, () => {
    return HttpResponse.json([
      { id: 'mat-1', name: 'Vitamin C Powder', type: 'RAW_MATERIAL', unit: 'kg', stockQty: 500, category: { id: 'cat-1', name: 'Raw Materials' } },
      { id: 'mat-2', name: 'Plastic Bottle 250ml', type: 'PACKAGING', unit: 'pcs', stockQty: 10000, category: { id: 'cat-2', name: 'Packaging' } },
    ]);
  }),

  // Finance - Accounts
  http.get(`${API_BASE}/finance/accounts`, () => {
    return HttpResponse.json([
      { id: '1110', code: '1110', name: 'Bank BCA (Operasional)', type: 'ASSET' },
      { id: '1201', code: '1201', name: 'Piutang Usaha', type: 'ASSET' },
      { id: '2101', code: '2101', name: 'Hutang Usaha', type: 'LIABILITY' },
      { id: '1402', code: '1402', name: 'Uang Muka Pembelian', type: 'ASSET' },
      { id: '4101', code: '4101', name: 'Pendapatan Maklon', type: 'REVENUE' },
      { id: '6201', code: '6201', name: 'Beban Gaji', type: 'EXPENSE' },
      { id: '2301', code: '2301', name: 'DP Produksi Klien', type: 'LIABILITY' },
    ]);
  }),

  // Finance - Journals
  http.get(`${API_BASE}/finance/journals`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE}/finance/journals`, async ({ request }) => {
    const body = await request.json() as any;
    const lines = body?.lines ?? [];
    const sumDebit = lines.reduce((sum: number, l: any) => sum + (Number(l.debit) || 0), 0);
    const sumCredit = lines.reduce((sum: number, l: any) => sum + (Number(l.credit) || 0), 0);
    if (Math.abs(sumDebit - sumCredit) > 0.01) {
      return HttpResponse.json({ message: 'Journal is not balanced' }, { status: 400 });
    }
    return HttpResponse.json({ id: 'journal-1', ...body }, { status: 201 });
  }),

  // Finance - Cash
  http.post(`${API_BASE}/finance/cash/receive`, () => {
    return HttpResponse.json({ id: 'cash-in-001', status: 'posted' }, { status: 201 });
  }),

  http.post(`${API_BASE}/finance/cash/disburse`, () => {
    return HttpResponse.json({ id: 'cash-out-001', status: 'posted' }, { status: 201 });
  }),

  // Finance - Dashboard
  http.get(`${API_BASE}/finance/dashboard`, () => {
    return HttpResponse.json({
      totalRevenue: 1250000000,
      totalExpenses: 875000000,
      netProfit: 375000000,
      cashBalance: 450000000,
      receivables: 320000000,
      payables: 180000000,
      journalCount: 156,
      pendingInvoices: 8,
    });
  }),

  // Finance - Trial Balance
  http.get(`${API_BASE}/finance/reports/trial-balance`, () => {
    return HttpResponse.json({
      accounts: [
        { code: '1110', name: 'Bank BCA', debit: 450000000, credit: 0 },
        { code: '1201', name: 'Piutang Usaha', debit: 320000000, credit: 0 },
        { code: '4101', name: 'Pendapatan Maklon', debit: 0, credit: 1250000000 },
        { code: '6201', name: 'Beban Gaji', debit: 425000000, credit: 0 },
      ],
      totalDebit: 1195000000,
      totalCredit: 1250000000,
    });
  }),

  // Finance - Invoices
  http.get(`${API_BASE}/finance/invoices`, () => {
    return HttpResponse.json([
      { id: 'INV-001', clientId: 'c1', amount: 50000000, status: 'PAID' },
      { id: 'INV-002', clientId: 'c2', amount: 75000000, status: 'PENDING' },
    ]);
  }),

  // Production - Dashboard
  http.get(`${API_BASE}/production/analytics/dashboard`, () => {
    return HttpResponse.json({
      activeWorkOrders: 12,
      completedToday: 5,
      machinesOnline: 8,
      totalMachines: 10,
      oeePercentage: 82.5,
      pendingQC: 3,
      producedToday: 15000,
    });
  }),

  // Production - Work Orders
  http.get(`${API_BASE}/production/work-orders`, () => {
    return HttpResponse.json([
      {
        id: 'wo-1',
        woNumber: 'WO-2026-001',
        productName: 'Serum Vitamin C',
        status: 'IN_PROGRESS',
        targetQty: 5000,
        currentQty: 2500,
        assignedMachine: 'MIX-01',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'wo-2',
        woNumber: 'WO-2026-002',
        productName: 'Moisturizer Aloe',
        status: 'PENDING',
        targetQty: 10000,
        currentQty: 0,
        assignedMachine: 'FILL-02',
        createdAt: new Date().toISOString(),
      },
    ]);
  }),

  // Production - Machines
  http.get(`${API_BASE}/production/machines`, () => {
    return HttpResponse.json([
      { id: 'm1', name: 'MIX-01', category: 'MIXER', status: 'RUNNING', oee: 85.2 },
      { id: 'm2', name: 'FILL-02', category: 'FILLER', status: 'IDLE', oee: 0 },
      { id: 'm3', name: 'PACK-03', category: 'PACKAGING', status: 'MAINTENANCE', oee: 0 },
    ]);
  }),

  // Production - Schedules
  http.get(`${API_BASE}/production/schedules`, () => {
    return HttpResponse.json([
      {
        id: 'sch-1',
        workOrderId: 'wo-1',
        stage: 'MIXING',
        machineId: 'm1',
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'IN_PROGRESS',
      },
    ]);
  }),

  // Production - Active Work Orders
  http.get(`${API_BASE}/production/active`, () => {
    return HttpResponse.json([
      {
        id: 'wo-1',
        woNumber: 'WO-2026-001',
        productName: 'Serum Vitamin C',
        status: 'IN_PROGRESS',
        currentStage: 'MIXING',
        targetQty: 5000,
        currentQty: 2500,
      },
    ]);
  }),

  // RnD - Dashboard
  http.get(`${API_BASE}/rnd/dashboard`, () => {
    return HttpResponse.json({
      totalSamples: 45,
      activeSamples: 12,
      completedSamples: 28,
      pendingReview: 5,
      formulasCount: 18,
      inboxCount: 3,
    });
  }),

  // RnD - Samples
  http.get(`${API_BASE}/rnd/samples`, () => {
    return HttpResponse.json([
      {
        id: 's1',
        sampleNumber: 'SMP-2026-001',
        productName: 'Brightening Serum',
        clientName: 'PT Beauty Corp',
        status: 'IN_PROGRESS',
        currentStage: 'FORMULATION',
        createdAt: new Date().toISOString(),
      },
      {
        id: 's2',
        sampleNumber: 'SMP-2026-002',
        productName: 'Anti-Aging Cream',
        clientName: 'PT SkinCare',
        status: 'PENDING_REVIEW',
        currentStage: 'LAB_TEST',
        createdAt: new Date().toISOString(),
      },
    ]);
  }),

  // RnD - Formulas
  http.get(`${API_BASE}/rnd/formulas`, () => {
    return HttpResponse.json([
      { id: 'f1', code: 'F-001', name: 'Vitamin C Serum Base', version: 3, status: 'ACTIVE' },
      { id: 'f2', code: 'F-002', name: 'Aloe Moisturizer Base', version: 1, status: 'DRAFT' },
    ]);
  }),

  // RnD - Inbox
  http.get(`${API_BASE}/rnd/inbox`, () => {
    return HttpResponse.json([
      {
        id: 'inb-1',
        sampleNumber: 'SMP-2026-003',
        clientName: 'PT NewBrand',
        productName: 'Sunscreen SPF50',
        status: 'NEW_REQUEST',
        createdAt: new Date().toISOString(),
      },
    ]);
  }),

  // RnD - Pipeline
  http.get(`${API_BASE}/rnd/pipeline`, () => {
    return HttpResponse.json({
      stages: [
        { name: 'NEW_REQUEST', count: 3 },
        { name: 'FORMULATION', count: 5 },
        { name: 'LAB_TEST', count: 4 },
        { name: 'CLIENT_REVIEW', count: 2 },
        { name: 'APPROVED', count: 8 },
      ],
      totalSamples: 22,
    });
  }),
];
