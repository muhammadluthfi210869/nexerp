/**
 * Shared harness for P18 HTTP-level acceptance suites
 * (Reporting, Executive Analytics & KPI Governance).
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
import { UserRole } from '@prisma/client';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { PlatformConfig } from '../../src/platform/config/config.module';
import { validationExceptionFactory } from '../../src/common/validation/validation-error.factory';

export const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

export function loadP18Env(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function p18Secret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

export type P18App = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
  createUser: (label: string, roles: any[], tenantId?: string) => Promise<{ user: any; token: string }>;
  cleanupP18Data: () => Promise<void>;
};

export async function bootP18App(): Promise<P18App> {
  loadP18Env();
  const jwtSecret = p18Secret('JWT_SECRET');
  const aesSecret = p18Secret('AES_SECRET_KEY');

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

  const cleanupP18Data = async () => {
    // 1. Activity Logs
    await prisma.activityLog.deleteMany({
      where: {
        OR: [
          { user: { email: { contains: 'p18' } } },
          { path: { contains: 'p18' } },
          { entityId: { contains: 'p18' } },
        ],
      },
    }).catch(() => {});

    // 2. SalesInvoiceLineItems & SalesInvoices
    await prisma.salesInvoiceLineItem.deleteMany({
      where: {
        invoice: { invoiceNumber: { contains: 'P18' } },
      },
    }).catch(() => {});

    await prisma.salesInvoice.deleteMany({
      where: {
        OR: [
          { invoiceNumber: { contains: 'P18' } },
          { notes: { contains: 'p18' } },
        ],
      },
    }).catch(() => {});

    // 3. Payments & Unified Invoices
    await prisma.payment.deleteMany({
      where: {
        invoice: { invoiceNumber: { contains: 'P18' } },
      },
    }).catch(() => {});

    await prisma.invoice.deleteMany({
      where: {
        OR: [
          { invoiceNumber: { contains: 'P18' } },
          { description: { contains: 'p18' } },
        ],
      },
    }).catch(() => {});

    // 4. Journal lines and entries
    await prisma.journalLine.deleteMany({
      where: {
        journal: { description: { contains: 'P18' } },
      },
    }).catch(() => {});

    await prisma.journalEntry.deleteMany({
      where: {
        description: { contains: 'P18' },
      },
    }).catch(() => {});

    // 5. DeliveryOrders & WorkOrders
    await prisma.deliveryOrder.deleteMany({
      where: {
        workOrder: { woNumber: { contains: 'P18' } },
      },
    }).catch(() => {});

    await prisma.workOrder.deleteMany({
      where: {
        woNumber: { contains: 'P18' },
      },
    }).catch(() => {});

    // 6. SalesOrders & SalesLeads
    await prisma.salesOrder.deleteMany({
      where: {
        orderNumber: { contains: 'P18' },
      },
    }).catch(() => {});

    await prisma.salesLead.deleteMany({
      where: {
        OR: [
          { clientName: { contains: 'P18' } },
          { contactInfo: { contains: 'p18' } },
        ],
      },
    }).catch(() => {});

    // 7. Inventories & Materials
    await prisma.materialInventory.deleteMany({
      where: {
        batchNumber: { contains: 'P18' },
      },
    }).catch(() => {});

    await prisma.materialItem.deleteMany({
      where: {
        name: { contains: 'P18' },
      },
    }).catch(() => {});

    // 8. Customers & Suppliers
    await prisma.customer.deleteMany({
      where: {
        name: { contains: 'P18' },
      },
    }).catch(() => {});

    await prisma.supplier.deleteMany({
      where: {
        name: { contains: 'P18' },
      },
    }).catch(() => {});

    // 9. Users
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'p18' },
      },
    }).catch(() => {});
  };

  const tokenFor = (
    user: { id: string; email: string; roles: any[] },
    tenantId?: string,
  ): string => {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        tenantId: tenantId || 'tenant-default',
        type: 'ACCESS',
      },
      jwtSecret,
      { expiresIn: '1h' },
    );
  };

  const createUser = async (
    label: string,
    roles: any[] = [UserRole.SUPER_ADMIN],
    tenantId?: string,
  ): Promise<{ user: any; token: string }> => {
    const slug = `${label.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const email = `p18-${slug}@nexerp.test`;
    const user = await prisma.user.create({
      data: {
        email,
        fullName: `P18 ${label}`,
        passwordHash: '$2b$10$e8wF5q1tU8Z0Y4u9X0M8ue1c0V9k9P9L9N9M9O9P9Q9R9S9T9U9V9', // dummy bcrypt hash
        roles,
        status: 'ACTIVE',
      },
    });
    const token = tokenFor(user, tenantId);
    return { user, token };
  };

  return {
    app,
    prisma,
    jwtSecret,
    aesSecret,
    tokenFor,
    createUser,
    cleanupP18Data,
  };
}
