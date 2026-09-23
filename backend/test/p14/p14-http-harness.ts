/**
 * Shared harness for P14 HTTP-level acceptance suites (QC, Quarantine, Release & Traceability).
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

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { PlatformConfig } from '../../src/platform/config/config.module';
import { validationExceptionFactory } from '../../src/common/validation/validation-error.factory';

export const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

export function loadP14Env(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function p14Secret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

export type P14App = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
  createUser: (label: string, roles: any[], tenantId?: string, managerPin?: string) => Promise<{ user: any; token: string }>;
  createStaff: (name?: string) => Promise<any>;
};

export async function bootP14App(): Promise<P14App> {
  loadP14Env();
  const jwtSecret = p14Secret('JWT_SECRET');
  const aesSecret = p14Secret('AES_SECRET_KEY');

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
          email: user.email,
          roles: user.roles,
          ...(tenantId ? { organizationId: tenantId, tenantId } : {}),
        },
        jwtSecret,
      ),
    createUser: async (label: string, roles: any[], tenantId?: string, managerPin?: string) => {
      const id = randomUUID();
      const validRoleMap: Record<string, string> = {
        PRODUCTION_ADMIN: 'PRODUCTION',
        PRODUCTION_OPERATOR: 'PRODUCTION_OP',
        PRODUCTION_SUPERVISOR: 'HEAD_OPS',
      };
      const sanitizedRoles = roles.map((r: string) => validRoleMap[r] || r);
      const user = await prisma.user.create({
        data: {
          id,
          email: `nex_p14_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${id.slice(0, 8)}@nex-p14.test`,
          fullName: `P14 ${label}`,
          roles: sanitizedRoles as any,
          status: 'ACTIVE' as any,
          ...(managerPin ? { managerPin } : {}),
        },
      });
      const token = jwt.sign(
        {
          sub: user.id,
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
          name: name || `nex_p14_staff_${randomUUID().slice(0, 8)}`,
        },
      });
    },
  };
}

export async function cleanP14Residuals(prisma: PrismaService): Promise<void> {
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'nex-p14' } },
        { email: { startsWith: 'nex_p14' } },
      ],
    },
    select: { id: true },
  });
  const userIds = testUsers.map((u) => u.id);

  if (userIds.length > 0) {
    await prisma.qCAudit.deleteMany({
      where: {
        OR: [
          { qcId: { in: userIds } },
          { supervisorById: { in: userIds } },
          { notes: { contains: 'P14' } },
          { notes: { contains: 'nex_p14' } },
          { notes: { contains: 'Batch' } },
        ],
      },
    });

    const userPlans = await prisma.productionPlan.findMany({
      where: { adminId: { in: userIds } },
      select: { id: true },
    });
    const planIds = userPlans.map((p) => p.id);

    if (planIds.length > 0) {
      await prisma.qCAudit.deleteMany({
        where: { stepLog: { woId: { in: planIds } } },
      });
      await prisma.productionStepLog.deleteMany({
        where: { woId: { in: planIds } },
      });
      await prisma.productionLog.deleteMany({
        where: { planId: { in: planIds } },
      });
      await prisma.finishedGood.deleteMany({
        where: { woId: { in: planIds } },
      });
      await prisma.workOrder.deleteMany({
        where: { planId: { in: planIds } },
      });
      await prisma.cOPQRecord.deleteMany({
        where: { planId: { in: planIds } },
      });
      await prisma.rejectExecution.deleteMany({
        where: { planId: { in: planIds } },
      });
      await prisma.productionPlan.deleteMany({
        where: { id: { in: planIds } },
      });
    }

    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
  }

  // Cleanup test machines
  await prisma.machine.deleteMany({
    where: { name: { startsWith: 'nex_p14' } },
  });

  // Cleanup test material items and inventory movements
  const testMaterials = await prisma.materialItem.findMany({
    where: {
      OR: [
        { name: { startsWith: 'nex_p14' } },
        { code: { startsWith: 'nex_p14' } },
      ],
    },
    select: { id: true },
  });
  if (testMaterials.length > 0) {
    const matIds = testMaterials.map((m) => m.id);
    await prisma.materialInventory.deleteMany({
      where: { materialId: { in: matIds } },
    });
    await prisma.materialItem.deleteMany({
      where: { id: { in: matIds } },
    });
  }

  // Cleanup test sales orders, samples, leads
  const testSos = await prisma.salesOrder.findMany({
    where: {
      OR: [
        { orderNumber: { contains: 'P14' } },
        { orderNumber: { startsWith: 'SO-P14' } },
      ],
    },
    select: { id: true },
  });
  if (testSos.length > 0) {
    const soIds = testSos.map((s) => s.id);
    await prisma.salesOrder.deleteMany({ where: { id: { in: soIds } } });
  }

  await prisma.sampleRequest.deleteMany({
    where: {
      OR: [
        { sampleCode: { startsWith: 'SMP-P14' } },
        { sampleCode: { contains: 'P14' } },
      ],
    },
  });

  await prisma.salesLead.deleteMany({
    where: {
      OR: [
        { clientName: { startsWith: 'nex_p14' } },
        { clientName: { contains: 'P14' } },
      ],
    },
  });

  // Cleanup test warehouses & staff
  await prisma.warehouse.deleteMany({
    where: {
      name: { startsWith: 'nex_p14' },
    },
  });
  await prisma.bussdevStaff.deleteMany({
    where: {
      OR: [
        { name: { startsWith: 'nex_p14' } },
        { name: { contains: 'p14' } },
      ],
    },
  });
}

export function p14Message(res: any): string {
  if (!res || !res.body) return '';
  if (typeof res.body.message === 'string') return res.body.message;
  if (Array.isArray(res.body.message)) return res.body.message.join('; ');
  if (typeof res.body.error === 'string') return res.body.error;
  return JSON.stringify(res.body);
}
