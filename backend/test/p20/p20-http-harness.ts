/**
 * Shared harness for P20 End-to-End Golden Thread & Concurrency suites.
 *
 * Boots the real Nest application (AppModule) against the test database,
 * using production guards, filters, pipes, and signing real JWT tokens.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { randomUUID } from 'crypto';
import { AccountType, NormalBalance, ReportGroup } from '@prisma/client';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { PlatformConfig } from '../../src/platform/config/config.module';
import { validationExceptionFactory } from '../../src/common/validation/validation-error.factory';

export const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

export function loadP20Env(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function p20Secret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

export type P20App = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
  createUser: (label: string, roles: any[], tenantId?: string) => Promise<{ user: any; token: string }>;
  createStaff: (name?: string) => Promise<any>;
  ensureStandardAccounts: () => Promise<Record<string, any>>;
};

export async function bootP20App(): Promise<P20App> {
  loadP20Env();
  const jwtSecret = p20Secret('JWT_SECRET');
  const aesSecret = p20Secret('AES_SECRET_KEY');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PlatformConfig)
    .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  await app.init();
  const prisma = app.get(PrismaService);

  return {
    app,
    prisma,
    jwtSecret,
    aesSecret,
    tokenFor: (user, tenantId) =>
      jwt.sign(
        {
          sub: user.id,
          userId: user.id,
          email: user.email,
          roles: user.roles,
          ...(tenantId ? { organizationId: tenantId, tenantId } : {}),
        },
        jwtSecret,
      ),
    createUser: async (label: string, roles: any[], tenantId?: string) => {
      const email = `nex_p20_${label.toLowerCase()}_${randomUUID().slice(0, 8)}@example.com`;
      const user = await prisma.user.create({
        data: {
          email,
          fullName: `P20 ${label}`,
          passwordHash: 'dummy_hash_for_testing',
          status: 'ACTIVE',
          roles: roles as any,
          ...(tenantId ? { organizationId: tenantId } : {}),
        },
      });
      const token = jwt.sign(
        {
          sub: user.id,
          userId: user.id,
          email: user.email,
          roles: user.roles,
          ...(tenantId ? { organizationId: tenantId, tenantId } : {}),
        },
        jwtSecret,
      );
      return { user, token };
    },
    createStaff: async (name?: string) => {
      return prisma.bussdevStaff.create({
        data: {
          name: name || `nex_p20_staff_${randomUUID().slice(0, 8)}`,
        },
      });
    },
    ensureStandardAccounts: async () => {
      const defs = [
        { code: '1110', name: 'Kas & Bank BCA Operasional (P20)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: true },
        { code: '1103', name: 'Piutang Usaha (P20)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: true },
        { code: '1201', name: 'Piutang Usaha Maklon (P20)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: true },
        { code: '1301', name: 'Persediaan Bahan Baku (P20)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: false },
        { code: '1304', name: 'Persediaan Barang Jadi (P20)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: false },
        { code: '2101', name: 'Hutang Usaha Supplier (P20)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY, allowManualJournal: false },
        { code: '2201', name: 'PPN Keluaran (P20)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY, allowManualJournal: true },
        { code: '2301', name: 'Uang Muka Penjualan DP (P20)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY, allowManualJournal: true },
        { code: '4101', name: 'Pendapatan Penjualan Maklon (P20)', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE, allowManualJournal: true },
        { code: '5100', name: 'Biaya Produksi Langsung (P20)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, allowManualJournal: true },
        { code: '5101', name: 'HPP Bahan Baku (P20)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, allowManualJournal: true },
      ];

      const accMap: Record<string, any> = {};
      for (const d of defs) {
        let acc = await prisma.account.findUnique({ where: { code: d.code } });
        if (!acc) {
          acc = await prisma.account.create({ data: d });
        }
        accMap[d.code] = acc;
      }
      return accMap;
    },
  };
}

export async function cleanP20Residuals(prisma: PrismaService): Promise<void> {
  const p20Users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'nex_p20' } },
        { email: { contains: 'P20' } },
      ],
    },
    select: { id: true },
  });
  const userIds = p20Users.map((u) => u.id);

  // 1. Clean Journals
  const journals = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { reference: { contains: 'P20' } },
        { reference: { contains: 'nex_p20' } },
        { description: { contains: 'P20' } },
        { description: { contains: 'nex_p20' } },
      ],
    },
    select: { id: true },
  });
  if (journals.length > 0) {
    const jIds = journals.map((j) => j.id);
    await prisma.journalLine.deleteMany({ where: { journalId: { in: jIds } } });
    await prisma.journalEntry.deleteMany({ where: { id: { in: jIds } } });
  }

  // 2. Clean Payments
  await prisma.payment.deleteMany({
    where: {
      invoice: {
        invoiceNumber: { contains: 'P20' },
      },
    },
  });

  // 3. Clean Delivery Orders
  await prisma.deliveryOrder.deleteMany({
    where: {
      workOrder: {
        plan: {
          batchNo: { contains: 'P20' },
        },
      },
    },
  });

  // 4. Clean Invoices
  await prisma.invoice.deleteMany({
    where: {
      invoiceNumber: { contains: 'P20' },
    },
  });

  await prisma.salesInvoiceLineItem.deleteMany({
    where: {
      invoice: {
        invoiceNumber: { contains: 'P20' },
      },
    },
  });

  await prisma.salesInvoice.deleteMany({
    where: {
      invoiceNumber: { contains: 'P20' },
    },
  });

  // 5. Clean QC & Production
  await prisma.qCAudit.deleteMany({
    where: {
      OR: [
        { notes: { contains: 'nex_p20' } },
        { qcId: { in: userIds } },
      ],
    },
  });

  await prisma.finishedGood.deleteMany({
    where: {
      wo: {
        batchNo: { contains: 'P20' },
      },
    },
  });

  await prisma.productionLog.deleteMany({
    where: {
      logNumber: { contains: 'P20' },
    },
  });

  await prisma.productionStepLog.deleteMany({
    where: {
      wo: {
        batchNo: { contains: 'P20' },
      },
    },
  });

  await prisma.productionSchedule.deleteMany({
    where: {
      scheduleNumber: { contains: 'P20' },
    },
  });

  await prisma.workOrder.deleteMany({
    where: {
      woNumber: { contains: 'P20' },
    },
  });

  await prisma.productionPlan.deleteMany({
    where: {
      batchNo: { contains: 'P20' },
    },
  });

  // 6. Clean Goods Receipts & Inbound
  await prisma.inboundItem.deleteMany({
    where: {
      inbound: {
        inboundNumber: { contains: 'P20' },
      },
    },
  });

  await prisma.warehouseInbound.deleteMany({
    where: {
      inboundNumber: { contains: 'P20' },
    },
  });

  // 7. Clean PO & MRP
  await prisma.purchaseOrderItem.deleteMany({
    where: {
      po: {
        poNumber: { contains: 'P20' },
      },
    },
  });

  await prisma.purchaseOrder.deleteMany({
    where: {
      poNumber: { contains: 'P20' },
    },
  });

  await prisma.goodsRequirementItem.deleteMany({
    where: {
      requirement: {
        code: { contains: 'P20' },
      },
    },
  });

  await prisma.goodsRequirement.deleteMany({
    where: {
      code: { contains: 'P20' },
    },
  });

  // 8. Clean SO, Samples, Formulas, Leads, Customers
  await prisma.salesOrderItem.deleteMany({
    where: {
      salesOrder: {
        orderNumber: { contains: 'P20' },
      },
    },
  });

  await prisma.salesOrder.deleteMany({
    where: {
      orderNumber: { contains: 'P20' },
    },
  });

  await prisma.formula.deleteMany({
    where: {
      formulaCode: { contains: 'P20' },
    },
  });

  await prisma.sampleRequest.deleteMany({
    where: {
      sampleCode: { contains: 'P20' },
    },
  });

  await prisma.salesLead.deleteMany({
    where: {
      OR: [
        { clientName: { contains: 'P20' } },
        { clientName: { contains: 'nex_p20' } },
      ],
    },
  });

  await prisma.customer.deleteMany({
    where: {
      OR: [
        { code: { contains: 'P20' } },
        { name: { contains: 'nex_p20' } },
      ],
    },
  });

  // 9. Clean Material items & inventories
  await prisma.inventoryTransaction.deleteMany({
    where: {
      OR: [
        { referenceNo: { contains: 'P20' } },
        { notes: { contains: 'P20' } },
        { performedBy: { contains: 'P20' } },
        { inventory: { batchNumber: { contains: 'P20' } } },
        { material: { code: { contains: 'P20' } } },
      ],
    },
  });

  await prisma.materialInventory.deleteMany({
    where: {
      batchNumber: { contains: 'P20' },
    },
  });

  await prisma.materialValuation.deleteMany({
    where: {
      referenceNo: { contains: 'P20' },
    },
  });

  await prisma.materialItem.deleteMany({
    where: {
      code: { contains: 'P20' },
    },
  });

  await prisma.supplier.deleteMany({
    where: {
      name: { contains: 'nex_p20' },
    },
  });

  // 10. Clean Staff & Users
  await prisma.bussdevStaff.deleteMany({
    where: {
      name: { contains: 'nex_p20' },
    },
  });

  if (userIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
  }
}
