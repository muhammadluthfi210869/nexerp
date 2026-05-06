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

describe('Finance Integration Audit (Ultimate Testing Plan)', () => {
  let service: FinanceService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinanceService, PrismaService, EventEmitter2],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

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

      // 4. Validation
      const journal = await prisma.journalEntry.findFirst({
        where: { description: { contains: fundReq.id } },
      });

      expect(journal).toBeTruthy();

      // Cleanup
      if (journal) {
        await prisma.journalLine.deleteMany({
          where: { journalId: journal.id },
        });
        await prisma.journalEntry.delete({ where: { id: journal.id } });
      }
      await prisma.fundRequest.delete({ where: { id: fundReq.id } });
      await prisma.account.delete({ where: { id: cashAcc.id } });
      await prisma.account.delete({ where: { id: expenseAcc.id } });
    });
  });
});
