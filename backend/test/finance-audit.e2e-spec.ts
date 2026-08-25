import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from '../src/modules/finance/finance.service';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AccountType,
  NormalBalance,
  FundRequestStatus,
  PeriodStatus,
} from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IdGeneratorService } from '../src/modules/system/id-generator.service';
import { ScmService } from '../src/modules/scm/services/scm.service';
import { CreativeService } from '../src/modules/creative/creative.service';
import { ModuleRef } from '@nestjs/core';
import { CashService } from '../src/modules/finance/cash.service';
import { CashDisburseCategory } from '../src/modules/finance/dto/cash.dto';

describe('Finance Integration Audit (Ultimate Testing Plan)', () => {
  let service: FinanceService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;
  let cashService: CashService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        CashService,
        PrismaService,
        EventEmitter2,
        { provide: IdGeneratorService, useValue: { generateId: jest.fn().mockResolvedValue('JRN-AUDIT') } },
        { provide: ScmService, useValue: {} },
        { provide: CreativeService, useValue: {} },
        { provide: ModuleRef, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    cashService = module.get<CashService>(CashService);

    // Initial Cleanup (Sequential order to respect Foreign Keys)
    await prisma.journalLine.deleteMany({
      where: { journal: { description: { contains: 'Audit' } } },
    });
    await prisma.journalEntry.deleteMany({
      where: { description: { contains: 'Audit' } },
    });
    await prisma.materialRequisition.deleteMany({
      where: { workOrder: { woNumber: 'WO-AUDIT-001' } },
    });
    await prisma.productionLog.deleteMany({
      where: { workOrder: { woNumber: 'WO-AUDIT-001' } },
    });
    await prisma.workOrder.deleteMany({ where: { woNumber: 'WO-AUDIT-001' } });
    await prisma.billOfMaterial.deleteMany({
      where: { sample: { productName: 'Sample Audit' } },
    });
    await prisma.sampleRequest.deleteMany({
      where: { productName: 'Sample Audit' },
    });
    await prisma.salesLead.deleteMany({ where: { clientName: 'Audit Corp' } });
    await prisma.bussdevStaff.deleteMany({ where: { name: 'Sales Auditor' } });
    await prisma.fundRequest.deleteMany({
      where: { reason: 'Test Audit Disbursement' },
    });
    await prisma.materialItem.deleteMany({ where: { code: 'MAT-AUDIT-001' } });
    await prisma.account.deleteMany({ where: { code: { contains: 'TEST' } } });
    await prisma.financialPeriod.deleteMany({
      where: { name: { contains: 'LOCKED' } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Scenario 1: Period Locking Logic', () => {
    it('should block journal creation if period is SOFT_LOCKED', async () => {
      // Setup: Create a locked period in the past to avoid interference
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2020-01-31');

      await prisma.financialPeriod.create({
        data: {
          name: 'Januari 2020 LOCKED',
          startDate,
          endDate,
          status: PeriodStatus.SOFT_LOCKED,
        },
      });

      // Test: Attempt to post journal in that date
      const journalDto = {
        date: '2020-01-15',
        description: 'Test Locked Journal Audit',
        lines: [],
      };

      await expect(
        service.createJournalEntry(journalDto as any),
      ).rejects.toThrow(BadRequestException);

      // Cleanup
      await prisma.financialPeriod.deleteMany({
        where: { name: 'Januari 2020 LOCKED' },
      });
    });
  });

  describe('Scenario 2: HPP Automation Logic Audit', () => {
    it('should calculate HPP based on material unitPrice when production passes', async () => {
      // 1. Setup Material with Price
      const material = await prisma.materialItem.create({
        data: {
          name: 'Bahan Baku Audit',
          code: 'MAT-AUDIT-001',
          type: 'RAW_MATERIAL',
          unitPrice: 10000,
          stockQty: 100,
          unit: 'KG',
          minLevel: 10,
          maxLevel: 1000,
          reorderPoint: 20,
        },
      });

      // 2. Setup Sample with BOM
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-FIN-' + Math.random().toString(36).substring(7),
          productName: 'Sample Audit',
          targetFunction: 'Testing',
          textureReq: 'Smooth',
          colorReq: 'Red',
          aromaReq: 'None',
          lead: {
            create: {
              clientName: 'Audit Corp',
              contactInfo: '08123456789',
              source: 'GOOGLE',
              productInterest: 'Audit Skincare',
              pic: {
                create: {
                  name: 'Sales Auditor',
                },
              },
              status: 'PRODUCTION_PLAN',
            },
          },
          billOfMaterials: {
            create: {
              materialId: material.id,
              quantityPerUnit: 2, // 2 KG per unit
            },
          },
        },
        include: { lead: true },
      });

      // 3. Setup WorkOrder
      const wo = await prisma.workOrder.create({
        data: {
          woNumber: 'WO-AUDIT-001',
          leadId: sample.leadId,
          targetQty: 10, // 10 units
          targetCompletion: new Date(),
          stage: 'FINISHED_GOODS',
        },
      });

      // 4. Trigger Event
      await service.handleProductionPassed({
        workOrderId: wo.id,
        loggedBy: 'system-tester',
      });

      // 5. Validation: Total HPP should be 10 units * 2 KG * 10,000 = 200,000
      const journal = await prisma.journalEntry.findFirst({
        where: { reference: `HPP-AUTO-${wo.woNumber}` },
        include: { lines: true },
      });

      expect(journal).toBeTruthy();
      if (!journal) throw new Error('Journal not found');

      expect(Number(journal.lines[0].debit || journal.lines[0].credit)).toBe(
        200000,
      );

      // Cleanup
      await prisma.journalLine.deleteMany({ where: { journalId: journal.id } });
      await prisma.journalEntry.delete({ where: { id: journal.id } });
      await prisma.materialRequisition.deleteMany({
        where: { workOrderId: wo.id },
      });
      await prisma.productionLog.deleteMany({ where: { workOrderId: wo.id } });
      await prisma.workOrder.delete({ where: { id: wo.id } });
      await prisma.billOfMaterial.deleteMany({
        where: { sampleId: sample.id },
      });
      await prisma.sampleRequest.delete({ where: { id: sample.id } });
      await prisma.materialItem.delete({ where: { id: material.id } });
    });
  });

  describe('Scenario 3: Fund Request Disbursement', () => {
    it('should create a Journal Entry when a fund request is disbursed', async () => {
      // 1. Setup Accounts
      const cashAcc = await prisma.account.create({
        data: {
          code: '1101-TEST',
          name: 'Kas Test Audit',
          type: AccountType.ASSET,
          normalBalance: NormalBalance.DEBIT,
        },
      });

      const expenseAcc = await prisma.account.create({
        data: {
          code: '6000-TEST',
          name: 'Beban MARKETING Audit',
          type: AccountType.EXPENSE,
          normalBalance: NormalBalance.DEBIT,
        },
      });

      // 2. Setup Request
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found for testing');

      const fundReq = await prisma.fundRequest.create({
        data: {
          requesterId: user.id,
          departmentId: 'MARKETING',
          amount: 500000,
          reason: 'Test Audit Disbursement',
          status: FundRequestStatus.APPROVED_BY_MGR,
        },
      });

      // 3. Disburse
      await service.disburseFundRequest(fundReq.id, {
        disbursedById: user.id,
        accountId: cashAcc.id,
      });

      const retry = await service.disburseFundRequest(fundReq.id, {
        disbursedById: user.id,
        accountId: cashAcc.id,
      });
      expect((retry as any).idempotent).toBe(true);
      expect(await prisma.journalEntry.count({ where: { fundRequestId: fundReq.id } })).toBe(1);

      // 4. Validation
      const journal = await prisma.journalEntry.findFirst({
        where: { description: { contains: fundReq.id } },
      });

      expect(journal).toBeTruthy();

      const rejected = await prisma.fundRequest.create({
        data: {
          requesterId: user.id,
          departmentId: 'MARKETING',
          amount: 125000,
          reason: 'Test Audit Rejected',
          status: FundRequestStatus.REJECTED,
        },
      });
      await expect(service.disburseFundRequest(rejected.id, {
        disbursedById: user.id,
        accountId: cashAcc.id,
      })).rejects.toThrow(BadRequestException);

      // Cleanup
      if (journal) {
        await prisma.journalLine.deleteMany({
          where: { journalId: journal.id },
        });
        await prisma.journalEntry.delete({ where: { id: journal.id } });
      }
      await prisma.fundRequest.delete({ where: { id: fundReq.id } });
      await prisma.fundRequest.delete({ where: { id: rejected.id } });
      await prisma.account.delete({ where: { id: cashAcc.id } });
      await prisma.account.delete({ where: { id: expenseAcc.id } });
    });
  });

  describe('Batch 7 closure concurrency', () => {
    it('C2: applies exactly one effective approval transition', async () => {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found for testing');
      const fundReq = await prisma.fundRequest.create({
        data: {
          requesterId: user.id,
          departmentId: 'MARKETING',
          amount: 500000,
          reason: 'Batch 7 C2 Concurrent Approval',
          status: FundRequestStatus.PENDING_APPROVAL_MGR,
        },
      });

      const results = await Promise.allSettled([
        service.approveFundRequest(fundReq.id, { approvedById: user.id }),
        service.approveFundRequest(fundReq.id, { approvedById: user.id }),
      ]);
      const finalRequest = await prisma.fundRequest.findUnique({ where: { id: fundReq.id } });

      expect(finalRequest?.status).toBe(FundRequestStatus.APPROVED_BY_MGR);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
      expect(await prisma.journalEntry.count({ where: { fundRequestId: fundReq.id } })).toBe(0);

      await prisma.fundRequest.delete({ where: { id: fundReq.id } });
    });

    it('C3: creates exactly one source-backed PO journal under concurrent retry', async () => {
      const cashAccount = await prisma.account.create({
        data: { code: '1102-B7-C3', name: 'Kas Batch 7 C3', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT },
      });
      const expenseAccount = await prisma.account.create({
        data: { code: '6002-B7-C3', name: 'Beban Batch 7 C3', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT },
      });
      const po = await prisma.purchaseOrder.create({
        data: { poNumber: 'PO-B7-C3-CONCURRENT', totalValue: 500000 },
      });
      const dto = {
        date: '2026-08-23',
        cashAccountId: cashAccount.id,
        category: CashDisburseCategory.UANG_MUKA_PEMBELIAN,
        debitAccountId: expenseAccount.id,
        amount: 500000,
        entityName: 'Batch 7 C3 supplier',
        notes: 'Concurrent source-backed PO payment',
        referenceId: po.id,
      } as any;

      const results = await Promise.allSettled([cashService.disburse(dto), cashService.disburse(dto)]);
      const journals = await prisma.journalEntry.findMany({ where: { sourceEntityType: 'PurchaseOrder', sourceEntityId: po.id }, include: { lines: true } });
      const invoices = await prisma.invoice.count({ where: { poId: po.id, type: 'DP' } });

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
      expect(journals).toHaveLength(1);
      expect(journals[0].poId).toBe(po.id);
      expect(journals[0].lines.reduce((sum, line) => sum + Number(line.credit), 0)).toBe(500000);
      expect(invoices).toBe(1);

      await prisma.journalLine.deleteMany({ where: { journalId: journals[0].id } });
      await prisma.journalEntry.delete({ where: { id: journals[0].id } });
      await prisma.invoice.deleteMany({ where: { poId: po.id, type: 'DP' } });
      await prisma.purchaseOrder.delete({ where: { id: po.id } });
      await prisma.account.delete({ where: { id: cashAccount.id } });
      await prisma.account.delete({ where: { id: expenseAccount.id } });
    });
  });
});
