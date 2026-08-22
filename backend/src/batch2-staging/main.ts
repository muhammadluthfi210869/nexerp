import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Batch2StagingModule } from './batch2-staging.module';
import { PrismaService } from '../prisma/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const DB_URL = process.env.DATABASE_URL || '';
const ALLOWED = ['erp_db_test', 'erp_db_staging', 'erp_db_migcheck'];
if (!ALLOWED.some((n) => DB_URL.includes(n))) {
  // SAFETY: never boot this harness against the protected production `erp_db`.
  console.error(
    '[BATCH2-STAGING] SAFETY: refusing to boot. DATABASE_URL must point to an ' +
      'isolated test/staging database (one of: ' +
      ALLOWED.join(', ') +
      '). Got: ' +
      (DB_URL || '<empty>'),
  );
  process.exit(1);
}

async function bootstrap() {
  const app = await NestFactory.create(Batch2StagingModule);

  // Frontend (next dev on :3000) calls this backend on :3002 — cross-origin.
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // Idempotent real demo user for prototype-OFF frontend login.
  const prisma = app.get(PrismaService);
  const email = process.env.BATCH2_DEMO_EMAIL || 'rnd.demo@nexerp.id';
  const password = process.env.BATCH2_DEMO_PASSWORD || 'Batch2Demo123!';
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, roles: ['SUPER_ADMIN', 'RND', 'COMMERCIAL'] },
    create: {
      email,
      passwordHash: hash,
      fullName: 'Batch2 RND Demo',
      roles: ['SUPER_ADMIN', 'RND', 'COMMERCIAL'],
    },
  });
  Logger.log(`[BATCH2-STAGING] ensured demo user ${email}`);

  const port = parseInt(process.env.BATCH2_STAGING_PORT || '3002', 10);
  await app.listen(port);
  Logger.log(
    `[BATCH2-STAGING] Batch-2 vertical-slice backend listening on :${port}`,
  );
}

bootstrap().catch((err) => {
  console.error('[BATCH2-STAGING] boot failed:', err);
  process.exit(1);
});
