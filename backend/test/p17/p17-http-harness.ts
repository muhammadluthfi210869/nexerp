/**
 * Shared harness for P17 HTTP-level acceptance suites
 * (Documents, Communication, Integrations, and Automation).
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

export function loadP17Env(): void {
  loadEnv({ path: path.join(BACKEND_ROOT, '.env'), override: false });
}

export function p17Secret(name: 'JWT_SECRET' | 'AES_SECRET_KEY'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`backend/.env must provide ${name} (>= 32 chars)`);
  }
  return value;
}

export type P17App = {
  app: INestApplication;
  prisma: PrismaService;
  jwtSecret: string;
  aesSecret: string;
  tokenFor: (user: { id: string; email: string; roles: any[] }, tenantId?: string) => string;
  createUser: (label: string, roles: any[], tenantId?: string) => Promise<{ user: any; token: string }>;
  cleanupP17Data: () => Promise<void>;
};

export async function bootP17App(): Promise<P17App> {
  loadP17Env();
  const jwtSecret = p17Secret('JWT_SECRET');
  const aesSecret = p17Secret('AES_SECRET_KEY');

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

  const cleanupP17Data = async () => {
    // 1. Mentions
    await prisma.communicationMention.deleteMany({
      where: {
        OR: [
          { mentionedUser: { email: { contains: 'p17' } } },
          { reply: { thread: { contextType: { contains: 'p17' } } } },
          { reply: { thread: { title: { contains: 'p17' } } } },
          { reply: { thread: { title: { contains: 'P17' } } } },
        ],
      },
    }).catch(() => {});

    // 2. Attachments
    await prisma.communicationAttachment.deleteMany({
      where: {
        OR: [
          { filename: { contains: 'p17' } },
          { uploadedBy: { email: { contains: 'p17' } } },
          { thread: { contextType: { contains: 'p17' } } },
        ],
      },
    }).catch(() => {});

    // 3. Replies
    await prisma.communicationThreadReply.deleteMany({
      where: {
        OR: [
          { author: { email: { contains: 'p17' } } },
          { thread: { contextType: { contains: 'p17' } } },
          { thread: { title: { contains: 'p17' } } },
          { thread: { title: { contains: 'P17' } } },
        ],
      },
    }).catch(() => {});

    // 4. Threads
    await prisma.communicationThread.deleteMany({
      where: {
        OR: [
          { contextType: { contains: 'p17' } },
          { title: { contains: 'p17' } },
          { title: { contains: 'P17' } },
          { createdBy: { email: { contains: 'p17' } } },
        ],
      },
    }).catch(() => {});

    // 5. Document Drafts
    await prisma.documentDraft.deleteMany({
      where: {
        OR: [
          { draftNumber: { contains: 'p17' } },
          { draftNumber: { contains: 'P17' } },
          { notes: { contains: 'p17' } },
          { notes: { contains: 'P17' } },
        ],
      },
    }).catch(() => {});

    // 6. Notifications
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { title: { contains: 'p17' } },
          { title: { contains: 'P17' } },
          { user: { email: { contains: 'p17' } } },
        ],
      },
    }).catch(() => {});

    // 8. Outbox DLQ & Events
    await prisma.outboxDlq.deleteMany({
      where: {
        OR: [
          { reason: { contains: 'p17' } },
          { reason: { contains: 'MAX_RETRIES' } },
          { reason: { contains: 'CIRCUIT_BREAKER' } },
        ],
      },
    }).catch(() => {});

    await prisma.outboxEvent.deleteMany({
      where: {
        OR: [
          { eventType: { contains: 'p17' } },
          { eventType: { contains: 'mention' } },
          { eventType: { contains: 'document' } },
          { payload: { path: ['entityId'], string_contains: 'p17' } },
        ],
      },
    }).catch(() => {});

    // 9. Activity Log
    await prisma.activityLog.deleteMany({
      where: {
        OR: [
          { user: { email: { contains: 'p17' } } },
          { entityType: 'FileAttachment' },
          { entityType: 'EntityNote' },
          { entityType: 'EntityAttachment' },
        ],
      },
    }).catch(() => {});

    // 10. Users
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'p17' },
      },
    }).catch(() => {});
  };

  const tokenFor = (user: { id: string; email: string; roles: any[] }, tenantId = 'p17-test-tenant') => {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        tenantId,
      },
      jwtSecret,
      { expiresIn: '2h' },
    );
  };

  const createUser = async (label: string, roles: any[] = [UserRole.ADMIN], tenantId = 'p17-test-tenant') => {
    const slug = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const email = `nex_p17_${slug}_${randomUUID().slice(0, 8)}@p17.test`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: '$2b$10$dummyHashP17HarnessPasswd00000000000000000000000000000',
        fullName: `P17 ${label} User`,
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
    cleanupP17Data,
  };
}
