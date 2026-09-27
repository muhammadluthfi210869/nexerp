/**
 * Shared harness for the P08 HTTP-level acceptance suites (C1).
 *
 * Boots the REAL Nest application (AppModule: every controller, guard, pipe and
 * filter) against the live PostgreSQL named by `backend/.env` `DATABASE_URL`, and
 * signs real JWTs with the loopback `JWT_SECRET` so every call in the suites
 * travels the production HTTP composition — guards included.
 *
 * Not a spec file: `testRegex` only matches `*.e2e-spec.ts`, so jest never loads
 * this module as a suite.
 *
 * Fixtures in the suites create tenants, users and leads only. They never create
 * the audit row, outbox event, payment verification, approval, finalized state or
 * permit record being proved.
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

/** Loads `backend/.env` once, without clobbering anything already in the process. */
export function loadP08Env(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function p08Secret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

export type P08App = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
};

/**
 * Boots the production application. `PlatformConfig` is the one override: it is
 * the composition-root config object the P07 HTTP closure suite also supplies,
 * and it carries the same secrets `backend/.env` holds. No service, guard,
 * repository or transaction is replaced.
 */
export async function bootP08App(): Promise<P08App> {
  loadP08Env();
  const jwtSecret = p08Secret('JWT_SECRET');
  const aesSecret = p08Secret('AES_SECRET_KEY');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PlatformConfig)
    .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
    .compile();

  const app = moduleFixture.createNestApplication();
  // Exactly the production pipe configuration (src/main.ts); the test app binds
  // no HTTP prefix, so paths are called without the `/v1` mount.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
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
  };
}

/**
 * The canonical machine-readable code the platform emits, read from the
 * production error envelope (`CanonicalErrorFilter`, bound as `APP_FILTER`).
 */
export const p08Code = (body: any): string | undefined => body?.error?.code;

/** The human-readable, already-scrubbed message from the same envelope. */
export const p08Message = (body: any): string => String(body?.error?.message ?? '');
