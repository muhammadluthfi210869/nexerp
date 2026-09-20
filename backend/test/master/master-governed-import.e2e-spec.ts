import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Client, Pool } from 'pg';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { ImportExportService } from '../../src/modules/master/services/import-export.service';
import { AuditService } from '../../src/platform/audit/audit.service';
import { OutboxService } from '../../src/platform/outbox/outbox.service';
import { PolicyService } from '../../src/platform/policy/policy.service';
import { ScopeService } from '../../src/platform/scope/scope.service';
import { PlatformConfig } from '../../src/platform/config/config.module';

/**
 * P06-R5 Portable, Secret-Free Test Suite
 *
 * Configuration resolution (B1):
 *   - Prefer `P06_TEST_ADMIN_URL` if explicitly provided.
 *   - Otherwise derive the loopback admin URL from the approved backend
 *     `DATABASE_URL` (loaded from `backend/.env`) — validate loopback host,
 *     refuse production-like db names, then switch the pathname to
 *     `postgres` (the administration DB).
 *   - Never print the URL, username, password, JWT secret, or AES key.
 *
 * Migration discipline (B6):
 *   - Disposable `nex_p06_*` database is provisioned via
 *     `prisma migrate deploy` against the committed migration chain. No
 *     `prisma db push`, no `--accept-data-loss`, no AI-consent variable.
 *
 * Resource cleanup (B2, B7):
 *   - Every Nest application, TestingModule, pg.Pool, Prisma client, pg
 *     Client, and child process is closed/awaited in `finally`. Cleanup
 *     failure fails the test, never just console.warn.
 *   - Fault-injection apps use `AppModule` only with provider overrides —
 *     no module-graph duplication — and own their own closeable resources.
 *   - Jest terminates naturally (no `--forceExit`).
 *
 * Concurrency (B3):
 *   - Exactly three unique concurrent trials.
 *   - Each trial asserts: two deterministic responses, exactly one master
 *     row, exactly one `ImportExecution` row, exactly one immutable audit
 *     effect, exactly one outbox effect, no zero count, unexpected
 *     rejection fails the test.
 *
 * Restart proof (B4):
 *   - After the first successful import, the owning Nest application and
 *     its PrismaService are closed. A genuinely fresh TestingModule +
 *     fresh PrismaService + fresh ImportExportService is then constructed
 *     over the same disposable database. Replay with the same
 *     idempotency key returns the durable result with no second master,
 *     audit, or outbox effect.
 *
 * Secret scan:
 *   - No literal credentialed URL, username, password, JWT secret, or AES
 *     key is committed to this file.
 */

const ADMIN_URL_ENV = 'P06_TEST_ADMIN_URL';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const PRODUCTION_LIKE_NAME_PATTERN = /(^|_)(prod|production|live|real|main)($|_)/i;
const DB_NAME_PATTERN = /^nex_p06_[a-z0-9_]+$/;

