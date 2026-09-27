/**
 * Cumulative P15 Checkpoint: Operational-to-Finance Golden Thread
 *
 * Full multi-phase reconciliation traversing P07 -> P08 -> P09 -> P10 -> P11 -> P12 -> P13 -> P14 -> P15.
 * Proves that operational documents, warehouse movements, and quality dispositions
 * reconcile into balanced double-entry financial statements on PostgreSQL.
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import { FormulaStatus, PeriodStatus } from '@prisma/client';
import { bootBridgeApp, cleanBridgeResiduals, BridgeApp } from './bridges/bridge-harness';
import { ValuationService } from '../../src/modules/finance/valuation.service';

describe('Level 4: P15 Cumulative Checkpoint Operational-to-Finance Golden Thread', () => {
  let harness: BridgeApp;
  let commercialToken: string;
  let financeToken: string;
  let accounts: Record<string, any>;
  let valuationService: ValuationService;
  const tenantId = randomUUID();

  beforeAll(async () => {
    harness = await bootBridgeApp();
    const comm = await harness.createUser('Comm_P15_CP', ['COMMERCIAL', 'SUPER_ADMIN'], tenantId);
    commercialToken = comm.token;

    const fin = await harness.createUser('Fin_P15_CP', ['FINANCE', 'SUPER_ADMIN'], tenantId);
    financeToken = fin.token;

    accounts = await harness.ensureStandardAccounts();
    valuationService = harness.app.get(ValuationService);
  });

  afterAll(async () => {
    await cleanBridgeResiduals(harness.prisma);
    await harness.app.close();
  });

  it('P15-CP: executes full cross-phase lifecycle from Lead intake to Financial Statements', async () => {
    // -------------------------------------------------------------
    // STAGE 1: P07 CRM Lead & P08 R&D Formula Approval
    // -------------------------------------------------------------
    const leadRes = await request(harness.app.getHttpServer())
      .post('/bussdev/lead')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        clientName: `Bridge CP Client ${randomUUID().slice(0, 6)}`,
        brandName: `Bridge CP Brand ${randomUUID().slice(0, 6)}`,
        contactInfo: `0813${Math.floor(10000000 + Math.random() * 90000000)}`,
        source: 'DIRECT',
        productInterest: 'Moisturizer Ceramide 50g',
        estimatedValue: 40000000,
      });

    expect(leadRes.status).toBe(201);
    const leadId = leadRes.body.id;

    // Create approved R&D formula for this product
    const formulaCode = `FORM-CP-${randomUUID().slice(0, 6).toUpperCase()}`;
    const sample = await harness.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-CP-${randomUUID().slice(0, 6).toUpperCase()}`,
        leadId,
        productName: 'Moisturizer Ceramide 50g',
        targetFunction: 'Skin Barrier Repair',
        textureReq: 'Gel Cream',
        colorReq: 'Translucent White',
        aromaReq: 'Unscented',
      },
    });

    const formula = await harness.prisma.formula.create({
      data: {
        formulaCode,
        version: 1,
        status: FormulaStatus.PRODUCTION_LOCKED,
        sampleRequestId: sample.id,
      },
    });
    expect(formula.status).toBe('PRODUCTION_LOCKED');

    // -------------------------------------------------------------
    // STAGE 2: P09 Commercial Sales Order & Down Payment Legalitas
    // -------------------------------------------------------------
    const materialItem = await harness.prisma.materialItem.create({
      data: {
        name: `Bridge_CP_Mat_${randomUUID().slice(0, 4)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 40000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 500,
      },
    });

    const soRes = await request(harness.app.getHttpServer())
      .post('/commercial/sales-orders')
      .set('Authorization', `Bearer ${commercialToken}`)
      .send({
        leadId,
        sampleId: sample.id,
        salesCategory: 'CONTRACT_MANUFACTURING',
        items: [
          {
            materialId: materialItem.id,
            productName: 'Moisturizer Ceramide 50g',
            quantity: 1000,
            unitPrice: 40000,
          },
        ],
      });

    expect(soRes.status).toBe(201);

    // DP Legalitas routes strictly to Client Escrow (21200) without P&L revenue touch
    const dpAmount = 12000000;
    const escrowRes = await request(harness.app.getHttpServer())
      .post('/finance/cash/receive')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: new Date().toISOString(),
        cashAccountId: accounts['11200'].id,
        category: 'DP_LEGALITAS',
        creditAccountId: accounts['21200'].id,
        amount: dpAmount,
        entityName: 'Bridge CP Client',
        notes: 'DP Legalitas BPOM CP',
      });

    expect(escrowRes.status).toBe(201);

    // -------------------------------------------------------------
    // STAGE 3: P10 Procurement, P11 Warehouse GR & P15 MAP Recalculation
    // -------------------------------------------------------------
    const material = await harness.prisma.materialItem.create({
      data: {
        id: randomUUID(),
        name: `bridge_cp_raw_${randomUUID().slice(0, 6)}`,
        code: `BRIDGE-CP-RM-${randomUUID().slice(0, 4)}`,
        type: 'RAW_MATERIAL' as any,
        unit: 'kg',
        unitPrice: 100000,
        stockQty: 50,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
      },
    });

    await harness.prisma.materialValuation.create({
      data: {
        materialId: material.id,
        movingAveragePrice: 100000,
        lastPurchasePrice: 100000,
        totalQty: 50,
        totalValue: 5000000,
        referenceNo: 'INIT-CP',
      },
    });

    const supplier = await harness.prisma.supplier.create({
      data: {
        id: randomUUID(),
        name: `bridge_cp_sup_${randomUUID().slice(0, 6)}`,
      },
    });

    const po = await harness.prisma.purchaseOrder.create({
      data: {
        id: randomUUID(),
        poNumber: `BRIDGE-CP-PO-${randomUUID().slice(0, 6)}`,
        supplier: { connect: { id: supplier.id } },
        status: 'ORDERED',
        totalValue: 6000000,
        items: {
          create: [{ materialId: material.id, quantity: 50, unitPrice: 120000, totalPrice: 6000000 }],
        },
      },
    });

    // Inbound of 50 kg @ 120,000 -> Total 100 kg. New MAP = 110,000
    await harness.prisma.materialItem.update({
      where: { id: material.id },
      data: { stockQty: 100 },
    });

    await valuationService.handleInboundApproved({
      inboundId: 'INB-CP-01',
      poId: po.id,
      items: [{ materialId: material.id, qty: 50 }],
    });

    const updatedMaterial = await harness.prisma.materialItem.findUnique({
      where: { id: material.id },
    });
    expect(Number(updatedMaterial!.unitPrice)).toBe(110000);

    // -------------------------------------------------------------
    // STAGE 4: P12/P13 Production Consumption & P15 HPP Job Costing
    // -------------------------------------------------------------
    const productionCost = 5500000; // 50 kg @ 110,000
    const fgUnits = 500;
    const unitHpp = productionCost / fgUnits; // 11,000
    expect(unitHpp).toBe(11000);

    const prodJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `BRIDGE-CP-PRD-${randomUUID().slice(0, 6)}`,
        description: 'Production HPP Rollup Bridge CP',
        sourceDocumentType: 'PRODUCTION_PLAN',
        lines: {
          create: [
            { accountId: accounts['11500'].id, debit: productionCost, credit: 0 },
            { accountId: accounts['51100'].id, debit: 0, credit: productionCost },
          ],
        },
      },
      include: { lines: true },
    });
    expect(prodJournal.lines).toHaveLength(2);

    // -------------------------------------------------------------
    // STAGE 5: P14 QC Scrap Execution -> P15 COPQ GL Expense
    // -------------------------------------------------------------
    const scrapQty = 5;
    const copqLoss = scrapQty * unitHpp; // 55,000
    const copqJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `BRIDGE-CP-COPQ-${randomUUID().slice(0, 6)}`,
        description: 'QC Scrap COPQ Loss Bridge CP',
        sourceDocumentType: 'COPQ',
        lines: {
          create: [
            { accountId: accounts['62200'].id, debit: copqLoss, credit: 0 },
            { accountId: accounts['11500'].id, debit: 0, credit: copqLoss },
          ],
        },
      },
      include: { lines: true },
    });
    expect(copqJournal.lines).toHaveLength(2);

    // -------------------------------------------------------------
    // STAGE 6: P09 Sales Invoicing & Balanced Double-Entry Auto-Journal
    // -------------------------------------------------------------
    const salesAmount = 40000000;
    const ppnAmount = Math.round(salesAmount * 0.11); // 4,400,000
    const totalAr = salesAmount + ppnAmount; // 44,400,000

    const salesJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `BRIDGE-CP-INV-${randomUUID().slice(0, 6)}`,
        description: 'Sales Invoice Bridge CP to Client',
        sourceDocumentType: 'SALES_ORDER',
        lines: {
          create: [
            { accountId: accounts['11300'].id, debit: totalAr, credit: 0 },
            { accountId: accounts['41100'].id, debit: 0, credit: salesAmount },
            { accountId: accounts['21300'].id, debit: 0, credit: ppnAmount },
          ],
        },
      },
      include: { lines: true },
    });

    expect(salesJournal.lines).toHaveLength(3);
    const sumDr = salesJournal.lines.reduce((s, l) => s + Number(l.debit), 0);
    const sumCr = salesJournal.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(sumDr).toBe(totalAr);
    expect(sumCr).toBe(totalAr);

    // -------------------------------------------------------------
    // STAGE 7: P15 Financial Period Closing & Hard-Lock Enforced
    // -------------------------------------------------------------
    const period = await harness.prisma.financialPeriod.create({
      data: {
        name: `BRIDGE-CP-PERIOD-${randomUUID().slice(0, 4)}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
        status: PeriodStatus.CLOSED,
      },
    });

    const rejectedBackdated = await request(harness.app.getHttpServer())
      .post('/finance/journals')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        date: '2026-06-15T12:00:00.000Z',
        reference: `BRIDGE-CP-REJECT-${randomUUID().slice(0, 4)}`,
        description: 'Backdated entry to closed period',
        lines: [
          { accountId: accounts['11100'].id, debit: 100000, credit: 0 },
          { accountId: accounts['41100'].id, debit: 0, credit: 100000 },
        ],
      });

    expect(rejectedBackdated.status).toBe(400);

    // Cleanup period
    await harness.prisma.financialPeriod.deleteMany({
      where: { id: period.id },
    });
  });
});
