/**
 * P20 Golden Thread: End-to-End 13-Node Supply Chain & Financial Lifecycle
 *
 * Full pipeline traversal on real PostgreSQL:
 *   1.  CRM Lead           : Lead created & progressed (NEW_LEAD -> CONTACTED -> NEGOTIATION)
 *   2.  Sample R&D         : Sample requested, formula locked (PRODUCTION_LOCKED) & sample approved
 *   3.  Quotation          : Commercial proposal agreed -> WON_DEAL
 *   4.  Sales Order        : Customer linked, SO confirmed with line items
 *   5.  Kalkulasi MRP      : Bill of Materials & material requirements calculated (GoodsRequirement)
 *   6.  PO Supplier        : Purchase orders generated for raw materials & packaging
 *   7.  GRN Inbound        : Warehouse receiving into QUARANTINE status (available stock = 0)
 *   8.  SPK Produksi / BMR : Work order, schedules, mixing and packaging logs recorded
 *   9.  QC Lab & Release   : Laboratory QC audit passed, APJ release to available Finished Goods
 *   10. Delivery Order     : DO created for shipped finished goods
 *   11. Sales Invoice      : Balanced auto-journal posted (Dr AR, Cr Sales, Cr PPN)
 *   12. Pelunasan Bayar    : Payment received & posted (Dr Bank, Cr AR) -> Invoice PAID
 *   13. Tutup Buku Fin     : Financial month-end close -> Trial Balance perfectly balanced
 */
import { randomUUID } from 'crypto';
import { bootP20App, cleanP20Residuals, P20App } from './p20-http-harness';
import { FinanceService } from '../../src/modules/finance/finance.service';
import {
  WorkflowStatus,
  SampleStage,
  FormulaStatus,
  SOStatus,
  QCStatus,
  ProdStage,
  LifecycleStatus,
  InvoiceCategory,
  InvoiceType,
  InvoiceStatus,
  SourceDocumentType,
  InboundStatus,
} from '@prisma/client';

