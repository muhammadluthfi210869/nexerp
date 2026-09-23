/**
 * Shared harness for P09 HTTP-level acceptance suites.
 *
 * Boots the real Nest application (AppModule) against the test/dev database,
 * using production guards, filters, pipes, and signing real JWT tokens.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { PlatformConfig } from '../../src/platform/config/config.module';
import { validationExceptionFactory } from '../../src/common/validation/validation-error.factory';

export const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

export function loadP09Env(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function p09Secret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

import { randomUUID } from 'crypto';

export type P09App = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
  createUser: (label: string, roles: any[], tenantId?: string) => Promise<{ user: any; token: string }>;
};

export async function bootP09App(): Promise<P09App> {
  loadP09Env();
  const jwtSecret = p09Secret('JWT_SECRET');
  const aesSecret = p09Secret('AES_SECRET_KEY');

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
    createUser: async (label: string, roles: any[], tenantId?: string) => {
      const id = randomUUID();
      const user = await prisma.user.create({
        data: {
          id,
          email: `${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${id.slice(0, 8)}@nex-p09.test`,
          fullName: `P09 ${label}`,
          roles: roles as any,
          status: 'ACTIVE' as any,
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
  };
}

export const p09Message = (body: any): string => {
  const base = String(body?.error?.message ?? body?.message ?? '');
  const fe = body?.error?.fieldErrors ?? body?.fieldErrors;
  const fields = fe ? JSON.stringify(fe) : '';
  return `${base} ${fields}`;
};
