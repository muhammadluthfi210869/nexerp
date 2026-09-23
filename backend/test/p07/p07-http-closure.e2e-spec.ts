import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Client } from 'pg';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { LeadCaptureService } from '../../src/modules/lead-capture/lead-capture.service';
import { OutboxService } from '../../src/platform/outbox/outbox.service';
import { PlatformConfig } from '../../src/platform/config/config.module';
import { validationExceptionFactory } from '../../src/common/validation/validation-error.factory';

/**
 * P07 — HTTP closure. Boots the REAL Nest application (AppModule: controllers,
 * guards, pipes, filters, services) against ONE disposable `nex_p07_*`
 * PostgreSQL database provisioned through the committed migration chain.
 *
 * This suite proves the production HTTP composition, not the service layer:
 *   1. unauthenticated admin lead-capture routes denied; public intake reachable
 *   2. public intake tenant is server-owned, persisted, fail-closed, not client-overridable
 *   3. authenticated create persists SalesLead.organizationId from req.user and the
 *      canonical leadCaptureId link
 *   4. cross-tenant read/update/reassign/advance is non-disclosing with zero effects
 *   5. governed advance: exactly one state effect + audit + outbox; concurrency and
 *      idempotency-key reuse are enforced by the real command
 *   6. linked-LeadCapture consent governs the HTTP qualification command
 *   7. /bussdev/dashboard reconciles exactly for tenant/date/owner/source/stage/SLA
 *   8. an outbox dependency failure AFTER the staged update leaves zero changes
 *
 * Fixtures may create tenants, users, staff and initial consent records. They
 * never create the audit, outbox, idempotency, qualified state or dashboard
 * result being proved.
 *
 * The disposable database is dropped in `finally`; cleanup failure fails the run.
 */

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const PRODUCTION_LIKE_NAME = /(^|_)(prod|production|live|real|main)($|_)/i;
const DISPOSABLE_NAME = /^nex_p07_[a-z0-9_]+$/;

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p07_http_${RUN_ID}`;
const DAY_MS = 24 * 60 * 60 * 1000;

const CONSENT_KEY = 'consent_withdrawn';

// `LeadCapture.trackingCode` is varchar(20).
const shortCode = (suffix: string) => `${RUN_ID}${suffix}`.slice(0, 20);

function readAdminUrl(): URL {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is required to provision the disposable P07 database');
  const parsed = new URL(raw);
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use the postgresql:// scheme');
  }
  if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error(`Refusing non-loopback PostgreSQL host: ${parsed.hostname}`);
  }
  const dbName = parsed.pathname.replace(/^\//, '');
  if (PRODUCTION_LIKE_NAME.test(dbName)) {
    throw new Error(`Refusing production-like database name: ${dbName}`);
  }
  parsed.pathname = '/postgres';
  return parsed;
}

describe('P07 HTTP closure (real Nest app, disposable PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let leadCaptureService: LeadCaptureService;
  let pgClient: Client;
  let adminUrl: URL;
  let dbName: string;
  let dataUrl: string;
  let jwtSecret: string;
  let aesSecret: string;

  // ── tenants / actors ──
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  const publicOrgId = randomUUID();
  let userA: any;
  let userB: any;
  let staffA: any;
  let staffA2: any;
  let tokenA: string;
  let tokenB: string;

  // ── shared promoted state (created through real HTTP, never seeded) ──
  let leadAId: string;
  let rollbackLeadId: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  function patchAdvance(
    leadId: string,
    body: Record<string, unknown>,
    opts: { token: string; idem: string; corr: string },
  ) {
    return request(app.getHttpServer())
      .patch(`/bussdev/lead/${leadId}/advance`)
      .set(auth(opts.token))
      .set('idempotency-key', opts.idem)
      .set('x-correlation-id', opts.corr)
      .send(body);
  }

  function getDashboard(token: string, query: Record<string, string> = {}) {
    return request(app.getHttpServer())
      .get('/bussdev/dashboard')
      .set(auth(token))
      .query(query);
  }

  async function trackCapture(intent: string) {
    const res = await request(app.getHttpServer())
      .post('/lead-capture/track')
      .send({ intent, pageUrl: 'https://dreamlab.id/p07-http-closure' });
    if (res.status !== 200) {
      throw new Error(`POST /lead-capture/track failed: ${res.status} ${JSON.stringify(res.body)}`);
    }
    const row = await prisma.leadCapture.findUnique({
      where: { trackingCode: res.body.trackingCode },
    });
    if (!row) throw new Error('trackingCode was not persisted');
    return row;
  }

  async function createLeadViaHttp(body: Record<string, unknown>, token: string) {
    return request(app.getHttpServer()).post('/bussdev/lead').set(auth(token)).send(body);
  }

  const sumValues = (bucket: Record<string, number>) =>
    Object.values(bucket).reduce((acc, v) => acc + v, 0);

  beforeAll(async () => {
    loadEnv({ path: path.resolve(__dirname, '..', '..', '.env'), override: false });
    adminUrl = readAdminUrl();

    dbName = `nex_p07_http_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    if (!DISPOSABLE_NAME.test(dbName)) {
      throw new Error(`Generated disposable database name violates ${DISPOSABLE_NAME}`);
    }

    const seedUrl = new URL(adminUrl.toString());
    seedUrl.pathname = `/${dbName}`;
    dataUrl = seedUrl.toString();

    pgClient = new Client({ connectionString: adminUrl.toString() });
    await pgClient.connect();
    await pgClient.query(`CREATE DATABASE "${dbName}"`);

    // Secrets come from the loopback backend/.env (never committed literals).
    const envJwt = process.env.JWT_SECRET;
    const envAes = process.env.AES_SECRET_KEY;
    if (!envJwt || envJwt.length < 32 || !envAes || envAes.length < 32) {
      throw new Error('backend/.env must provide JWT_SECRET / AES_SECRET_KEY (>= 32 chars)');
    }
    jwtSecret = envJwt;
    aesSecret = envAes;

    // Point the application (and the migration chain) at the disposable DB.
    process.env.DATABASE_URL = dataUrl;
    process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID = publicOrgId;

    // Provision the schema from the committed migration chain.
    const { spawnSync } = await import('child_process');
    const prismaBin = path.resolve(
      __dirname,
      '..',
      '..',
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
    );
    const migrate = process.platform === 'win32'
      ? spawnSync(`"${prismaBin}"`, ['migrate', 'deploy'], { cwd: process.cwd(), env: process.env, encoding: 'utf8', shell: true })
      : spawnSync(prismaBin, ['migrate', 'deploy'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' });
    if (migrate.error) throw new Error(`prisma migrate deploy spawn error: ${migrate.error.message}`);
    if (migrate.status !== 0) {
      throw new Error(`prisma migrate deploy failed: exit=${migrate.status}\n${migrate.stderr || migrate.stdout}`);
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PlatformConfig)
      .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
      .compile();

    app = moduleFixture.createNestApplication();
    // Exactly the production pipe configuration (main.ts).
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: validationExceptionFactory,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    leadCaptureService = app.get(LeadCaptureService);

    userA = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `${TAG}-a@nex-p07.test`,
        fullName: `${TAG} tenant A`,
        passwordHash: '$2b$10$N/SzrZjec.yMCM7jboDw3.vN.XZYrK4vCsZiFEgygNZctiAHyCbwC',
        roles: ['COMMERCIAL'] as any,
        status: 'ACTIVE' as any,
      },
    });
    userB = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `${TAG}-b@nex-p07.test`,
        fullName: `${TAG} tenant B`,
        passwordHash: '$2b$10$N/SzrZjec.yMCM7jboDw3.vN.XZYrK4vCsZiFEgygNZctiAHyCbwC',
        roles: ['COMMERCIAL'] as any,
        status: 'ACTIVE' as any,
      },
    });
    staffA = await prisma.bussdevStaff.create({
      data: { id: randomUUID(), organizationId: tenantA, userId: userA.id, name: `${TAG}-staff-A`, isActive: true },
    });
    staffA2 = await prisma.bussdevStaff.create({
      data: { id: randomUUID(), organizationId: tenantA, name: `${TAG}-staff-A2`, isActive: true },
    });

    tokenA = jwt.sign(
      { sub: userA.id, email: userA.email, roles: userA.roles, organizationId: tenantA, tenantId: tenantA },
      jwtSecret,
    );
    tokenB = jwt.sign(
      { sub: userB.id, email: userB.email, roles: userB.roles, organizationId: tenantB, tenantId: tenantB },
      jwtSecret,
    );
  }, 300000);

  afterAll(async () => {
    let failure: Error | null = null;
    if (app) {
      try {
        await app.close();
      } catch (e) {
        failure = new Error(`App close failed: ${(e as Error).message}`);
      }
    }
    if (pgClient) {
      try {
        await pgClient.query(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
          [dbName],
        );
        await pgClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      } catch (e) {
        failure = failure ?? new Error(`Disposable database drop failed: ${(e as Error).message}`);
      } finally {
        await pgClient.end().catch(() => {});
      }
    }
    if (failure) throw failure;
  }, 120000);

  // ── 1 ────────────────────────────────────────────────────────────────────
  it('1. unauthenticated lead-capture admin routes are denied; public intake stays reachable', async () => {
    const server = app.getHttpServer();
    const denied: Array<[string, () => request.Test]> = [
      ['GET /lead-capture', () => request(server).get('/lead-capture')],
      ['GET /lead-capture/stats', () => request(server).get('/lead-capture/stats')],
      ['GET /lead-capture/dashboard', () => request(server).get('/lead-capture/dashboard')],
      ['PATCH /lead-capture/:id', () => request(server).patch(`/lead-capture/${randomUUID()}`).send({ notes: 'x' })],
      ['POST /lead-capture/bulk-update', () => request(server).post('/lead-capture/bulk-update').send({ ids: [randomUUID()] })],
    ];
    const deniedStatuses: number[] = [];
    for (const [, call] of denied) {
      const res = await call();
      deniedStatuses.push(res.status);
      expect([401, 403]).toContain(res.status);
    }
    expect(deniedStatuses).toEqual([401, 401, 401, 401, 401]);

    // Documented public intake remains reachable without a token.
    const track = await request(server)
      .post('/lead-capture/track')
      .send({ intent: 'Konsultasi Produk', pageUrl: 'https://dreamlab.id/public' });
    expect(track.status).toBe(200);
    expect(typeof track.body.trackingCode).toBe('string');

    const wa = await request(server)
      .put('/lead-capture/whatsapp/DLPUBLIC0001')
      .send({ phone: '6281100000001', waMessage: 'halo' });
    expect(wa.status).toBe(200);
  }, 60000);

  // ── 2 ────────────────────────────────────────────────────────────────────
  it('2. public intake uses the server-owned organization, persists it, and fails closed', async () => {
    process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID = publicOrgId;
    const server = app.getHttpServer();

    // (a) create path persists the server-owned tenant.
    const tracked = await trackCapture('tenant resolution');
    expect(tracked.organizationId).toBe(publicOrgId);

    // (b) a client body cannot override the tenant — the request is refused.
    const injected = await request(server)
      .post('/lead-capture/track')
      .send({ intent: 'inject', organizationId: tenantB });
    expect(injected.status).toBe(400);
    expect(await prisma.leadCapture.count({ where: { organizationId: tenantB } })).toBe(0);

    // (c) a client query cannot override the tenant either.
    const injectedQuery = await request(server)
      .post(`/lead-capture/track?organizationId=${tenantB}`)
      .send({ intent: 'inject-query' });
    expect(injectedQuery.status).toBe(200);
    const queryRow = await prisma.leadCapture.findUnique({
      where: { trackingCode: injectedQuery.body.trackingCode },
    });
    expect(queryRow!.organizationId).toBe(publicOrgId);

    // (d) WhatsApp intake create + update paths persist the server-owned tenant.
    const phone = `62811${Date.now().toString().slice(-8)}`;
    const waCode = shortCode('WA1');
    const created = await request(server)
      .put(`/lead-capture/whatsapp/${waCode}`)
      .send({ phone, waMessage: 'first' });
    expect(created.status).toBe(200);
    const createdRow = await prisma.leadCapture.findUnique({
      where: { trackingCode: waCode },
    });
    expect(createdRow!.organizationId).toBe(publicOrgId);

    const updated = await request(server)
      .put(`/lead-capture/whatsapp/${waCode}`)
      .send({ phone, waMessage: 'second' });
    expect(updated.status).toBe(200);
    const updatedRow = await prisma.leadCapture.findUnique({
      where: { trackingCode: waCode },
    });
    expect(updatedRow!.organizationId).toBe(publicOrgId);
    expect(updatedRow!.waMessage).toBe('second');

    // (e) the residual demo webhook dedup path (create + dedup-update) too.
    const orphanPhone = `62812${Date.now().toString().slice(-8)}`;
    const orphan1 = await leadCaptureService.upsertOrphanLead(orphanPhone, 'Orphan', 'one', `${TAG}-orphan-1`);
    expect(orphan1.organizationId).toBe(publicOrgId);
    const orphan2 = await leadCaptureService.upsertOrphanLead(orphanPhone, 'Orphan', 'two', `${TAG}-orphan-2`);
    expect(orphan2.id).toBe(orphan1.id);
    expect(orphan2.organizationId).toBe(publicOrgId);

    // (f) fail closed when the server-owned tenant is invalid.
    const beforeCount = await prisma.leadCapture.count();
    process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID = 'not-a-uuid';
    const invalid = await request(server).post('/lead-capture/track').send({ intent: 'invalid' });
    expect(invalid.status).toBe(503);
    expect(invalid.body.error.code).toBe('P07_TENANT_UNRESOLVED');
    expect(await prisma.leadCapture.count()).toBe(beforeCount);

    // (g) fail closed when it is missing, for both public intake entry points.
    delete process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID;
    const missing = await request(server).post('/lead-capture/track').send({ intent: 'missing' });
    expect(missing.status).toBe(503);
    expect(missing.body.error.code).toBe('P07_TENANT_UNRESOLVED');

    const missingWa = await request(server)
      .put(`/lead-capture/whatsapp/${shortCode('WAM')}`)
      .send({ phone: '6289900000001' });
    expect(missingWa.status).toBe(503);
    expect(missingWa.body.error.code).toBe('P07_TENANT_UNRESOLVED');
    expect(await prisma.leadCapture.count()).toBe(beforeCount);

    process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID = publicOrgId;
  }, 60000);

  // ── 3 ────────────────────────────────────────────────────────────────────
  it('3. tenant-A create takes organizationId from req.user and persists the capture link', async () => {
    process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID = tenantA;
    const capture = await trackCapture('tenant A intake');
    expect(capture.organizationId).toBe(tenantA);

    const base = {
      clientName: `${TAG}-lead-A`,
      contactInfo: `+62813${Date.now().toString().slice(-8)}`,
      source: 'P07-HTTP',
      productInterest: 'HTTP closure product',
      estimatedValue: 1_000_000,
      picId: staffA.id,
    };

    const created = await createLeadViaHttp({ ...base, leadCaptureId: capture.id }, tokenA);
    expect(created.status).toBe(201);
    leadAId = created.body.id;

    const row = await prisma.salesLead.findUnique({ where: { id: leadAId } });
    expect(row!.organizationId).toBe(tenantA);
    expect(row!.leadCaptureId).toBe(capture.id);

    // Initial consent fixture for the capture that lead A was linked to, so the
    // governed advance in test 5 is allowed to run.
    await prisma.leadAttribute.create({
      data: {
        leadId: capture.id,
        key: CONSENT_KEY,
        value: 'false',
        confirmed: true,
        source: `${TAG}-fixture`,
      },
    });

    // The client cannot inject a tenant through the request body.
    const injected = await createLeadViaHttp(
      { ...base, clientName: `${TAG}-lead-inject`, organizationId: tenantB },
      tokenA,
    );
    expect(injected.status).toBe(400);
    expect(await prisma.salesLead.count({ where: { organizationId: tenantB } })).toBe(0);

    // A capture owned by another tenant is rejected and never linked.
    const foreignCapture = await prisma.leadCapture.create({
      data: {
        trackingCode: shortCode('FRN'),
        organizationId: tenantB,
        phone: `62814${Date.now().toString().slice(-8)}`,
        waMessage: 'foreign',
      },
    });
    const crossLink = await createLeadViaHttp(
      { ...base, clientName: `${TAG}-lead-crosslink`, leadCaptureId: foreignCapture.id },
      tokenA,
    );
    expect(crossLink.status).toBe(404);
    expect(await prisma.salesLead.count({ where: { leadCaptureId: foreignCapture.id } })).toBe(0);

    // A second, unlinked lead stays unqualified for the rollback proof in test 8.
    const rollbackLead = await createLeadViaHttp(
      { ...base, clientName: `${TAG}-lead-rollback` },
      tokenA,
    );
    expect(rollbackLead.status).toBe(201);
    rollbackLeadId = rollbackLead.body.id;
    expect((await prisma.salesLead.findUnique({ where: { id: rollbackLeadId } }))!.leadCaptureId).toBeNull();

    process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID = publicOrgId;
  }, 60000);

  // ── 4 ────────────────────────────────────────────────────────────────────
  it('4. tenant-B read/update/reassign/advance is non-disclosing with unchanged lead, audit and outbox', async () => {
    const server = app.getHttpServer();
    const before = {
      lead: await prisma.salesLead.findUnique({ where: { id: leadAId } }),
      audit: await prisma.auditLog.count({ where: { entityId: leadAId } }),
      outbox: await prisma.outboxEvent.count({ where: { aggregateId: leadAId } }),
    };

    const read = await request(server).get(`/bussdev/lead/${leadAId}`).set(auth(tokenB));
    expect(read.status).toBe(404);
    expect(JSON.stringify(read.body)).not.toContain('HTTP closure product');

    const update = await request(server)
      .put(`/bussdev/lead/${leadAId}`)
      .set(auth(tokenB))
      .send({ clientName: `${TAG}-HACKED` });
    expect(update.status).toBe(404);

    const reassign = await request(server)
      .put(`/bussdev/lead/${leadAId}`)
      .set(auth(tokenB))
      .send({ picId: staffA2.id });
    expect(reassign.status).toBe(404);

    const advance = await patchAdvance(
      leadAId,
      { action: 'STAGE_UPDATED', newStatus: 'CONTACTED', loggedBy: userB.id },
      { token: tokenB, idem: `${TAG}-idem-tenantB`, corr: randomUUID() },
    );
    expect(advance.status).toBe(404);

    const after = {
      lead: await prisma.salesLead.findUnique({ where: { id: leadAId } }),
      audit: await prisma.auditLog.count({ where: { entityId: leadAId } }),
      outbox: await prisma.outboxEvent.count({ where: { aggregateId: leadAId } }),
    };
    expect(after.lead!.clientName).toBe(before.lead!.clientName);
    expect(after.lead!.picId).toBe(before.lead!.picId);
    expect(after.lead!.status).toBe(before.lead!.status);
    expect(after.audit).toBe(before.audit);
    expect(after.outbox).toBe(before.outbox);

    // Tenant A may still read its own lead.
    const ownRead = await request(server).get(`/bussdev/lead/${leadAId}`).set(auth(tokenA));
    expect(ownRead.status).toBe(200);
    expect(ownRead.body.id).toBe(leadAId);
  }, 60000);

  // ── 5 ────────────────────────────────────────────────────────────────────
  it('5. governed HTTP advance: one effect/audit/outbox, concurrency and key-reuse enforced', async () => {
    const successCorr = randomUUID();
    const success = await patchAdvance(
      leadAId,
      { action: 'STAGE_UPDATED', newStatus: 'CONTACTED', loggedBy: userA.id },
      { token: tokenA, idem: `${TAG}-idem-1`, corr: successCorr },
    );
    expect(success.status).toBe(200);
    expect((await prisma.salesLead.findUnique({ where: { id: leadAId } }))!.status).toBe('CONTACTED');
    expect(
      await prisma.auditLog.count({ where: { entityId: leadAId, correlationId: successCorr, action: 'STAGE_ADVANCE' } }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({ where: { aggregateId: leadAId, correlationId: successCorr, tenantId: tenantA } }),
    ).toBe(1);
    // Exactly ONE state effect for the whole lead so far.
    expect(await prisma.outboxEvent.count({ where: { aggregateId: leadAId } })).toBe(1);

    // Three concurrent requests under the same idempotency key => one effect.
    const concurrentCorr = randomUUID();
    const dto = { action: 'STAGE_UPDATED', newStatus: 'FOLLOW_UP_1', loggedBy: userA.id };
    const results = await Promise.all([
      patchAdvance(leadAId, dto, { token: tokenA, idem: `${TAG}-idem-2`, corr: concurrentCorr }),
      patchAdvance(leadAId, dto, { token: tokenA, idem: `${TAG}-idem-2`, corr: concurrentCorr }),
      patchAdvance(leadAId, dto, { token: tokenA, idem: `${TAG}-idem-2`, corr: concurrentCorr }),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect((await prisma.salesLead.findUnique({ where: { id: leadAId } }))!.status).toBe('FOLLOW_UP_1');
    expect(
      await prisma.auditLog.count({ where: { entityId: leadAId, correlationId: concurrentCorr, action: 'STAGE_ADVANCE' } }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({ where: { aggregateId: leadAId, correlationId: concurrentCorr } }),
    ).toBe(1);
    expect(await prisma.outboxEvent.count({ where: { aggregateId: leadAId } })).toBe(2);

    // Same key with a different payload is refused and adds no effect.
    const reused = await patchAdvance(
      leadAId,
      { action: 'STAGE_UPDATED', newStatus: 'FOLLOW_UP_2', loggedBy: userA.id },
      { token: tokenA, idem: `${TAG}-idem-2`, corr: randomUUID() },
    );
    expect(reused.status).toBe(400);
    expect(reused.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect((await prisma.salesLead.findUnique({ where: { id: leadAId } }))!.status).toBe('FOLLOW_UP_1');
    expect(await prisma.outboxEvent.count({ where: { aggregateId: leadAId } })).toBe(2);
  }, 90000);

  // ── 6 ────────────────────────────────────────────────────────────────────
  it('6. linked LeadCapture consent governs the HTTP qualification command', async () => {
    process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID = tenantA;

    async function linkedLead(label: string, consent: 'granted' | 'withdrawn' | 'missing') {
      const capture = await trackCapture(`consent ${label}`);
      const res = await createLeadViaHttp(
        {
          clientName: `${TAG}-consent-${label}`,
          contactInfo: `+62815${Date.now().toString().slice(-8)}`,
          source: 'P07-HTTP-CONSENT',
          productInterest: 'consent product',
          estimatedValue: 500_000,
          picId: staffA.id,
          leadCaptureId: capture.id,
        },
        tokenA,
      );
      expect(res.status).toBe(201);
      if (consent !== 'missing') {
        await prisma.leadAttribute.create({
          data: {
            leadId: capture.id,
            key: CONSENT_KEY,
            value: consent === 'withdrawn' ? 'true' : 'false',
            confirmed: true,
            source: `${TAG}-fixture`,
          },
        });
      }
      return { leadId: res.body.id as string, captureId: capture.id };
    }

    const advanceDto = { action: 'STAGE_UPDATED', newStatus: 'CONTACTED', loggedBy: userA.id };

    // (a) withdrawn consent blocks with zero business/audit/outbox effects.
    const withdrawn = await linkedLead('withdrawn', 'withdrawn');
    const blocked = await patchAdvance(withdrawn.leadId, advanceDto, {
      token: tokenA,
      idem: `${TAG}-idem-withdrawn`,
      corr: randomUUID(),
    });
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('LEAD_CONSENT_WITHDRAWN');
    expect((await prisma.salesLead.findUnique({ where: { id: withdrawn.leadId } }))!.status).toBe('NEW_LEAD');
    expect(await prisma.auditLog.count({ where: { entityId: withdrawn.leadId } })).toBe(0);
    expect(await prisma.outboxEvent.count({ where: { aggregateId: withdrawn.leadId } })).toBe(0);
    expect(
      await prisma.marketingIdempotencyKey.count({ where: { scope: { contains: withdrawn.leadId } } }),
    ).toBe(0);

    // (b) missing required consent blocks identically.
    const missing = await linkedLead('missing', 'missing');
    const missingBlocked = await patchAdvance(missing.leadId, advanceDto, {
      token: tokenA,
      idem: `${TAG}-idem-missing`,
      corr: randomUUID(),
    });
    expect(missingBlocked.status).toBe(403);
    expect(missingBlocked.body.error.code).toBe('LEAD_CONSENT_MISSING');
    expect((await prisma.salesLead.findUnique({ where: { id: missing.leadId } }))!.status).toBe('NEW_LEAD');
    expect(await prisma.auditLog.count({ where: { entityId: missing.leadId } })).toBe(0);
    expect(await prisma.outboxEvent.count({ where: { aggregateId: missing.leadId } })).toBe(0);
    expect(
      await prisma.marketingIdempotencyKey.count({ where: { scope: { contains: missing.leadId } } }),
    ).toBe(0);

    // The consent check follows SalesLead.leadCaptureId — nothing is ever
    // queried by LeadAttribute.leadId = SalesLead.id.
    for (const id of [withdrawn.leadId, missing.leadId]) {
      expect(await prisma.leadAttribute.count({ where: { leadId: id } })).toBe(0);
    }
    expect(await prisma.leadAttribute.count({ where: { leadId: withdrawn.captureId, key: CONSENT_KEY } })).toBe(1);

    // (c) granted consent succeeds with exactly one audit + outbox.
    const granted = await linkedLead('granted', 'granted');
    const grantedCorr = randomUUID();
    const ok = await patchAdvance(granted.leadId, advanceDto, {
      token: tokenA,
      idem: `${TAG}-idem-granted`,
      corr: grantedCorr,
    });
    expect(ok.status).toBe(200);
    expect((await prisma.salesLead.findUnique({ where: { id: granted.leadId } }))!.status).toBe('CONTACTED');
    expect(
      await prisma.auditLog.count({ where: { entityId: granted.leadId, correlationId: grantedCorr, action: 'STAGE_ADVANCE' } }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({ where: { aggregateId: granted.leadId, correlationId: grantedCorr } }),
    ).toBe(1);

    process.env.P07_PUBLIC_LEAD_ORGANIZATION_ID = publicOrgId;
  }, 90000);

  // ── 7 ────────────────────────────────────────────────────────────────────
  it('7. /bussdev/dashboard reconciles exactly for tenant/date/owner/source/stage/SLA', async () => {
    const source = `${TAG}-DASH`;
    const now = Date.now();
    const seed = async (o: {
      label: string;
      organizationId: string;
      picId: string;
      status: string;
      createdAt: Date;
      lastStageAt: Date;
      campaignName?: string | null;
    }) => {
      await prisma.salesLead.create({
        data: {
          id: randomUUID(),
          organizationId: o.organizationId,
          clientName: `${TAG}-${o.label}`,
          contactInfo: randomUUID().slice(0, 8),
          source,
          productInterest: 'dash',
          estimatedValue: 0,
          picId: o.picId,
          status: o.status as any,
          paymentType: 'PREPAID' as any,
          hkiMode: 'NEW' as any,
          campaignName: o.campaignName ?? null,
          createdAt: o.createdAt,
          lastStageAt: o.lastStageAt,
        },
      });
    };

    await seed({ label: 'dash-1', organizationId: tenantA, picId: staffA.id, status: 'NEW_LEAD', createdAt: new Date(now), lastStageAt: new Date(now - 1 * DAY_MS) });
    await seed({ label: 'dash-2', organizationId: tenantA, picId: staffA.id, status: 'CONTACTED', createdAt: new Date(now), lastStageAt: new Date(now - 4 * DAY_MS), campaignName: 'CAMP-X' });
    await seed({ label: 'dash-3', organizationId: tenantA, picId: staffA2.id, status: 'CONTACTED', createdAt: new Date(now), lastStageAt: new Date(now - 20 * DAY_MS), campaignName: 'CAMP-X' });
    await seed({ label: 'dash-4', organizationId: tenantA, picId: staffA2.id, status: 'SAMPLE_REQUESTED', createdAt: new Date(now - 30 * DAY_MS), lastStageAt: new Date(now - 1 * DAY_MS) });
    await seed({ label: 'dash-b', organizationId: tenantB, picId: staffA.id, status: 'NEW_LEAD', createdAt: new Date(now), lastStageAt: new Date(now - 1 * DAY_MS) });

    // Independent control total (source table, not the dashboard service).
    expect(await prisma.salesLead.count({ where: { source } })).toBe(5);
    expect(await prisma.salesLead.count({ where: { source, organizationId: tenantA } })).toBe(4);

    // ── unscoped-by-date baseline: tenant A only, tenant B excluded ──
    const all = await getDashboard(tokenA, { source });
    expect(all.status).toBe(200);
    const d = all.body;

    expect(d.total).toBe(4);
    expect(sumValues(d.byStatus)).toBe(d.total);
    expect(sumValues(d.byWorkflow)).toBe(d.total);
    expect(sumValues(d.byOwner)).toBe(d.total);
    expect(sumValues(d.bySource)).toBe(d.total);
    expect(sumValues(d.byAttribution)).toBe(d.total);
    expect(sumValues(d.bySla)).toBe(d.total);

    expect(d.byStatus).toEqual({ NEW_LEAD: 1, CONTACTED: 2, SAMPLE_REQUESTED: 1 });
    expect(d.byOwner).toEqual({ [staffA.id]: 2, [staffA2.id]: 2 });
    expect(d.bySource).toEqual({ [source]: 4 });
    expect(d.byAttribution).toEqual({ UNATTRIBUTED: 2, 'CAMP-X': 2 });
    expect(d.bySla).toEqual({ ON_TRACK: 2, AT_RISK: 1, BREACHED: 1 });
    // byWorkflow is a distinct dimension, never a duplicate of byStatus.
    expect(d.byWorkflow).toEqual({ INTAKE: 1, ENGAGED: 2, SAMPLING: 1 });
    expect(Object.keys(d.byWorkflow).filter((k) => k in d.byStatus)).toEqual([]);

    // ── date filter ──
    const inWindow = await getDashboard(tokenA, {
      source,
      dateFrom: new Date(now - 1 * DAY_MS).toISOString(),
      dateTo: new Date(now + 1 * DAY_MS).toISOString(),
    });
    expect(inWindow.body.total).toBe(3);
    expect(inWindow.body.byStatus).toEqual({ NEW_LEAD: 1, CONTACTED: 2 });
    expect(sumValues(inWindow.body.bySla)).toBe(3);
    expect(sumValues(inWindow.body.byOwner)).toBe(3);

    const oldWindow = await getDashboard(tokenA, {
      source,
      dateFrom: new Date(now - 60 * DAY_MS).toISOString(),
      dateTo: new Date(now - 7 * DAY_MS).toISOString(),
    });
    expect(oldWindow.body.total).toBe(1);
    expect(oldWindow.body.byStatus).toEqual({ SAMPLE_REQUESTED: 1 });
    expect(sumValues(oldWindow.body.bySource)).toBe(1);

    // ── owner filter ──
    const byOwner = await getDashboard(tokenA, { source, owner: staffA.id });
    expect(byOwner.body.total).toBe(2);
    expect(Object.keys(byOwner.body.byOwner)).toEqual([staffA.id]);
    expect(sumValues(byOwner.body.byStatus)).toBe(2);
    expect(sumValues(byOwner.body.bySla)).toBe(2);
    expect(sumValues(byOwner.body.byAttribution)).toBe(2);

    // ── source filter ──
    const bySource = await getDashboard(tokenA, { source });
    expect(Object.keys(bySource.body.bySource)).toEqual([source]);
    expect(sumValues(bySource.body.byOwner)).toBe(4);

    // ── stage filter ──
    const byStage = await getDashboard(tokenA, { source, stage: 'CONTACTED' });
    expect(byStage.body.total).toBe(2);
    expect(Object.keys(byStage.body.byStatus)).toEqual(['CONTACTED']);
    expect(byStage.body.byWorkflow).toEqual({ ENGAGED: 2 });
    expect(sumValues(byStage.body.byOwner)).toBe(2);

    // ── SLA filter ──
    const bySla = await getDashboard(tokenA, { source, sla: 'BREACHED' });
    expect(bySla.body.total).toBe(1);
    expect(bySla.body.bySla).toEqual({ ON_TRACK: 0, AT_RISK: 0, BREACHED: 1 });
    expect(Object.keys(bySla.body.byOwner)).toEqual([staffA2.id]);
    expect(sumValues(bySla.body.byStatus)).toBe(1);

    // Tenant B can never widen tenant A's numbers.
    const tenantBView = await getDashboard(tokenB, { source });
    expect(tenantBView.body.total).toBe(1);
    expect(Object.keys(tenantBView.body.byOwner)).toEqual([staffA.id]);
  }, 90000);

  // ── 8 ────────────────────────────────────────────────────────────────────
  it('8. an outbox failure after the staged update rolls the whole command back', async () => {
    const failingOutbox = {
      enqueue: jest.fn().mockRejectedValue(new Error('OUTBOX_DOWNSTREAM_FAILURE: simulated outbox failure')),
      computeIdempotencyKey: () => 'x',
    } as unknown as OutboxService;

    const fixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PlatformConfig)
      .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
      .overrideProvider(OutboxService)
      .useValue(failingOutbox)
      .compile();
    const altApp = fixture.createNestApplication();
    altApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: validationExceptionFactory,
      }),
    );
    await altApp.init();

    const corr = randomUUID();
    try {
      const res = await request(altApp.getHttpServer())
        .patch(`/bussdev/lead/${rollbackLeadId}/advance`)
        .set(auth(tokenA))
        .set('idempotency-key', `${TAG}-idem-rollback`)
        .set('x-correlation-id', corr)
        .send({ action: 'STAGE_UPDATED', newStatus: 'CONTACTED', loggedBy: userA.id });

      expect(res.status).toBe(500);
      expect(failingOutbox.enqueue).toHaveBeenCalled();

      // Zero changes: business state, audit, outbox and idempotency all rolled back.
      expect((await prisma.salesLead.findUnique({ where: { id: rollbackLeadId } }))!.status).toBe('NEW_LEAD');
      expect(await prisma.auditLog.count({ where: { entityId: rollbackLeadId } })).toBe(0);
      expect(await prisma.outboxEvent.count({ where: { aggregateId: rollbackLeadId } })).toBe(0);
      expect(
        await prisma.marketingIdempotencyKey.count({ where: { scope: { contains: rollbackLeadId } } }),
      ).toBe(0);
    } finally {
      try {
        await altApp.close();
      } catch (e) {
        throw new Error(`altApp close failed (rollback proof): ${(e as Error).message}`);
      }
    }
  }, 120000);
});
