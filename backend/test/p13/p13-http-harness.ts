/**
 * Shared harness for P13 HTTP-level acceptance suites (Production Execution & BMR).
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

export function loadP13Env(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function p13Secret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

export type P13App = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
  createUser: (label: string, roles: any[], tenantId?: string, managerPin?: string) => Promise<{ user: any; token: string }>;
  createStaff: (name?: string) => Promise<any>;
};

export async function bootP13App(): Promise<P13App> {
  loadP13Env();
  const jwtSecret = p13Secret('JWT_SECRET');
  const aesSecret = p13Secret('AES_SECRET_KEY');

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
          email: `${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${id.slice(0, 8)}@nex-p13.test`,
          fullName: `P13 ${label}`,
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
          name: name || `nex_p13_staff_${randomUUID().slice(0, 8)}`,
        },
      });
    },
  };
}

export function p13Message(res: { body?: any; text?: string }): string {
  if (res.body && typeof res.body === 'object') {
    if (typeof res.body.message === 'string') return res.body.message;
    if (Array.isArray(res.body.message)) return res.body.message.join('; ');
    if (typeof res.body.error === 'string') return res.body.error;
    return JSON.stringify(res.body);
  }
  return res.text ?? '';
}