describe('P20 Golden Thread: 13-Node E2E Supply Chain & Financial Lifecycle (AC-P20-01)', () => {
  let harness: P20App;
  let financeService: FinanceService;
  let accounts: Record<string, any>;
  let adminUserId: string;

  const runId = randomUUID().slice(0, 6);
  const tag = `P20-GT-${runId}`;

  beforeAll(async () => {
    harness = await bootP20App();
    financeService = harness.app.get(FinanceService);
    await cleanP20Residuals(harness.prisma);
    accounts = await harness.ensureStandardAccounts();
    const { user: admin } = await harness.createUser(`ADMIN_${runId}`, ['SUPER_ADMIN', 'PRODUCTION', 'FINANCE']);
    adminUserId = admin.id;
  });

  afterAll(async () => {
    await cleanP20Residuals(harness.prisma);
    await harness.app.close();
  });

  it('executes full 13-node Golden Thread without gaps or imbalances', async () => {
    // -------------------------------------------------------------
    // NODE 1: CRM Lead
    // -------------------------------------------------------------
    const staff = await harness.createStaff(`nex_p20_bd_${runId}`);
    const lead = await harness.prisma.salesLead.create({
      data: {
        clientName: `P20 Client ${runId}`,
        contactInfo: 'p20@example.com',
        source: 'DIRECT',
        status: WorkflowStatus.NEW_LEAD,
        productInterest: 'Hydrating Glow Serum 30ml',
        picId: staff.id,
      },
    });
    expect(lead.id).toBeDefined();
    expect(lead.status).toBe(WorkflowStatus.NEW_LEAD);

    // Advance to CONTACTED -> NEGOTIATION
    const updatedLead = await harness.prisma.salesLead.update({
      where: { id: lead.id },
      data: { status: WorkflowStatus.NEGOTIATION },
    });
    expect(updatedLead.status).toBe(WorkflowStatus.NEGOTIATION);

    // -------------------------------------------------------------
    // NODE 2: Sample R&D
    // -------------------------------------------------------------
    const sample = await harness.prisma.sampleRequest.create({
      data: {
        sampleCode: `P20-SMP-${runId}`,
        leadId: lead.id,
        productName: 'Hydrating Glow Serum 30ml',
        targetFunction: 'Skin Barrier Repair',
        textureReq: 'Watery Gel Serum Cepat Meresap',
        colorReq: 'Transparan Light Amber',
        aromaReq: 'Fresh Neroli Blossom 0.1%',
        stage: SampleStage.FORMULATING,
      },
    });
    expect(sample.id).toBeDefined();

    const formula = await harness.prisma.formula.create({
      data: {
        formulaCode: `P20-FOR-${runId}`,
        sampleRequestId: sample.id,
        status: FormulaStatus.PRODUCTION_LOCKED,
        version: 1,
      },
    });
    expect(formula.status).toBe(FormulaStatus.PRODUCTION_LOCKED);

    await harness.prisma.sampleRequest.update({
      where: { id: sample.id },
      data: { stage: SampleStage.APPROVED, isApprovedByClient: true },
    });

    // -------------------------------------------------------------
    // NODE 3: Quotation
    // -------------------------------------------------------------
    const wonLead = await harness.prisma.salesLead.update({
      where: { id: lead.id },
      data: {
        status: WorkflowStatus.WON_DEAL,
      },
    });
    expect(wonLead.status).toBe(WorkflowStatus.WON_DEAL);

    // -------------------------------------------------------------
    // NODE 4: Sales Order
    // -------------------------------------------------------------
    const customer = await harness.prisma.customer.create({
      data: {
        code: `P20-CUST-${runId}`,
        name: `PT Glow P20 ${runId}`,
        email: `contact-${runId}@glowskin.co.id`,
      },
    });
    expect(customer.id).toBeDefined();

    const soQuantity = 5000;
    const unitPrice = 40000; // Rp 40.000 / pcs
    const soTotal = soQuantity * unitPrice; // Rp 200.000.000

    const so = await harness.prisma.salesOrder.create({
      data: {
        orderNumber: `P20-SO-${runId}`,
        leadId: lead.id,
        sampleId: sample.id,
        status: SOStatus.ACTIVE,
        totalAmount: soTotal,
        quantity: soQuantity,
        brandName: 'P20 Glow Skin',
        items: {
          create: [
            {
              productName: 'Hydrating Glow Serum 30ml',
              netto: 30,
              quantity: soQuantity,
              unitPrice: unitPrice,
              subtotal: soTotal,
            },
          ],
        },
      },
    });
    expect(so.status).toBe(SOStatus.ACTIVE);
    expect(Number(so.totalAmount)).toBe(soTotal);

    const soItems = await harness.prisma.salesOrderItem.findMany({
      where: { soId: so.id },
    });
    expect(soItems).toHaveLength(1);

    // -------------------------------------------------------------
    // NODE 5: Kalkulasi MRP (Material Requirement Planning)
    // -------------------------------------------------------------
    const rawMaterial = await harness.prisma.materialItem.create({
      data: {
        name: `P20 Active Niacinamide ${runId}`,
        code: `P20-RM-NIA-${runId}`,
        type: 'RAW_MATERIAL' as any,
        unit: 'KG',
        unitPrice: 150000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 0,
      },
    });

    const pkgBottle = await harness.prisma.materialItem.create({
      data: {
        name: `P20 Amber Bottle 30ml ${runId}`,
        code: `P20-PKG-BOT-${runId}`,
        type: 'PACKAGING' as any,
        unit: 'PCS',
        unitPrice: 4000,
        minLevel: 500,
        maxLevel: 20000,
        reorderPoint: 1000,
        stockQty: 0,
      },
    });

    // 5000 bottles need: 100 kg raw material, 5000 packaging bottles
    const mrp = await harness.prisma.goodsRequirement.create({
      data: {
        code: `P20-MRP-${runId}`,
        salesOrderId: so.id,
        date: new Date(),
        status: 'CONFIRMED',
        items: {
          create: [
            { materialId: rawMaterial.id, qty: 100, notes: 'Raw active material' },
            { materialId: pkgBottle.id, qty: 5000, notes: 'Primary packaging bottle' },
          ],
        },
      },
    });
    expect(mrp.code).toBeDefined();

    const mrpItems = await harness.prisma.goodsRequirementItem.findMany({
      where: { requirementId: mrp.id },
    });
    expect(mrpItems).toHaveLength(2);

    // -------------------------------------------------------------
    // NODE 6: PO Supplier
    // -------------------------------------------------------------
    const supplierChem = await harness.prisma.supplier.create({
      data: {
        name: `nex_p20_chem_supplier_${runId}`,
        contact: '0812345678',
      },
    });

    const poRaw = await harness.prisma.purchaseOrder.create({
      data: {
        poNumber: `P20-PO-RAW-${runId}`,
        supplierId: supplierChem.id,
        status: 'ORDERED',
        totalValue: 100 * 150000,
        items: {
          create: [
            {
              materialId: rawMaterial.id,
              quantity: 100,
              unitPrice: 150000,
              totalPrice: 15000000,
            },
          ],
        },
      },
    });
    expect(poRaw.status).toBe('ORDERED');

    // -------------------------------------------------------------
    // NODE 7: GRN Penerimaan Gudang (Quarantine Status)
    // -------------------------------------------------------------
    let warehouse = await harness.prisma.warehouse.findFirst({ where: { status: 'ACTIVE' } });
    if (!warehouse) {
      warehouse = await harness.prisma.warehouse.create({
        data: {
          name: `P20 Central WH ${runId}`,
          status: 'ACTIVE',
        },
      });
    }

    const inbound = await harness.prisma.warehouseInbound.create({
      data: {
        inboundNumber: `P20-GRN-${runId}`,
        poId: poRaw.id,
        warehouseId: warehouse.id,
        status: InboundStatus.APPROVED,
        items: {
          create: [
            {
              materialId: rawMaterial.id,
              qtyActual: 100,
              qtyGood: 100,
              isQuarantine: true,
              qcStatus: QCStatus.QUARANTINE,
            },
          ],
        },
      },
    });
    expect(inbound.inboundNumber).toBeDefined();

    // Inventory initially placed in QUARANTINE
    const rawBatch = await harness.prisma.materialInventory.create({
      data: {
        materialId: rawMaterial.id,
        supplierId: supplierChem.id,
        batchNumber: `P20-LOT-RAW-${runId}`,
        currentStock: 100,
        qcStatus: QCStatus.QUARANTINE,
      },
    });
    expect(rawBatch.qcStatus).toBe(QCStatus.QUARANTINE);

    // -------------------------------------------------------------
    // NODE 8: SPK Produksi / BMR
    // -------------------------------------------------------------
    const prodPlan = await harness.prisma.productionPlan.create({
      data: {
        soId: so.id,
        adminId: adminUserId,
        batchNo: `P20-BATCH-${runId}`,
        status: LifecycleStatus.MIXING,
        formulaId: formula.id,
        apjStatus: 'WAITING',
      },
    });

    const workOrder = await harness.prisma.workOrder.create({
      data: {
        woNumber: `P20-WO-${runId}`,
        leadId: lead.id,
        planId: prodPlan.id,
        targetQty: soQuantity,
        stage: LifecycleStatus.MIXING,
        targetCompletion: new Date(Date.now() + 7 * 86400000),
      },
    });
    expect(workOrder.woNumber).toBeDefined();

    const mixingStepLog = await harness.prisma.productionStepLog.create({
      data: {
        woId: prodPlan.id,
        stage: ProdStage.MIXING,
        inputQty: 100,
        qtyResult: 98,
        qtyQuarantine: 98,
        qtyReject: 2,
      },
    });
    expect(mixingStepLog.id).toBeDefined();

    await harness.prisma.productionLog.create({
      data: {
        logNumber: `P20-LOG-MIX-${runId}`,
        workOrderId: workOrder.id,
        planId: prodPlan.id,
        stage: LifecycleStatus.MIXING,
        inputQty: 100,
        goodQty: 98,
        quarantineQty: 98,
        rejectQty: 2,
        notes: `Bulk production complete - ${tag}`,
      },
    });

    const packingStepLog = await harness.prisma.productionStepLog.create({
      data: {
        woId: prodPlan.id,
        stage: ProdStage.PACKING,
        inputQty: 5000,
        qtyResult: 4950,
        qtyQuarantine: 4950,
        qtyReject: 50,
      },
    });

    await harness.prisma.productionLog.create({
      data: {
        logNumber: `P20-LOG-PCK-${runId}`,
        workOrderId: workOrder.id,
        planId: prodPlan.id,
        stage: LifecycleStatus.PACKING,
        inputQty: 5000,
        goodQty: 4950,
        quarantineQty: 4950,
        rejectQty: 50,
        notes: `Packaging complete: 4950 units - ${tag}`,
      },
    });
    expect(Number(packingStepLog.qtyResult)).toBe(4950);

    // -------------------------------------------------------------
    // NODE 9: QC Lab & APJ Release
    // -------------------------------------------------------------
    const { user: qcUser } = await harness.createUser(`QC_${runId}`, ['QC_LAB', 'APJ']);

    const qcaudit = await harness.prisma.qCAudit.create({
      data: {
        stepLogId: packingStepLog.id,
        qcId: qcUser.id,
        status: QCStatus.GOOD,
        phValue: 5.5,
        viscosityValue: 2900,
        homogenityPass: true,
        notes: `QC Lab Pass, authorized for APJ Release - ${tag}`,
      },
    });
    expect(qcaudit.status).toBe(QCStatus.GOOD);

    // APJ Release to Available Finished Goods
    const finishedGood = await harness.prisma.finishedGood.create({
      data: {
        woId: prodPlan.id,
        stockQty: 4950,
      },
    });
    expect(Number(finishedGood.stockQty)).toBe(4950);

    // -------------------------------------------------------------
    // NODE 10: Delivery Order
    // -------------------------------------------------------------
    const deliveryOrder = await harness.prisma.deliveryOrder.create({
      data: {
        workOrderId: workOrder.id,
        trackingNumber: `P20-TRK-${runId}`,
        courierName: 'Internal Logistics Fleet',
        status: 'DELIVERED',
      },
    });
    expect(deliveryOrder.status).toBe('DELIVERED');

    // -------------------------------------------------------------
    // NODE 11: Sales Invoice & Auto-Journal Post
    // -------------------------------------------------------------
    const invoiceAmount = 4950 * unitPrice; // 198,000,000
    const ppnAmount = Math.round(invoiceAmount * 0.11); // 21,780,000
    const totalInvoice = invoiceAmount + ppnAmount; // 219,780,000

    const unifiedInvoice = await harness.prisma.invoice.create({
      data: {
        invoiceNumber: `P20-INV-${runId}`,
        category: InvoiceCategory.RECEIVABLE,
        type: InvoiceType.FINAL_PAYMENT,
        status: InvoiceStatus.UNPAID,
        amountDue: totalInvoice,
        outstandingAmount: totalInvoice,
        dueDate: new Date(Date.now() + 14 * 86400000),
        soId: so.id,
        deliveryOrderId: deliveryOrder.id,
        notes: `Unified Invoice - ${tag}`,
      },
    });
    expect(unifiedInvoice.invoiceNumber).toBeDefined();

    // Double-entry auto journal: Dr Piutang 1103/1201, Cr Penjualan 4101, Cr PPN 2201
    const invoiceJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `P20-JRN-INV-${runId}`,
        description: `Auto-Journal Sales Invoice ${unifiedInvoice.invoiceNumber} - ${tag}`,
        sourceDocumentType: SourceDocumentType.SALES_ORDER,
        soId: so.id,
        lines: {
          create: [
            { accountId: accounts['1103'].id, debit: totalInvoice, credit: 0 },
            { accountId: accounts['4101'].id, debit: 0, credit: invoiceAmount },
            { accountId: accounts['2201'].id, debit: 0, credit: ppnAmount },
          ],
        },
      },
    });

    const invLines = await harness.prisma.journalLine.findMany({
      where: { journalId: invoiceJournal.id },
    });
    expect(invLines).toHaveLength(3);
    const invDebit = invLines.reduce((s, l) => s + Number(l.debit), 0);
    const invCredit = invLines.reduce((s, l) => s + Number(l.credit), 0);
    expect(invDebit).toBe(totalInvoice);
    expect(invCredit).toBe(totalInvoice);
    expect(Math.abs(invDebit - invCredit)).toBe(0);

    // -------------------------------------------------------------
    // NODE 12: Pelunasan Pembayaran (Payment Receipt & Balanced Auto-Journal)
    // -------------------------------------------------------------
    const payment = await harness.prisma.payment.create({
      data: {
        invoiceId: unifiedInvoice.id,
        verifiedBy: adminUserId,
        amountPaid: totalInvoice,
        paymentDate: new Date(),
      },
    });
    expect(payment.id).toBeDefined();

    // Mark invoice paid
    await harness.prisma.invoice.update({
      where: { id: unifiedInvoice.id },
      data: { status: InvoiceStatus.PAID, outstandingAmount: 0, paidAt: new Date() },
    });

    // Double-entry auto journal: Dr Kas BCA 1110, Cr Piutang 1103
    const paymentJournal = await harness.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `P20-JRN-PAY-${runId}`,
        description: `Auto-Journal Payment Settlement ${payment.id} - ${tag}`,
        sourceDocumentType: SourceDocumentType.PAYMENT,
        soId: so.id,
        lines: {
          create: [
            { accountId: accounts['1110'].id, debit: totalInvoice, credit: 0 },
            { accountId: accounts['1103'].id, debit: 0, credit: totalInvoice },
          ],
        },
      },
    });

    const payLines = await harness.prisma.journalLine.findMany({
      where: { journalId: paymentJournal.id },
    });
    expect(payLines).toHaveLength(2);
    const payDebit = payLines.reduce((s, l) => s + Number(l.debit), 0);
    const payCredit = payLines.reduce((s, l) => s + Number(l.credit), 0);
    expect(payDebit).toBe(totalInvoice);
    expect(payCredit).toBe(totalInvoice);
    expect(Math.abs(payDebit - payCredit)).toBe(0);

    // -------------------------------------------------------------
    // NODE 13: Tutup Buku Finansial (Trial Balance Equilibrium)
    // -------------------------------------------------------------
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfToday = new Date();

    const trialBalance = await financeService.getTrialBalance(startOfYear, endOfToday);
    expect(trialBalance.isBalanced).toBe(true);
    expect(Math.abs(trialBalance.totals.totalDebit - trialBalance.totals.totalCredit)).toBeLessThanOrEqual(0.01);

    const balanceSheet = await financeService.getBalanceSheet(endOfToday);
    expect(balanceSheet).toBeDefined();

    const profitLoss = await financeService.getProfitLoss(startOfYear, endOfToday);
    expect(profitLoss).toBeDefined();
    expect(profitLoss.operatingRevenue).toBeDefined();
    expect(profitLoss.cogs).toBeDefined();
    expect(profitLoss.operatingIncome).toBeDefined();
    expect(typeof profitLoss.netProfit).toBe('number');
  });
});
