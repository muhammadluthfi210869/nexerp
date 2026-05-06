import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { ProductionService } from '../src/modules/production/production.service';
import { WarehouseService } from '../src/modules/warehouse/warehouse.service';
import { FinanceService } from '../src/modules/finance/finance.service';
import { ArPaymentType } from '../src/modules/finance/dto/verify-ar-payment.dto';
import { StockLedgerService } from '../src/modules/warehouse/services/stock-ledger.service';
import { CommunicationProtocolService } from '../src/modules/system/communication-protocol/communication-protocol.service';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { LegalityService } from '../src/modules/legality/legality.service';
import { ScmService } from '../src/modules/scm/services/scm.service';
import { InboundsService } from '../src/modules/scm/services/inbounds.service';
import { SystemModule } from '../src/modules/system/system.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { ProdStage, LifecycleStatus } from '@prisma/client';

describe('V4 System Validation: Unified Communication Protocol', () => {
  let productionService: ProductionService;
  let warehouseService: WarehouseService;
  let financeService: FinanceService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), PrismaModule, SystemModule],
      providers: [
        ProductionService,
        WarehouseService,
        FinanceService,
        StockLedgerService,
        CommunicationProtocolService,
        PrismaService,
        LegalityService,
        ScmService,
        InboundsService,
      ],
    }).compile();

    productionService = module.get<ProductionService>(ProductionService);
    warehouseService = module.get<WarehouseService>(WarehouseService);
    financeService = module.get<FinanceService>(FinanceService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // CRITICAL: Initialize app to trigger EventExplorer for @OnEvent
    const app = module.createNestApplication();
    await app.init();

    // Comprehensive nuke list to ensure clean state
    const nuke = async () => {
      // Level 5 (Deep dependencies)
      await prisma.journalLine.deleteMany({}).catch(() => {});
      await prisma.productionStepDetail.deleteMany({}).catch(() => {});

      // Level 4 (Secondary children)
      await prisma.payment.deleteMany({}).catch(() => {});
      await prisma.invoice.deleteMany({}).catch(() => {});
      await prisma.journalEntry.deleteMany({}).catch(() => {});
      await prisma.productionLog.deleteMany({}).catch(() => {});
      await prisma.inventoryTransaction.deleteMany({}).catch(() => {});
      await prisma.stockAdjustmentItem.deleteMany({}).catch(() => {});
      await prisma.salesOrderItem.deleteMany({}).catch(() => {});
      await prisma.purchaseOrderItem.deleteMany({}).catch(() => {});
      await prisma.inboundItem.deleteMany({}).catch(() => {});
      await prisma.warehouseInbound.deleteMany({}).catch(() => {});
      await prisma.cOPQRecord.deleteMany({}).catch(() => {});
      await prisma.rejectExecution.deleteMany({}).catch(() => {});

      // Level 3 (Primary children)
      await prisma.activityStream.deleteMany({}).catch(() => {});
      await prisma.leadTimelineLog.deleteMany({}).catch(() => {});
      await prisma.leadActivity.deleteMany({}).catch(() => {});
      await prisma.lostDeal.deleteMany({}).catch(() => {});
      await prisma.newProductForm.deleteMany({}).catch(() => {});
      await prisma.regulatoryPipeline.deleteMany({}).catch(() => {});
      await prisma.retentionEngine.deleteMany({}).catch(() => {});
      await prisma.sampleRequest.deleteMany({}).catch(() => {});
      await prisma.designTask.deleteMany({}).catch(() => {});
      await prisma.productionSchedule.deleteMany({}).catch(() => {});
      await prisma.billOfMaterial.deleteMany({}).catch(() => {});
      await prisma.materialInventory.deleteMany({}).catch(() => {});
      await prisma.stockAdjustment.deleteMany({}).catch(() => {});
      await prisma.workOrder.deleteMany({}).catch(() => {});
      await prisma.purchaseOrder.deleteMany({}).catch(() => {});

      // Level 2 (Transactional parents)
      await prisma.salesOrder.deleteMany({}).catch(() => {});
      await prisma.salesLead.deleteMany({}).catch(() => {});

      // Level 1 (Master data)
      await prisma.bussdevStaff.deleteMany({}).catch(() => {});
      await prisma.materialItem.deleteMany({}).catch(() => {});
      await prisma.machine.deleteMany({}).catch(() => {});
      await prisma.supplier.deleteMany({}).catch(() => {});
      await prisma.account.deleteMany({}).catch(() => {});
      await prisma.stateTransitionLog.deleteMany({}).catch(() => {});

      // Level 0 (Identity)
      await prisma.user.deleteMany({}).catch(() => {});
    };
    await nuke();

    // Create a default user for testing (Upsert to avoid unique constraint)
    await prisma.user.upsert({
      where: { email: 'test@admin.com' },
      update: {},
      create: {
        email: 'test@admin.com',
        passwordHash: 'password123',
        fullName: 'Test Admin',
        roles: ['ADMIN'],
        managerPin: '123456',
      },
    });

    // Create accounts for journal entries
    await prisma.account.createMany({
      data: [
        {
          id: randomUUID(),
          code: '1300',
          name: 'Raw Materials',
          type: 'ASSET',
          normalBalance: 'DEBIT',
        },
        {
          id: randomUUID(),
          code: '1401',
          name: 'WIP (Work In Progress)',
          type: 'ASSET',
          normalBalance: 'DEBIT',
        },
        {
          id: randomUUID(),
          code: '4101',
          name: 'Sales Revenue',
          type: 'REVENUE',
          normalBalance: 'CREDIT',
        },
        {
          id: randomUUID(),
          code: '1101',
          name: 'Bank Mandiri',
          type: 'ASSET',
          normalBalance: 'DEBIT',
        },
      ],
    });
  });

  afterAll(async () => {
    if (eventEmitter) {
      eventEmitter.removeAllListeners();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('Scenario: The Full Automated Production Loop', async () => {
    const testId = Date.now().toString().slice(-6);
    // 1. Setup Master Data (Material)
    const material = await prisma.materialItem.create({
      data: {
        name: `Validation Material ${testId}`,
        code: `MAT-VAL-${testId}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 10000,
        stockQty: 100,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `val-${testId}@porto.com`,
        fullName: 'Validation Staff',
        passwordHash: 'secret',
      },
    });

    const supplier = await prisma.supplier.create({
      data: {
        name: 'Validation Supplier',
      },
    });

    // 2. Setup Warehouse Stock (Batch)
    const batch = await prisma.materialInventory.create({
      data: {
        materialId: material.id,
        supplierId: supplier.id,
        batchNumber: `BATCH-VAL-${testId}`,
        currentStock: 100,
        qcStatus: 'GOOD',
      },
    });

    const machine = await prisma.machine.create({
      data: {
        name: 'Validation Machine',
        type: 'MIXING_MACHINE',
        capacityPerBatch: 100,
      },
    });

    const bussdevStaff = await prisma.bussdevStaff.create({
      data: {
        name: 'Validation Staff',
        userId: user.id,
      },
    });

    // 3. Setup Sales Lead
    const lead = await prisma.salesLead.create({
      data: {
        clientName: 'Validation Client',
        contactInfo: '0812345678',
        source: 'TEST',
        productInterest: 'ValProduct',
        status: 'PRODUCTION_PLAN',
        picId: bussdevStaff.id,
      },
    });

    // 4. Setup Sample/Formula (R&D)
    const sample = await prisma.sampleRequest.create({
      data: {
        leadId: lead.id,
        sampleCode: `SMP-${testId}`,
        productName: 'Validation Product',
        targetFunction: 'Cleanse',
        textureReq: 'Gel',
        colorReq: 'Blue',
        aromaReq: 'Fresh',
        stage: 'APPROVED',
      },
    });

    await prisma.billOfMaterial.create({
      data: {
        sampleId: sample.id,
        materialId: material.id,
        quantityPerUnit: 0.1, // 0.1 * 50 = 5
      },
    });

    const wo = await prisma.workOrder.create({
      data: {
        woNumber: `WO-VAL-${testId}`,
        leadId: lead.id,
        targetQty: 50,
        stage: LifecycleStatus.WAITING_MATERIAL,
        targetCompletion: new Date(Date.now() + 86400000),
      },
    });

    // 4. EXECUTE: Material Release (Warehouse -> Production)
    console.log('--- EXECUTING MATERIAL RELEASE ---');
    await warehouseService.releaseMaterial(wo.id);

    const schedule = await prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-VAL-${testId}`,
        workOrderId: wo.id,
        machineId: machine.id,
        stage: ProdStage.MIXING,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        targetQty: 50,
        status: 'IN_PROGRESS',
        stepDetails: {
          create: [
            {
              materialId: material.id,
              qtyTheoretical: 5,
              qtyActual: 5,
            },
          ],
        },
      },
    });

    console.log('--- EXECUTING PRODUCTION FINALIZATION ---');

    // 4. EXECUTE: Finish the production schedule
    await productionService.updateScheduleResult(
      schedule.id,
      48,
      'Validation Test',
    );

    // Small delay to allow event listeners to finish processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('--- VERIFYING AUTOMATED OUTCOMES ---');

    // 5. VERIFY: Stock Deduction
    const updatedBatch = await prisma.materialInventory.findUnique({
      where: { id: batch.id },
    });
    console.log(
      `[VERIFY] Stock Deduction: ${batch.currentStock} -> ${updatedBatch?.currentStock}`,
    );
    expect(Number(updatedBatch?.currentStock)).toBe(95); // 100 - 5

    // 6. VERIFY: Inventory Transaction
    const transaction = await prisma.inventoryTransaction.findFirst({
      where: {
        materialId: material.id,
        referenceNo: wo.woNumber,
      },
    });
    expect(transaction).toBeTruthy();
    expect(transaction?.type).toBe('OUTBOUND');

    // 7. VERIFY: Financial Journal Entry
    const journal = await prisma.journalEntry.findFirst({
      where: { reference: `PROD-COST-${schedule.scheduleNumber}` },
      include: { lines: true },
    });
    console.log(`[VERIFY] Journal Entry: ${journal?.description}`);
    expect(journal).toBeTruthy();
    const totalDebit = journal?.lines.reduce(
      (sum, l) => sum + Number(l.debit),
      0,
    );
    expect(totalDebit).toBe(50000); // 5 Kg * 10.000

    // 8. VERIFY: Audit Ledger (StateTransitionLog)
    const auditLog = await prisma.stateTransitionLog.findFirst({
      where: { entityId: schedule.id },
    });
    console.log(
      `[VERIFY] Audit Log: ${auditLog?.fromState} -> ${auditLog?.toState} Reason: ${auditLog?.reason}`,
    );
    expect(auditLog).toBeTruthy();
    expect(auditLog?.toState).toBe('COMPLETED');
    expect(auditLog?.reason).toContain('COMM_PROT');

    console.log('--- PHASE 3: FINANCIAL & TREASURY AUDIT ---');

    // 9. SETUP: Financial State for Invoice
    await prisma.workOrder.update({
      where: { id: wo.id },
      data: { actualCogs: 750000 }, // Mocked COGS for 48 units
    });

    const bankAcc = await prisma.account.findUnique({
      where: { code: '1101' },
    });

    // 10. EXECUTE: Delivery & Invoice
    const delivery = await prisma.deliveryOrder.create({
      data: {
        workOrderId: wo.id,
        trackingNumber: `TRK-${testId}`,
        status: 'SHIPPED',
      },
    });

    const invoice = await financeService.generateFinalInvoice(delivery.id);
    expect(Number(invoice.amountDue)).toBe(750000);

    // 11. EXECUTE: Payment Verification (AR Hub)
    await financeService.verifyArHubPayment(
      {
        type: ArPaymentType.PELUNASAN,
        id: invoice.id,
        receivingAccountId: bankAcc!.id,
        actualAmount: 750000,
        bankAdminFee: 0,
        taxAmount: 0,
        notes: 'Phase 3 E2E Validation',
      },
      user.id,
    );

    // 12. VERIFY: Final Financial Integrity
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(updatedInvoice?.status).toBe('PAID');
    expect(Number(updatedInvoice?.outstandingAmount)).toBe(0);

    const trialBalance = await financeService.getTrialBalance();
    const bankBalance = trialBalance.data.find(
      (a) => a.code === '1101',
    )?.debitBalance;
    const revenueBalance = trialBalance.data.find(
      (a) => a.code === '4101',
    )?.creditBalance;

    console.log(`[VERIFY] Bank Balance: ${bankBalance}`);
    console.log(`[VERIFY] Revenue Balance: ${revenueBalance}`);

    expect(Number(bankBalance)).toBe(750000);
    expect(Number(revenueBalance)).toBe(750000);

    console.log('--- PHASE 3 VALIDATION SUCCESSFUL ---');
    console.log('--- ALL PHASES COMPLETED: ZERO-ERROR PROTOCOL VERIFIED ---');
  }, 15000);
});