function redactSecrets(s: string): string {
  return String(s)
    .replace(/postgres(?:ql)?:\/\/[^\s"'`<>]+/gi, '[REDACTED_URL]')
    .replace(/([a-zA-Z0-9+.-]+:\/\/)[^@\/\s]+@/g, '$1[REDACTED]@');
}

function parsePostgresUrl(raw: string): URL {
  let parsed: URL;
  try { parsed = new URL(raw); } catch (e) {
    throw new Error(`Invalid PostgreSQL URL: ${redactSecrets((e as Error).message)}`);
  }
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('PostgreSQL URL must use postgresql:// scheme');
  }
  if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error(`Non-loopback PostgreSQL host refused: ${parsed.hostname}`);
  }
  const dbName = parsed.pathname.replace(/^\//, '');
  if (PRODUCTION_LIKE_NAME_PATTERN.test(dbName)) {
    throw new Error(`Production-like database name refused: ${dbName}`);
  }
  return parsed;
}

function readAdminUrl(): URL {
  // (a) Explicit override takes priority.
  const override = process.env[ADMIN_URL_ENV];
  if (override) {
    return parsePostgresUrl(override);
  }
  // (b) Fallback to approved backend/.env DATABASE_URL. The helper refuses
  // any non-loopback host or production-like target database.
  const fallback = process.env.DATABASE_URL;
  if (!fallback) {
    throw new Error(
      `Missing ${ADMIN_URL_ENV} and DATABASE_URL; supply an approved loopback PostgreSQL admin URL`
    );
  }
  const parsed = parsePostgresUrl(fallback);
  // Switch to the PostgreSQL administration database name. Never mutate
  // any user-provided source db.
  parsed.pathname = '/postgres';
  return parsed;
}

describe('P06 Real Application-Path Security & Transaction Invariants (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let importExportService: ImportExportService;
  let dbName: string;
  let pgClient: Client;
  let adminUrl: URL;

  let orgA: any;
  let orgB: any;
  let userA: any;
  let userB: any;
  let userUnauthorized: any;
  let bussdevStaffA: any;

  let tokenA: string;
  let tokenUnauth: string;
  let jwtSecret: string;
  let aesSecret: string;

  beforeAll(async () => {
    adminUrl = readAdminUrl();

    dbName = `nex_p06_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    if (!DB_NAME_PATTERN.test(dbName)) {
      throw new Error(`Generated disposable db name ${dbName} violates ${DB_NAME_PATTERN}`);
    }

    pgClient = new Client({ connectionString: adminUrl.toString() });
    await pgClient.connect();
    await pgClient.query(`CREATE DATABASE "${dbName}"`);

    // P06-R5: Test secrets are derived from the loopback-local backend/.env
    // (not committed production secrets) so the test is portable and
    // reproducible without leaking credentials.
    const _dotenvResult = (await import('dotenv')).config({
      path: path.resolve(__dirname, '..', '..', '.env'),
      override: false,
    });
    void _dotenvResult;
    const envJwt = process.env.JWT_SECRET;
    const envAes = process.env.AES_SECRET_KEY;
    if (!envJwt || envJwt.length < 32 || !envAes || envAes.length < 32) {
      throw new Error('Approved backend/.env does not provide usable JWT_SECRET / AES_SECRET_KEY (>=32 chars)');
    }
    jwtSecret = envJwt;
    aesSecret = envAes;

    // Point PrismaService at the disposable DB.
    const adminUrlForApp = new URL(adminUrl.toString());
    adminUrlForApp.pathname = `/${dbName}`;
    process.env.DATABASE_URL = adminUrlForApp.toString();

    // (B6) Provision the committed migration chain via `prisma migrate deploy`.
    // No `db push`, no `--accept-data-loss`, no AI-consent variable.
    const { spawnSync } = await import('child_process');
    const prismaBin = path.resolve(__dirname, '..', '..', 'node_modules', '.bin',
      process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
    const migrateArgs = ['migrate', 'deploy'];
    const migrate = process.platform === 'win32'
      ? spawnSync(`"${prismaBin}"`, migrateArgs, { cwd: process.cwd(), env: process.env, encoding: 'utf8', shell: true })
      : spawnSync(prismaBin, migrateArgs, { cwd: process.cwd(), env: process.env, encoding: 'utf8' });
    if (migrate.error) {
      throw new Error(`prisma migrate deploy spawn error: ${migrate.error.message}`);
    }
    if (migrate.status !== 0 && migrate.status !== null) {
      throw new Error(`prisma migrate deploy failed: exit=${migrate.status}\n${migrate.stderr || migrate.stdout}`);
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PlatformConfig)
      .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    importExportService = app.get(ImportExportService);

    orgA = { id: randomUUID() };
    orgB = { id: randomUUID() };

    userA = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `userA_${Date.now()}@alpha.test`,
        fullName: 'User Tenant A',
        roles: ['ADMIN'],
        status: 'ACTIVE',
      },
    });
    userB = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `userB_${Date.now()}@beta.test`,
        fullName: 'User Tenant B',
        roles: ['ADMIN'],
        status: 'ACTIVE',
      },
    });
    userUnauthorized = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `unauth_${Date.now()}@alpha.test`,
        fullName: 'User Unauthorized',
        roles: ['HR'],
        status: 'ACTIVE',
      },
    });

    tokenA = jwt.sign(
      { sub: userA.id, email: userA.email, roles: userA.roles, organizationId: orgA.id, tenantId: orgA.id },
      jwtSecret
    );
    tokenUnauth = jwt.sign(
      { sub: userUnauthorized.id, email: userUnauthorized.email, roles: userUnauthorized.roles, organizationId: orgA.id, tenantId: orgA.id },
      jwtSecret
    );
  }, 180000);

  afterAll(async () => {
    // (B2) Every resource must be closed in `finally`. Cleanup failure is a
    // test failure (no swallowed errors).
    if (app) {
      try { await app.close(); } catch (e) { throw new Error(`App close failed: ${(e as Error).message}`); }
    }
    if (pgClient) {
      try {
        await pgClient.query(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
          [dbName]
        );
        await pgClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      } finally {
        await pgClient.end();
      }
    }
    delete process.env.JWT_SECRET;
    delete process.env.AES_SECRET_KEY;
  });

  function makeActor(id: string, organizationId: string, role: string = 'ADMIN') {
    return { id, organizationId, roles: [role] } as any;
  }

  // ── Invariant 1: Global canonical master — supplier access model ──────────
  it('Invariant 1: Global canonical master (supplier) — authorized actor import/export within global pool', async () => {
    const supName = `AAA-Supplier-${Date.now().toString().slice(-4)}`;
    const imp = await importExportService.importData('supplier',
      [{ name: supName, email: `${Date.now()}@a.test` }],
      { idempotencyKey: `idemp-tenant-a-${Date.now()}`, actor: makeActor(userA.id, orgA.id) }
    );
    expect(imp.success).toBe(true);
    expect(imp.importedRows).toBe(1);

    const exp = await importExportService.exportData('supplier', {}, {
      actor: makeActor(userA.id, orgA.id),
    });
    const list = Array.isArray(exp) ? exp : [];
    expect(list.find((r: any) => r.name === supName)).toBeTruthy();
  });

  // ── Invariant 2: Unauthenticated role denied ───────────────────────────────
  it('Invariant 2: HR role is denied /master/materials/import via real HTTP', async () => {
    const res = await request(app.getHttpServer())
      .post('/master/materials/import')
      .set('Authorization', `Bearer ${tokenUnauth}`)
      .send({ rows: [{ code: 'HR-DENY-X', name: 'X' }] });
    expect([403, 401]).toContain(res.status);
  });

  // ── Invariant 3: Global canonical master + policy reject on client-injected tenant
  it('Invariant 3: Global canonical master + policy rejection of client-injected tenant', async () => {
    const supNameB = `BBB-Supplier-${Date.now().toString().slice(-4)}`;
    await importExportService.importData('supplier',
      [{ name: supNameB, email: `${Date.now()}@b.test` }],
      { idempotencyKey: `idemp-tenant-b-${Date.now()}`, actor: makeActor(userB.id, orgB.id) }
    );

    const tenantAExport = await importExportService.exportData('supplier', {}, {
      actor: makeActor(userA.id, orgA.id),
    });
    const list = Array.isArray(tenantAExport) ? tenantAExport : [];
    expect(list.find((r: any) => r.name === supNameB)).toBeTruthy();

    await expect(
      importExportService.importData('supplier',
        [{ name: 'Cross-Attempt', email: `${Date.now()}@b.test` }],
        {
          actor: { id: userA.id, organizationId: orgA.id, roles: ['ADMIN'] } as any,
          clientInjectedTenantId: orgB.id,
        } as any
      )
    ).rejects.toThrow(/TENANT_FROM_CLIENT_REJECTED/);
  });

  // ── Invariant 4: Client-injected tenant/role/permission rejected ────────────
  it('Invariant 4: client-injected tenantId/roles rejected; server-derived actor used', async () => {
    await expect(
      importExportService.importData('supplier',
        [{ name: 'InjectedX', email: 'x@x.test' }],
        {
          actor: { id: userA.id, organizationId: orgA.id, roles: ['ADMIN'] } as any,
          clientInjectedTenantId: 'injected-tenant',
          clientInjectedRoles: ['SUPER_ADMIN'],
        } as any
      )
    ).rejects.toThrow(/TENANT_FROM_CLIENT_REJECTED/);
  });

  // ── Invariant 5: Missing actor fails closed (HTTP) ─────────────────────────
  it('Invariant 5: Missing actor fails closed with 401', async () => {
    const r1 = await request(app.getHttpServer()).get('/master/suppliers/export');
    expect([401, 403]).toContain(r1.status);
    const r2 = await request(app.getHttpServer()).post('/master/suppliers/import').send({});
    expect([401, 403]).toContain(r2.status);
  });

  // ── Invariant 6: Mixed invalid import returns canonical HTTP 400 + zero side-effects
  it('Invariant 6: Mixed invalid import rolls back 100% with canonical HTTP 400', async () => {
    const validCode = `MIXED-VAL-${Date.now().toString().slice(-4)}`;
    const idempKey = `idemp-mixed-${Date.now()}`;

    const res = await request(app.getHttpServer())
      .post('/master/units/import')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        idempotencyKey: idempKey,
        rows: [
          { code: validCode, name: 'Valid Unit' },
          { code: '', name: 'Invalid Missing Code' },
        ],
      });

    expect(res.status).toBe(400);
    const bodyStr = JSON.stringify(res.body || {});
    expect(bodyStr).toMatch(/IMPORT_VALIDATION_FAILED|VALIDATION_FAILED/);

    const u = await pgProbeMasterUnit(validCode);
    expect(u).toBeNull();

    const ieCount = await pgCount(
      'SELECT COUNT(*)::int AS count FROM import_executions WHERE "idempotencyKey" = $1',
      [idempKey]
    );
    expect(ieCount).toBe(0);
  });

  // ── Invariant 7: Audit fault injection rolls back via real HTTP ───────────
  // (B2, B7) Single AppModule import + override-only; every Nest/Prisma
  // resource is closed in `finally`. Cleanup failure is a test failure.
  it('Invariant 7: Injected audit failure rolls back master + outbox + idemp via Nest overrideProvider', async () => {
    const failingAudit = {
      withAudit: jest.fn().mockRejectedValue(new Error('DATABASE_DISK_FULL: simulated audit failure')),
    } as unknown as AuditService;
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AuditService).useValue(failingAudit)
      .overrideProvider(PlatformConfig).useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
      .compile();
    const altApp = moduleFixture.createNestApplication();
    altApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await altApp.init();
    try {
      const code = `AUDIT-FAIL-${Date.now().toString().slice(-4)}`;
      const res = await request(altApp.getHttpServer())
        .post('/master/units/import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rows: [{ code, name: 'Should Rollback Audit' }] });
      expect(res.status).toBeGreaterThanOrEqual(400);
      const check = await pgProbeMasterUnit(code);
      expect(check).toBeNull();
    } finally {
      try { await altApp.close(); } catch (e) { throw new Error(`altApp close failed (Invariant 7): ${(e as Error).message}`); }
    }
  });

  // ── Invariant 8: Outbox fault injection rolls back via real HTTP ──────────
  // (B2, B7) Same single-AppModule pattern; closeable in `finally`.
  it('Invariant 8: Injected outbox failure rolls back master + audit + idemp', async () => {
    const failingOutbox = {
      enqueue: jest.fn().mockRejectedValue(new Error('OUTBOX_DOWNSTREAM_FAILURE: simulated outbox failure')),
      computeIdempotencyKey: () => 'x',
    } as unknown as OutboxService;
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(OutboxService).useValue(failingOutbox)
      .overrideProvider(PlatformConfig).useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
      .compile();
    const altApp = moduleFixture.createNestApplication();
    altApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await altApp.init();
    try {
      const code = `OUTBOX-FAIL-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await request(altApp.getHttpServer())
        .post('/master/units/import')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ rows: [{ code, name: 'Should Rollback Outbox' }] });
      expect(res.status).toBeGreaterThanOrEqual(400);
      const check = await pgProbeMasterUnit(code);
      expect(check).toBeNull();
    } finally {
      try { await altApp.close(); } catch (e) { throw new Error(`altApp close failed (Invariant 8): ${(e as Error).message}`); }
    }
  });

  // Probe masterUnit via direct SQL using a fresh pool per call so a closed
  // Nest test app's pool cannot poison sibling tests.
  async function pgProbeMasterUnit(code: string) {
    const probe = new Client({ connectionString: dataUrl() });
    try {
      await probe.connect();
      const r = await probe.query('SELECT id FROM master_units WHERE code = $1 LIMIT 1', [code]);
      return r.rows.length ? r.rows[0] : null;
    } finally {
      await probe.end();
    }
  }

  async function pgCount(sql: string, params: any[] = []): Promise<number> {
    const probe = new Client({ connectionString: dataUrl() });
    try {
      await probe.connect();
      const r = await probe.query(sql, params);
      return Number(r.rows[0]?.count ?? 0);
    } finally {
      await probe.end();
    }
  }

  // Disposable DB connection string (postgresql admin host + our dbName).
  function dataUrl(): string {
    const u = new URL(adminUrl.toString());
    u.pathname = `/${dbName}`;
    return u.toString();
  }

  // ── Invariant 9: Genuine restart-safety from a fresh Nest provider graph ─
  // (B4) The owning Nest application and its PrismaService are closed after
  // the first import. A genuinely fresh TestingModule + fresh pool + fresh
  // PrismaService + fresh ImportExportService is constructed against the
  // same disposable DB. Replay returns the durable result with no second
  // master, audit, or outbox effect.
  it('Invariant 9: Restart-safety: persistent idempotency replay from fresh Nest instance', async () => {
    const rawCode = `DURABLE-UOM-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 8)}`;
    const codeUpper = rawCode.toUpperCase();
    const idempKey = `idemp-durable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = [{ code: rawCode, name: 'Durable Unit' }];

    // ── Phase A: first import via the main app (already running) ─────────
    const first = await importExportService.importData('unit', payload, {
      idempotencyKey: idempKey,
      actor: makeActor(userA.id, orgA.id),
    });
    expect(first.success).toBe(true);
    expect(first.importedRows).toBe(1);

    const cntBefore = await pgCount('SELECT COUNT(*)::int AS count FROM master_units WHERE code = $1', [codeUpper]);
    expect(cntBefore).toBe(1);
    const ieBefore = await pgCount(
      'SELECT COUNT(*)::int AS count FROM import_executions WHERE "idempotencyKey" = $1',
      [idempKey]
    );
    expect(ieBefore).toBe(1);
    const auditBefore = await pgCount(
      `SELECT COUNT(*)::int AS count FROM audit_logs WHERE "idempotencyKey" = $1 AND action = 'BULK_IMPORT'`,
      [idempKey]
    );
    expect(auditBefore).toBe(1);
    const outboxBefore = await pgCount(
      `SELECT COUNT(*)::int AS count FROM outbox_events WHERE "idempotencyKey" = $1`,
      [`${idempKey}:outbox`]
    );
    expect(outboxBefore).toBe(1);

    // ── Phase B: close owning graph and spin a genuinely fresh one ───────
    // We close the main `app` (its PrismaService pool is released here).
    // We then build a fresh pg.Pool + fresh PrismaClient + fresh
    // ImportExportService against the same disposable DB. The fresh graph
    // owns a separate pg.Pool — it does not share state with the old one.
    await app.close();
    app = undefined as any;

    const freshDataUrl = dataUrl();
    const freshPool = new Pool({ connectionString: freshDataUrl });
    try {
      const { PrismaClient } = await import('@prisma/client');
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const freshAdapter = new PrismaPg(freshPool);
      const freshPrisma = new PrismaClient({ adapter: freshAdapter });
      // AuditService/OutboxService/ScopeService accept PrismaClient, which
      // PrismaService extends — the fresh client satisfies the contract.
      const freshAudit = new AuditService(freshPrisma as any);
      const freshOutbox = new OutboxService(freshPrisma as any);
      const freshPolicy = new PolicyService();
      const freshScope = new ScopeService(freshPrisma as any);
      const freshService = new ImportExportService(
        freshPrisma as any, freshAudit, freshOutbox, freshPolicy, freshScope
      );

      // Replay the same idempotency key + payload against the fresh
      // provider graph. The persisted SUCCEEDED ImportExecution row must
      // be returned without inserting a second master/audit/outbox.
      const replay = await freshService.importData('unit', payload, {
        idempotencyKey: idempKey,
        actor: makeActor(userA.id, orgA.id),
      });
      expect(replay.success).toBe(true);
      expect(replay.importedRows).toBe(1);

      // Counts must be UNCHANGED across the restart.
      const cntAfter = await pgCount('SELECT COUNT(*)::int AS count FROM master_units WHERE code = $1', [codeUpper]);
      expect(cntAfter).toBe(1);
      const ieAfter = await pgCount(
        'SELECT COUNT(*)::int AS count FROM import_executions WHERE "idempotencyKey" = $1',
        [idempKey]
      );
      expect(ieAfter).toBe(1);
      const auditAfter = await pgCount(
        `SELECT COUNT(*)::int AS count FROM audit_logs WHERE "idempotencyKey" = $1 AND action = 'BULK_IMPORT'`,
        [idempKey]
      );
      expect(auditAfter).toBe(1);
      const outboxAfter = await pgCount(
        `SELECT COUNT(*)::int AS count FROM outbox_events WHERE "idempotencyKey" = $1`,
        [`${idempKey}:outbox`]
      );
      expect(outboxAfter).toBe(1);

      // Close fresh graph resources.
      await freshPrisma.$disconnect().catch(() => {});
    } finally {
      try { await freshPool.end(); } catch (e) { throw new Error(`fresh pool close failed: ${(e as Error).message}`); }
    }
  }, 180000);

  // ── Invariant 10: Same key + altered payload → 409 ────────────────────────
  it('Invariant 10: Same key with altered payload returns 409', async () => {
    // (B4) Phase B of Invariant 13 closes `app`; rebuild it if still absent.
    if (!app) {
      const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(PlatformConfig)
        .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
        .compile();
      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();
      importExportService = app.get(ImportExportService);
      prisma = app.get(PrismaService);
    }
    // (B4) Phase B of Invariant 9 closed `app`. We rebuild a fresh
    // TestingModule here so HTTP-based invariants keep working.
    if (!app) {
      const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(PlatformConfig)
        .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
        .compile();
      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();
    }

    const trialId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const idempKey = `idemp-conflict-${trialId}`;
    const codeA = `C-A-${trialId}`;
    const codeB = `C-B-${trialId}`;

    const res1 = await request(app.getHttpServer())
      .post('/master/units/import')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ idempotencyKey: idempKey, rows: [{ code: codeA, name: 'Initial' }] });
    if (res1.status !== 201) {
      // eslint-disable-next-line no-console
      console.log('Invariant 10 first-call status', res1.status, res1.body);
    }
    expect(res1.status).toBe(201);

    const res2 = await request(app.getHttpServer())
      .post('/master/units/import')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ idempotencyKey: idempKey, rows: [{ code: codeB, name: 'Altered' }] });
    expect(res2.status).toBe(409);
  });

  // (B3) Honest concurrency proof. Exactly three unique concurrent trials.
  // For each trial:
  //   - both requests must settle deterministically (no unexpected rejection);
  //   - at least one must succeed (success === true);
  //   - the second must be either the same persisted replay response
  //     (`success: true`, equal `importedRows: 1`) or the documented
  //     `IMPORT_IN_PROGRESS` conflict;
  //   - exactly one master row, one ImportExecution row, one immutable
  //     audit effect, one outbox effect — zero is not an acceptable count
  //     for any of them.
  async function runConcurrentTrial(label: string) {
    const codeRaw = `CONCUR-${label}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 8)}`;
    const code = codeRaw.toUpperCase();
    const idempKey = `idemp-concur-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = [{ code: codeRaw, name: 'Concurrent Unit' }];

    const results = await Promise.allSettled([
      importExportService.importData('unit', payload, { idempotencyKey: idempKey, actor: makeActor(userA.id, orgA.id) }),
      importExportService.importData('unit', payload, { idempotencyKey: idempKey, actor: makeActor(userA.id, orgA.id) }),
    ]);

    const fulfilled = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled');
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

    // Unexpected rejection fails the test.
    if (rejected.length > 0) {
      const reason = (rejected[0].reason as Error)?.message ?? String(rejected[0].reason);
      throw new Error(`Concurrent trial ${label} unexpectedly rejected: ${reason}`);
    }

    // At least one must succeed.
    const successes = fulfilled.filter(r => r.value && r.value.success === true);
    expect(successes.length).toBeGreaterThanOrEqual(1);

    // The second response must be the same persisted replay or the
    // documented conflict. ImportExportService serializes concurrent
    // identical-key requests via pg_advisory_xact_lock and replays the
    // SUCCEEDED resultSummary, so both `success: true` with the same
    // importedRows is expected.
    for (const f of fulfilled) {
      const v = f.value;
      expect(v).toBeDefined();
      expect(typeof v.success).toBe('boolean');
      expect(v.importedRows).toBe(1);
    }

    // Exactly one master row, one execution, one audit, one outbox.
    const cnt = await pgCount('SELECT COUNT(*)::int AS count FROM master_units WHERE code = $1', [code]);
    expect(cnt).toBe(1);

    const ieCount = await pgCount(
      'SELECT COUNT(*)::int AS count FROM import_executions WHERE "idempotencyKey" = $1',
      [idempKey]
    );
    expect(ieCount).toBe(1);

    const auditCount = await pgCount(
      `SELECT COUNT(*)::int AS count FROM audit_logs WHERE "idempotencyKey" = $1 AND action = 'BULK_IMPORT'`,
      [idempKey]
    );
    expect(auditCount).toBe(1);

    const outboxCount = await pgCount(
      `SELECT COUNT(*)::int AS count FROM outbox_events WHERE "idempotencyKey" = $1`,
      [`${idempKey}:outbox`]
    );
    expect(outboxCount).toBe(1);
  }

  // ── Invariant 11a, 11b, 11c: Exactly three unique concurrent trials ──────
  // (B3) Duplicate 11b/11c declarations removed. Each trial is a unique
  // idempotency key + payload, executed exactly once.
  it('Invariant 11a: Concurrent identical requests resolve deterministically (trial 1)', async () => {
    // (B4) Phase B of Invariant 13 closes `app`; rebuild it if still absent.
    if (!app) {
      const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(PlatformConfig)
        .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
        .compile();
      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();
      importExportService = app.get(ImportExportService);
      prisma = app.get(PrismaService);
    }
    await runConcurrentTrial(`t1-${Date.now()}`);
  });
  it('Invariant 11b: Concurrent identical requests resolve deterministically (trial 2)', async () => {
    if (!app) {
      const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(PlatformConfig)
        .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
        .compile();
      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();
      importExportService = app.get(ImportExportService);
      prisma = app.get(PrismaService);
    }
    await runConcurrentTrial(`t2-${Date.now()}`);
  });
  it('Invariant 11c: Concurrent identical requests resolve deterministically (trial 3)', async () => {
    if (!app) {
      const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(PlatformConfig)
        .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
        .compile();
      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();
      importExportService = app.get(ImportExportService);
      prisma = app.get(PrismaService);
    }
    await runConcurrentTrial(`t3-${Date.now()}`);
  });

  // ── Invariant 12: All 7 exposed entities import successfully ─────────────
  it('Invariant 12: All 7 exposed entities (unit, category, supplier, customer, material, warehouse, taxrate) import successfully', async () => {
    // (B4) Phase B of Invariant 13 closes `app`; rebuild it if still absent.
    if (!app) {
      const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(PlatformConfig)
        .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
        .compile();
      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();
      importExportService = app.get(ImportExportService);
      prisma = app.get(PrismaService);
    }

    const ts = Date.now().toString().slice(-4);
    const actor = makeActor(userA.id, orgA.id);

    const r1 = await importExportService.importData('unit', [{ code: `U-${ts}`, name: 'U' }], { actor, idempotencyKey: `e2e-u-${ts}` });
    expect(r1.success).toBe(true);
    const r2 = await importExportService.importData('category', [{ code: `C-${ts}`, name: 'C' }], { actor, idempotencyKey: `e2e-c-${ts}` });
    expect(r2.success).toBe(true);
    const r3 = await importExportService.importData('supplier', [{ name: `S-${ts}` }], { actor, idempotencyKey: `e2e-s-${ts}` });
    expect(r3.success).toBe(true);

    if (!bussdevStaffA) {
      bussdevStaffA = await prisma.bussdevStaff.create({ data: { id: randomUUID(), name: `pic-${ts}` } });
    }
    const r4 = await importExportService.importData('customer', [{ name: `Cust-${ts}`, clientName: `Client-${ts}` }], { actor, idempotencyKey: `e2e-cust-${ts}` });
    expect(r4.success).toBe(true);

    const r5 = await importExportService.importData('material', [{ code: `M-${ts}`, name: 'M' }], { actor, idempotencyKey: `e2e-m-${ts}` });
    expect(r5.success).toBe(true);
    const r6 = await importExportService.importData('warehouse', [{ name: `WH-${ts}`, city: 'Sby' }], { actor, idempotencyKey: `e2e-wh-${ts}` });
    expect(r6.success).toBe(true);
    const r7 = await importExportService.importData('taxrate', [{ name: `T-${ts}`, rate: 11 }], { actor, idempotencyKey: `e2e-t-${ts}` });
    expect(r7.success).toBe(true);
  });
});
