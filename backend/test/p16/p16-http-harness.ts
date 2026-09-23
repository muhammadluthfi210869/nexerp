/**
 * Shared harness for P16 HTTP-level acceptance suites (HR, Recruitment, Training, Attendance, KPI & Payroll).
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

export function loadP16Env(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function p16Secret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

export type P16App = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
  createUser: (label: string, roles: any[], tenantId?: string) => Promise<{ user: any; token: string }>;
  cleanupP16Data: () => Promise<void>;
};

export async function bootP16App(): Promise<P16App> {
  loadP16Env();
  const jwtSecret = p16Secret('JWT_SECRET');
  const aesSecret = p16Secret('AES_SECRET_KEY');

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

  const cleanupP16Data = async () => {
    // Teardown P16 test records in topological order
    // 1. Candidate
    await prisma.candidate.deleteMany({
      where: {
        OR: [
          { email: { contains: 'p16' } },
          { name: { contains: 'P16' } },
        ],
      },
    }).catch(() => {});

    // 2. Payroll items & payrolls
    await prisma.payrollItem.deleteMany({
      where: {
        employee: {
          OR: [
            { name: { contains: 'P16' } },
            { nik: { contains: 'P16' } },
          ],
        },
      },
    }).catch(() => {});
    await prisma.payroll.deleteMany({}).catch(() => {});

    // 3. Loans & Trainings
    await prisma.employeeLoan.deleteMany({
      where: {
        employee: {
          OR: [
            { name: { contains: 'P16' } },
            { nik: { contains: 'P16' } },
          ],
        },
      },
    }).catch(() => {});
    await prisma.employeeTraining.deleteMany({
      where: {
        employee: {
          OR: [
            { name: { contains: 'P16' } },
            { nik: { contains: 'P16' } },
          ],
        },
      },
    }).catch(() => {});

    // 4. Tickets & Attendance
    await prisma.attendance.deleteMany({
      where: {
        employee: {
          OR: [
            { name: { contains: 'P16' } },
            { nik: { contains: 'P16' } },
          ],
        },
      },
    }).catch(() => {});
    await prisma.ticket.deleteMany({
      where: {
        employee: {
          OR: [
            { name: { contains: 'P16' } },
            { nik: { contains: 'P16' } },
          ],
        },
      },
    }).catch(() => {});

    // 5. EmployeeRoleMapping, KpiPointLog & KpiScore
    await prisma.kpiScore.deleteMany({
      where: {
        employee: {
          OR: [
            { name: { contains: 'P16' } },
            { nik: { contains: 'P16' } },
          ],
        },
      },
    }).catch(() => {});
    await prisma.employeeRoleMapping.deleteMany({
      where: {
        employee: {
          OR: [
            { name: { contains: 'P16' } },
            { nik: { contains: 'P16' } },
          ],
        },
      },
    }).catch(() => {});
    await prisma.kpiPointLog.deleteMany({
      where: {
        employee: {
          OR: [
            { name: { contains: 'P16' } },
            { nik: { contains: 'P16' } },
          ],
        },
      },
    }).catch(() => {});

    // Clear manager self/subordinate references before deleting
    await prisma.employee.updateMany({
      where: {
        OR: [
          { name: { contains: 'P16' } },
          { nik: { contains: 'P16' } },
        ],
      },
      data: { managerId: null },
    }).catch(() => {});

    // 6. Employees
    await prisma.employee.deleteMany({
      where: {
        OR: [
          { name: { contains: 'P16' } },
          { nik: { contains: 'P16' } },
        ],
      },
    }).catch(() => {});

    // 7. ActivityLog for test users
    await prisma.activityLog.deleteMany({
      where: {
        user: {
          email: { contains: 'p16' },
        },
      },
    }).catch(() => {});

    // 8. Users
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'p16' },
      },
    }).catch(() => {});
  };

  return {
    app,
    prisma,
    jwtSecret,
    aesSecret,
    cleanupP16Data,
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
          email: `nex_p16_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${id.slice(0, 8)}@nex-p16.test`,
          fullName: `P16 ${label}`,
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
  };
}

export function p16Message(res: any): string {
  if (!res || !res.body) return '';
  if (typeof res.body.detail === 'string') return res.body.detail;
  if (typeof res.body.message === 'string') return res.body.message;
  if (Array.isArray(res.body.message)) return res.body.message.join('; ');
  if (typeof res.body.error === 'string') return res.body.error;
  if (res.body.error && typeof res.body.error.message === 'string') return res.body.error.message;
  return JSON.stringify(res.body);
}
