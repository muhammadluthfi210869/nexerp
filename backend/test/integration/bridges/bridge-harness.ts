/**
 * Shared test harness for Cross-Phase Bridge Integration (P00–P15).
 * Boots NestJS AppModule against PostgreSQL, signs valid JWT tokens for all roles,
 * and tracks / cleans all test artifacts to guarantee 0 database residue.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { randomUUID } from 'crypto';
import { AccountType, NormalBalance, ReportGroup } from '@prisma/client';

import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';
import { PlatformConfig } from '../../../src/platform/config/config.module';
import { validationExceptionFactory } from '../../../src/common/validation/validation-error.factory';

export const BACKEND_ROOT = path.resolve(__dirname, '..', '..', '..');

export function loadBridgeEnv(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function bridgeSecret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

export type BridgeApp = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
  createUser: (label: string, roles: any[], tenantId?: string) => Promise<{ user: any; token: string }>;
  ensureStandardAccounts: () => Promise<Record<string, any>>;
};

export async function bootBridgeApp(): Promise<BridgeApp> {
  loadBridgeEnv();
  const jwtSecret = bridgeSecret('JWT_SECRET');
  const aesSecret = bridgeSecret('AES_SECRET_KEY');

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
          email: `bridge_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${id.slice(0, 8)}@bridge.test`,
          fullName: `Bridge ${label}`,
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
    ensureStandardAccounts: async () => {
      const defs = [
        { code: '11100', name: 'Kas Utama (Bridge)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: true },
        { code: '11200', name: 'Bank BCA (Bridge)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: true },
        { code: '11300', name: 'Piutang Usaha Kontrol (Bridge)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: false },
        { code: '11400', name: 'Persediaan Bahan Baku (Bridge)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: false },
        { code: '11500', name: 'Persediaan Barang Jadi (Bridge)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: false },
        { code: '21100', name: 'Utang Usaha Kontrol (Bridge)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY, allowManualJournal: false },
        { code: '21200', name: 'Client Escrow Deposit (Bridge)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY, allowManualJournal: true },
        { code: '21300', name: 'PPN Keluaran (Bridge)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY, allowManualJournal: true },
        { code: '11600', name: 'PPN Masukan (Bridge)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET, allowManualJournal: true },
        { code: '41100', name: 'Pendapatan Penjualan Maklon (Bridge)', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE, allowManualJournal: true },
        { code: '51100', name: 'Beban Pokok Penjualan HPP (Bridge)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS, allowManualJournal: true },
        { code: '61100', name: 'Beban Operasional Umum (Bridge)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, allowManualJournal: true },
        { code: '61200', name: 'Beban Komersial & Operasional (Bridge)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, allowManualJournal: true },
        { code: '62200', name: 'Beban COPQ Kerugian Kualitas (Bridge)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX, allowManualJournal: true },
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

export async function cleanBridgeResiduals(prisma: PrismaService): Promise<void> {
  // 1. Clean users created for bridges
  const bridgeUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'bridge.test' } },
        { email: { startsWith: 'bridge_' } },
      ],
    },
    select: { id: true },
  });
  const userIds = bridgeUsers.map((u) => u.id);

  // 2. Delete test journal entries
  const journals = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { reference: { contains: 'BRIDGE' } },
        { reference: { contains: 'bridge_' } },
        { description: { contains: 'Bridge' } },
        { description: { contains: 'bridge_' } },
      ],
    },
    select: { id: true },
  });
  if (journals.length > 0) {
    const jIds = journals.map((j) => j.id);
    await prisma.journalLine.deleteMany({ where: { journalId: { in: jIds } } });
    await prisma.journalEntry.deleteMany({ where: { id: { in: jIds } } });
  }

  // 3. Delete invoices & payments created for bridge
  const bridgeInvoices = await prisma.invoice.findMany({
    where: {
      OR: [
        { invoiceNumber: { contains: 'BRIDGE' } },
        { invoiceNumber: { contains: 'bridge' } },
      ],
    },
    select: { id: true },
  });
  if (bridgeInvoices.length > 0) {
    const invIds = bridgeInvoices.map((i) => i.id);
    await prisma.payment.deleteMany({ where: { invoiceId: { in: invIds } } });
    await prisma.invoice.deleteMany({ where: { id: { in: invIds } } });
  }

  // 4. Delete sales orders & leads created for bridge
  const bridgeLeads = await prisma.salesLead.findMany({
    where: {
      OR: [
        { brandName: { contains: 'Bridge', mode: 'insensitive' } },
        { clientName: { contains: 'Bridge', mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });
  const leadIds = bridgeLeads.map((l) => l.id);

  const bridgeOrders = await prisma.salesOrder.findMany({
    where: {
      OR: [
        { orderNumber: { contains: 'BRIDGE', mode: 'insensitive' } },
        ...(leadIds.length > 0 ? [{ leadId: { in: leadIds } }] : []),
      ],
    },
    select: { id: true },
  });
  if (bridgeOrders.length > 0) {
    const soIds = bridgeOrders.map((o) => o.id);
    await prisma.salesOrderItem.deleteMany({ where: { soId: { in: soIds } } });
    await prisma.salesOrder.deleteMany({ where: { id: { in: soIds } } });
  }

  // 5. Delete formulas referencing bridge samples or with bridge codes
  await prisma.formula.deleteMany({
    where: {
      OR: [
        { formulaCode: { contains: 'BRIDGE', mode: 'insensitive' } },
        { formulaCode: { contains: 'FORM-BR', mode: 'insensitive' } },
        { formulaCode: { contains: 'FORM-CP', mode: 'insensitive' } },
        ...(leadIds.length > 0 ? [{ sampleRequest: { leadId: { in: leadIds } } }] : []),
      ],
    },
  });

  if (leadIds.length > 0) {
    await prisma.sampleRequest.deleteMany({ where: { leadId: { in: leadIds } } });
    await prisma.salesLead.deleteMany({ where: { id: { in: leadIds } } });
  }

  // 7. Delete materials & valuations
  const bridgeMaterials = await prisma.materialItem.findMany({
    where: {
      OR: [
        { code: { contains: 'BRIDGE' } },
        { name: { contains: 'bridge' } },
      ],
    },
    select: { id: true },
  });
  if (bridgeMaterials.length > 0) {
    const mIds = bridgeMaterials.map((m) => m.id);
    await prisma.materialValuation.deleteMany({ where: { materialId: { in: mIds } } });
    await prisma.purchaseOrderItem.deleteMany({ where: { materialId: { in: mIds } } });
    await prisma.materialItem.deleteMany({ where: { id: { in: mIds } } });
  }

  // 8. Delete purchase orders
  await prisma.purchaseOrder.deleteMany({
    where: {
      OR: [
        { poNumber: { contains: 'BRIDGE' } },
        { poNumber: { contains: 'bridge' } },
      ],
    },
  });

  // 9. Delete suppliers
  await prisma.supplier.deleteMany({
    where: {
      name: { contains: 'bridge' },
    },
  });

  // 10. Delete customers
  await prisma.customer.deleteMany({
    where: {
      name: { contains: 'bridge' },
    },
  });

  // 11. Delete bridge users
  if (userIds.length > 0) {
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.activityLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

export function bridgeErrorMessage(body: any): string {
  return String(body?.error?.message ?? body?.message ?? JSON.stringify(body ?? ''));
}
