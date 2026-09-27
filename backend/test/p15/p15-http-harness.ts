/**
 * Shared harness for P15 HTTP-level acceptance suites (Finance, Costing, Accounting & Closing).
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
import { AccountType, NormalBalance, ReportGroup, PeriodStatus } from '@prisma/client';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { PlatformConfig } from '../../src/platform/config/config.module';
import { validationExceptionFactory } from '../../src/common/validation/validation-error.factory';

export const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

export function loadP15Env(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function p15Secret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

export type P15App = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
  createUser: (label: string, roles: any[], tenantId?: string) => Promise<{ user: any; token: string }>;
  createStaff: (name?: string) => Promise<any>;
  ensureStandardAccounts: () => Promise<Record<string, any>>;
};

export async function bootP15App(): Promise<P15App> {
  loadP15Env();
  const jwtSecret = p15Secret('JWT_SECRET');
  const aesSecret = p15Secret('AES_SECRET_KEY');

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
      const id = randomUUID();
      const user = await prisma.user.create({
        data: {
          id,
          email: `nex_p15_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${id.slice(0, 8)}@nex-p15.test`,
          fullName: `P15 ${label}`,
          roles: roles as any,
          status: 'ACTIVE' as any,
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
          name: name || `nex_p15_staff_${randomUUID().slice(0, 8)}`,
        },
      });
    },
    ensureStandardAccounts: async () => {
      const defs = [
        { code: '11100', name: 'Kas Utama (P15)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: true },
        { code: '11200', name: 'Bank BCA (P15)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: true },
        { code: '11300', name: 'Piutang Usaha Kontrol (P15)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: false },
        { code: '11400', name: 'Persediaan Bahan Baku (P15)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: false },
        { code: '11500', name: 'Persediaan Barang Jadi (P15)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: false },
        { code: '21100', name: 'Utang Usaha Kontrol (P15)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY, allowManualJournal: false },
        { code: '21200', name: 'Client Escrow Deposit (P15)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY, allowManualJournal: true },
        { code: '21300', name: 'PPN Keluaran (P15)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY, allowManualJournal: true },
        { code: '11600', name: 'PPN Masukan (P15)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: true },
        { code: '41100', name: 'Pendapatan Penjualan Maklon (P15)', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE, allowManualJournal: true },
        { code: '51100', name: 'Beban Pokok Penjualan HPP (P15)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, allowManualJournal: true },
        { code: '61100', name: 'Beban Operasional Umum (P15)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, allowManualJournal: true },
        { code: '61200', name: 'Beban Komersial & Operasional (P15)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, allowManualJournal: true },
        { code: '62200', name: 'Beban COPQ Kerugian Kualitas (P15)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, allowManualJournal: true },
      ];

      const accMap: Record<string, any> = {};
      for (const d of defs) {
        let acc = await prisma.account.findUnique({ where: { code: d.code } });
        if (!acc) {
          acc = await prisma.account.create({ data: d });
        } else {
          acc = await prisma.account.update({
            where: { id: acc.id },
            data: { allowManualJournal: d.allowManualJournal },
          });
        }
        accMap[d.code] = acc;
      }
      return accMap;
    },
  };
}

export async function cleanP15Residuals(prisma: PrismaService): Promise<void> {
  const p15Users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'nex-p15' } },
        { email: { startsWith: 'nex_p15' } },
      ],
    },
    select: { id: true },
  });
  const userIds = p15Users.map((u) => u.id);

  // Delete journal lines & entries with nex_p15 or P15 in reference/description
  const journals = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { reference: { contains: 'P15' } },
        { reference: { contains: 'nex_p15' } },
        { description: { contains: 'P15' } },
        { description: { contains: 'nex_p15' } },
      ],
    },
    select: { id: true },
  });
  if (journals.length > 0) {
    const jIds = journals.map((j) => j.id);
    await prisma.journalLine.deleteMany({ where: { journalId: { in: jIds } } });
    await prisma.journalEntry.deleteMany({ where: { id: { in: jIds } } });
  }

  // Delete fund requests
  await prisma.fundRequest.deleteMany({
    where: {
      OR: [
        { requesterId: { in: userIds } },
        { reason: { contains: 'P15' } },
        { reason: { contains: 'nex_p15' } },
      ],
    },
  });

  // Delete adjustment journals
  await prisma.adjustmentJournal.deleteMany({
    where: {
      OR: [
        { description: { contains: 'P15' } },
        { description: { contains: 'nex_p15' } },
      ],
    },
  });

  // Delete client escrows
  await prisma.clientEscrow.deleteMany({
    where: {
      OR: [
        { notes: { contains: 'P15' } },
        { notes: { contains: 'nex_p15' } },
        { purpose: { contains: 'P15' } },
      ],
    },
  });

  // Delete payments & invoices
  await prisma.payment.deleteMany({
    where: {
      invoice: {
        OR: [
          { invoiceNumber: { contains: 'P15' } },
          { invoiceNumber: { contains: 'nex_p15' } },
        ],
      },
    },
  });
  await prisma.invoice.deleteMany({
    where: {
      OR: [
        { invoiceNumber: { contains: 'P15' } },
        { invoiceNumber: { contains: 'nex_p15' } },
      ],
    },
  });

  // Delete COPQ records
  await prisma.cOPQRecord.deleteMany({
    where: {
      reason: { contains: 'p15' },
    },
  });

  // Delete Work Orders & Production Plans
  await prisma.workOrder.deleteMany({
    where: {
      woNumber: { contains: 'P15' },
    },
  });
  await prisma.productionPlan.deleteMany({
    where: {
      batchNo: { contains: 'P15' },
    },
  });

  // Delete Sales Orders & Leads
  await prisma.salesOrderItem.deleteMany({
    where: {
      salesOrder: {
        orderNumber: { contains: 'P15' },
      },
    },
  });
  await prisma.salesOrder.deleteMany({
    where: {
      orderNumber: { contains: 'P15' },
    },
  });
  await prisma.sampleRequest.deleteMany({
    where: {
      sampleCode: { contains: 'P15' },
    },
  });
  await prisma.salesLead.deleteMany({
    where: {
      clientName: { contains: 'p15' },
    },
  });
  await prisma.bussdevStaff.deleteMany({
    where: {
      name: { contains: 'p15' },
    },
  });

  // Delete PO items & POs
  await prisma.purchaseOrderItem.deleteMany({
    where: {
      po: {
        poNumber: { contains: 'P15' },
      },
    },
  });
  await prisma.purchaseOrder.deleteMany({
    where: {
      poNumber: { contains: 'P15' },
    },
  });

  // Delete customers & suppliers
  await prisma.customer.deleteMany({
    where: {
      OR: [
        { name: { contains: 'P15' } },
        { name: { contains: 'nex_p15' } },
        { code: { contains: 'P15' } },
      ],
    },
  });
  await prisma.supplier.deleteMany({
    where: {
      OR: [
        { name: { contains: 'P15' } },
        { name: { contains: 'nex_p15' } },
      ],
    },
  });

  // Delete materials
  await prisma.materialValuation.deleteMany({
    where: {
      referenceNo: { contains: 'P15' },
    },
  });
  await prisma.materialItem.deleteMany({
    where: {
      OR: [
        { name: { contains: 'P15' } },
        { name: { contains: 'nex_p15' } },
      ],
    },
  });

  // Delete period locks & test financial periods
  await prisma.periodLock.deleteMany({
    where: {
      OR: [
        { notes: { contains: 'P15' } },
        { notes: { contains: 'nex_p15' } },
      ],
    },
  });
  await prisma.financialPeriod.deleteMany({
    where: {
      name: { contains: 'P15' },
    },
  });

  // Delete test users
  if (userIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

export function p15Message(res: any): string {
  if (!res || !res.body) return '';
  if (typeof res.body.message === 'string') return res.body.message;
  if (Array.isArray(res.body.message)) return res.body.message.join('; ');
  if (typeof res.body.error === 'string') return res.body.error;
  if (res.body.error && typeof res.body.error.message === 'string') return res.body.error.message;
  return JSON.stringify(res.body);
}
