import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { ApprovalStatus, DesignState, LegalStatus, SampleStage } from '@prisma/client';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { RndService } from '../../src/modules/rnd/rnd.service';
import { FormulasService } from '../../src/modules/rnd/formulas/formulas.service';
import { CreativeService } from '../../src/modules/creative/creative.service';
import { LegalityService } from '../../src/modules/legality/legality.service';
import { PlatformConfig } from '../../src/platform/config/config.module';
import { validationExceptionFactory } from '../../src/common/validation/validation-error.factory';

/**
 * P08 — golden thread. Boots the REAL Nest application (AppModule: guards, pipes,
 * filters, every module) against ONE disposable `nex_p08_*` PostgreSQL database
 * provisioned through the committed migration chain, and runs the whole frozen
 * acceptance thread on it:
 *
 *   sample request -> Finance-verified sample payment -> approved formulation
 *   -> finalized artwork -> recorded permit
 *
 * Every step goes through the production service the live traffic uses. Nothing about
 * the business rules, the transactions, the audit chain or the outbox is stubbed.
 *
 * Fixtures create tenants, users, staff and a lead. They never create the audit row,
 * outbox event, payment verification, approval, finalized state or permit being proved.
 *
 * The thread walks the negative cases too, as ordinary business calls:
 *   - formulation attempted before Finance verified the fee
 *   - a repeated verify (the retry) producing exactly one business effect
 *   - a mutation of a locked formula
 *   - a revision demanded past the bound
 *   - a reopen attempted by a NON-supervisor
 *
 * The disposable database is dropped in `finally`; a cleanup failure fails the run,
 * so a leftover `nex_p08_*` database can never pass silently.
 */

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const PRODUCTION_LIKE_NAME = /(^|_)(prod|production|live|real|main)($|_)/i;
const DISPOSABLE_NAME = /^nex_p08_[a-z0-9_]+$/;

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p08_golden_${RUN_ID}`;
const SEED_PASSWORD_HASH = bcrypt.hashSync('not-a-real-login', 4);
const APJ_PIN = '4821';

function readAdminUrl(): URL {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is required to provision the disposable P08 database');
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

describe('P08 golden thread (real Nest app, disposable PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rnd: RndService;
  let formulas: FormulasService;
  let creative: CreativeService;
  let legality: LegalityService;
  let pgClient: Client;
  let dbName: string;
  let dataUrl: string;

  let leadId: string;
  let financeId: string;
  let rndUserId: string;
  let directorId: string;
  let bdId: string;
  let apjId: string;

  const reasonOf = (err: any): string | undefined =>
    err?.response?.reason_code ?? err?.reason_code;

  const daysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  beforeAll(async () => {
    loadEnv({ path: path.resolve(__dirname, '..', '..', '.env'), override: false });
    const adminUrl = readAdminUrl();

    dbName = `nex_p08_golden_${Date.now().toString(36)}_${Math.floor(
      Math.random() * 1e6,
    ).toString(36)}`;
    if (!DISPOSABLE_NAME.test(dbName)) {
      throw new Error(`Generated disposable database name violates ${DISPOSABLE_NAME}`);
    }

    const seedUrl = new URL(adminUrl.toString());
    seedUrl.pathname = `/${dbName}`;
    dataUrl = seedUrl.toString();

    pgClient = new Client({ connectionString: adminUrl.toString() });
    await pgClient.connect();
    await pgClient.query(`CREATE DATABASE "${dbName}"`);

    const jwtSecret = process.env.JWT_SECRET;
    const aesSecret = process.env.AES_SECRET_KEY;
    if (!jwtSecret || jwtSecret.length < 32 || !aesSecret || aesSecret.length < 32) {
      throw new Error('backend/.env must provide JWT_SECRET / AES_SECRET_KEY (>= 32 chars)');
    }

    // Point the application (and the migration chain) at the disposable database.
    process.env.DATABASE_URL = dataUrl;

    const { spawnSync } = await import('child_process');
    const prismaBin = path.resolve(
      __dirname,
      '..',
      '..',
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
    );
    const migrate =
      process.platform === 'win32'
        ? spawnSync(`"${prismaBin}"`, ['migrate', 'deploy'], {
            cwd: process.cwd(),
            env: process.env,
            encoding: 'utf8',
            shell: true,
          })
        : spawnSync(prismaBin, ['migrate', 'deploy'], {
            cwd: process.cwd(),
            env: process.env,
            encoding: 'utf8',
          });
    if (migrate.error) throw new Error(`prisma migrate deploy spawn error: ${migrate.error.message}`);
    if (migrate.status !== 0) {
      throw new Error(
        `prisma migrate deploy failed: exit=${migrate.status}\n${migrate.stderr || migrate.stdout}`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PlatformConfig)
      .useValue(PlatformConfig.fromValues({ jwtSecret, mfaEncryptionKey: aesSecret }))
      .compile();

    app = moduleFixture.createNestApplication();
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
    rnd = app.get(RndService);
    formulas = app.get(FormulasService);
    creative = app.get(CreativeService);
    legality = app.get(LegalityService);

    // ── fixtures ──
    const staff = await prisma.bussdevStaff.create({ data: { name: `${TAG} Staff` } });
    const lead = await prisma.salesLead.create({
      data: {
        clientName: `${TAG} Corp`,
        contactInfo: `0815${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'P08 golden thread',
        picId: staff.id,
      },
    });
    leadId = lead.id;

    const mkUser = async (email: string, roles: any[], extra: any = {}) =>
      (
        await prisma.user.create({
          data: {
            email,
            fullName: `${TAG} ${email.split('.')[0]}`,
            passwordHash: SEED_PASSWORD_HASH,
            roles,
            status: 'ACTIVE' as any,
            ...extra,
          },
        })
      ).id;

    financeId = await mkUser(`finance.${RUN_ID}@nex-p08.test`, ['FINANCE']);
    rndUserId = await mkUser(`rnd.${RUN_ID}@nex-p08.test`, ['RND']);
    directorId = await mkUser(`director.${RUN_ID}@nex-p08.test`, ['DIRECTOR']);
    bdId = await mkUser(`bd.${RUN_ID}@nex-p08.test`, ['COMMERCIAL']);
    apjId = await mkUser(
      `apj.${RUN_ID}@nex-p08.test`,
      ['APJ'],
      { approvalPin: bcrypt.hashSync(APJ_PIN, 4) },
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

  // ── 1 ──────────────────────────────────────────────────────────────────────
  it('1. a sample request starts waiting for Finance, and formulation is refused before the fee is verified', async () => {
    const sample = await rnd.createSample({
      leadId,
      productName: `${TAG} Serum`,
      targetFunction: 'Brightening',
      textureReq: 'Liquid',
      colorReq: 'Clear',
      aromaReq: 'None',
    } as any);

    expect(sample.stage).toBe(SampleStage.WAITING_FINANCE);
    expect(sample.paymentApprovedAt).toBeNull();
    expect(sample.paymentApprovedById).toBeNull();

    // the negative case, as an ordinary business call
    const refused = await rnd.acceptSample(sample.id).catch((e) => e);
    expect(reasonOf(refused)).toBe('SAMPLE_FEE_NOT_VERIFIED');
    expect(await prisma.formula.count({ where: { sampleRequestId: sample.id } })).toBe(0);
    // and the refusal fabricated no verifier
    const after = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sample.id } });
    expect(after.paymentApprovedAt).toBeNull();
    expect(after.paymentApprovedById).toBeNull();
  }, 60000);

  // ── 2 ──────────────────────────────────────────────────────────────────────
  it('2. Finance verification advances the sample once, and a retry produces no second effect', async () => {
    const sample = await prisma.sampleRequest.findFirstOrThrow({
      where: { productName: `${TAG} Serum` },
    });

    const verified = await rnd.verifySamplePayment(
      sample.id,
      financeId,
      'Transfer matched against the bank statement',
    );
    expect(verified.stage).toBe(SampleStage.QUEUE);
    expect(verified.paymentApprovedById).toBe(financeId);

    // THE RETRY — the same business command issued twice must collapse to one effect.
    const retried = await rnd.verifySamplePayment(sample.id, financeId).catch((e) => e);
    expect(reasonOf(retried)).toBe('SAMPLE_NOT_AWAITING_FINANCE');

    const audits = await prisma.auditLog.findMany({
      where: {
        entityType: 'SampleRequest',
        entityId: sample.id,
        action: 'VERIFY_SAMPLE_PAYMENT',
      },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].txId).toBeTruthy();

    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: sample.id, eventType: 'sample.payment_verified' },
    });
    expect(events).toHaveLength(1);
  }, 60000);

  // ── 3 ──────────────────────────────────────────────────────────────────────
  it('3. the formulation is approved and locked, and a locked formula refuses mutation', async () => {
    const sample = await prisma.sampleRequest.findFirstOrThrow({
      where: { productName: `${TAG} Serum` },
    });

    const accepted = await rnd.acceptSample(sample.id, rndUserId);
    expect(accepted.sample.stage).toBe(SampleStage.FORMULATING);
    expect(accepted.formula.version).toBe(1);

    const formulaId = accepted.formula.id;
    await formulas.updateFormulaV4(
      formulaId,
      {
        targetYieldGram: 500,
        phases: [
          {
            prefix: 'A',
            customName: 'Phase A',
            order: 1,
            items: [
              { materialId: null, dosagePercentage: 20, costSnapshot: 100 },
              { materialId: null, dosagePercentage: 80, costSnapshot: 100 },
            ],
          },
        ],
      } as any,
      rndUserId,
    );

    const locked = await formulas.approveFormula(formulaId, directorId);
    expect(locked.status).toBe('SAMPLE_LOCKED');

    const refused = await formulas
      .updateFormulaV4(
        formulaId,
        {
          targetYieldGram: 1000,
          phases: [
            {
              prefix: 'A',
              customName: 'Phase A',
              order: 1,
              items: [{ materialId: null, dosagePercentage: 100, costSnapshot: 1 }],
            },
          ],
        } as any,
        rndUserId,
      )
      .catch((e) => e);
    expect(reasonOf(refused)).toBe('FORMULA_LOCKED');

    // exactly one approval effect, with its audit row and its declared event
    expect(
      await prisma.auditLog.count({
        where: { entityType: 'Formula', entityId: formulaId, action: 'APPROVE_FORMULA' },
      }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: formulaId, eventType: 'rnd.formulation.locked' },
      }),
    ).toBe(1);
  }, 60000);

  // ── 4 ──────────────────────────────────────────────────────────────────────
  it('4. the artwork is finalized through the real approval chain and appears on the finalized list', async () => {
    const task = await creative.createTask({
      leadId,
      brief: `${TAG} label artwork`,
      createdBy: bdId,
    });
    expect(task.kanbanState).toBe(DesignState.INBOX);

    const v1 = await creative.uploadVersion({
      taskId: task.id,
      artworkUrl: `/uploads/${TAG}-v1.ai`,
      mockupUrl: `/uploads/${TAG}-v1.png`,
      uploadedBy: bdId,
    });

    await creative.submitToApj(task.id);
    await creative.apjReview({
      taskId: task.id,
      status: ApprovalStatus.APPROVED,
      authorId: apjId,
      pin: APJ_PIN,
      ipAddress: null,
      versionId: v1.id,
    });

    const finalized = await creative.clientReview(task.id, ApprovalStatus.APPROVED, {
      versionId: v1.id,
      authorId: bdId,
      notes: 'Client signed the artwork off',
    });
    expect(finalized.kanbanState).toBe(DesignState.LOCKED);
    expect(finalized.isFinal).toBe(true);

    expect(
      await prisma.auditLog.count({
        where: { entityType: 'DesignTask', entityId: task.id, action: 'CLIENT_APPROVE_DESIGN' },
      }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: task.id, eventType: 'design.finalized' },
      }),
    ).toBe(1);

    const page = await creative.getFinalizedDesigns(1, 100);
    expect(page.data.map((d) => d.id)).toContain(task.id);
  }, 60000);

  // ── 5 ──────────────────────────────────────────────────────────────────────
  it('5. the revision bound holds, a non-supervisor reopen is refused, and a supervisor reopen restarts the allowance', async () => {
    const task = await prisma.designTask.findFirstOrThrow({
      where: { brief: `${TAG} label artwork` },
      include: { versions: true },
    });
    let latest = task.versions.sort((a, b) => b.versionNumber - a.versionNumber)[0];

    // three revision rounds, each walked through the real state chain. The last
    // rejection spends the allowance, so no further upload happens after it — the
    // hard lock closes that path, which is asserted next.
    for (let i = 1; i <= 3; i++) {
      const round = await creative.clientReview(task.id, ApprovalStatus.REJECTED, {
        versionId: latest.id,
        authorId: bdId,
        reason: `revision ${i}`,
      });
      expect(round.revisionCount).toBe(i);
      expect(round.isLocked).toBe(i >= 3);

      if (i < 3) {
        latest = await creative.uploadVersion({
          taskId: task.id,
          artworkUrl: `/uploads/${TAG}-r${i}.ai`,
          uploadedBy: bdId,
        });
        await creative.submitToApj(task.id);
        await creative.apjReview({
          taskId: task.id,
          status: ApprovalStatus.APPROVED,
          authorId: apjId,
          pin: APJ_PIN,
          ipAddress: null,
          versionId: latest.id,
        });
      }
    }

    // a fourth demand is refused — the hard lock is real
    const pastBound = await creative
      .uploadVersion({
        taskId: task.id,
        artworkUrl: `/uploads/${TAG}-r4.ai`,
        uploadedBy: bdId,
      })
      .catch((e) => e);
    expect(reasonOf(pastBound)).toBe('DESIGN_REVISION_BOUND_REACHED');

    // the unauthorized attempt: a non-supervisor cannot reopen
    const unauthorized = await creative
      .unlockTask({
        taskId: task.id,
        action: 'CHARGE',
        userId: rndUserId,
        reason: 'let me continue',
      })
      .catch((e) => e);
    expect(reasonOf(unauthorized)).toBe('DESIGN_REOPEN_UNAUTHORIZED');
    expect(
      (await prisma.designTask.findUniqueOrThrow({ where: { id: task.id } })).isLocked,
    ).toBe(true);

    // the supervisor reopen resets the allowance, and the reset survives the next upload
    const reopened = await creative.unlockTask({
      taskId: task.id,
      action: 'CHARGE',
      userId: directorId,
      reason: 'Client changed the brand direction',
    });
    expect(reopened.revisionCount).toBe(0);
    expect(reopened.isLocked).toBe(false);
    expect(
      await prisma.auditLog.count({
        where: {
          entityType: 'DesignTask',
          entityId: task.id,
          action: 'SUPERVISOR_REOPEN_DESIGN',
        },
      }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: task.id, eventType: 'design.reopened' },
      }),
    ).toBe(1);
  }, 120000);

  // ── 6 ──────────────────────────────────────────────────────────────────────
  it('6. permits are recorded with expiry, the expiry is detectable, and an unknown expiry is not safe', async () => {
    const staff = await prisma.legalStaff.create({ data: { name: `${TAG} Legal` } });
    const base = {
      clientName: `${TAG} Corp`,
      picId: staff.id,
      applicationDate: new Date(),
    };

    // BPOM and Halal carry `category`; the HKI record does not.
    const bpom = await legality.createBpom({
      ...base,
      category: 'Cosmetic',
      bpomId: `${TAG}-BPOM`,
      productName: `${TAG} Serum`,
      expiryDate: daysFromNow(75),
    });
    const hki = await legality.createHki({
      ...base,
      hkiId: `${TAG}-HKI`,
      brandName: `${TAG} Brand`,
      type: 'Merek',
      expiryDate: daysFromNow(-2),
    });
    // HalalRecord identifies the brand by `manufacturer`, not `clientName`.
    const halal = await legality.createHalal({
      picId: staff.id,
      applicationDate: new Date(),
      category: 'Cosmetic',
      halalId: `${TAG}-HALAL`,
      productName: `${TAG} Serum`,
      manufacturer: `${TAG} Corp`,
    });

    // one record per permit authority, each with a derived audit risk
    expect(bpom.auditRisk).toBe('DELAY_AUDIT');
    expect(hki.auditRisk).toBe('CRITICAL');
    expect(halal.auditRisk).toBe('DELAY_AUDIT'); // no expiry on file is not "OK"

    const feed = await legality.getExpiryData();
    expect(feed.warning.find((i) => i.id === bpom.id)).toBeDefined();
    expect(feed.expired.find((i) => i.id === hki.id)).toBeDefined();
    // a permit with no expiry is absent from the feed rather than treated as expiring
    expect(feed.nearestExpiring.find((i) => i.id === halal.id)).toBeUndefined();

    const permits = await legality.getPermits();
    expect(permits.find((p) => p.id === `${TAG}-BPOM`)?.status).toBe('EXPIRING_SOON');
    expect(permits.find((p) => p.id === `${TAG}-HKI`)?.status).toBe('EXPIRED');
  }, 60000);

  // ── 7 ──────────────────────────────────────────────────────────────────────
  it('7. the whole thread left exactly one canonical chain behind', async () => {
    const samples = await prisma.sampleRequest.findMany({
      where: { productName: `${TAG} Serum` },
    });
    expect(samples).toHaveLength(1);
    const sampleId = samples[0].id;

    // one verified payment effect
    expect(
      await prisma.auditLog.count({
        where: { entityType: 'SampleRequest', entityId: sampleId, action: 'VERIFY_SAMPLE_PAYMENT' },
      }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: sampleId, eventType: 'sample.payment_verified' },
      }),
    ).toBe(1);

    // one approved formulation on that sample
    const approvedFormulas = await prisma.formula.count({
      where: { sampleRequestId: sampleId, status: 'SAMPLE_LOCKED' },
    });
    expect(approvedFormulas).toBe(1);

    // one finalized artwork, one recorded permit per authority
    expect(await prisma.designTask.count({ where: { brief: `${TAG} label artwork`, isFinal: false } })).toBe(1); // reopened, so no longer final
    expect(await prisma.bpomRecord.count({ where: { bpomId: `${TAG}-BPOM` } })).toBe(1);
    expect(await prisma.hkiRecord.count({ where: { hkiId: `${TAG}-HKI` } })).toBe(1);
    expect(await prisma.halalRecord.count({ where: { halalId: `${TAG}-HALAL` } })).toBe(1);

    // every governed write in this thread left an audit row
    const governed = await prisma.auditLog.findMany({
      where: {
        entityType: { in: ['SampleRequest', 'Formula', 'DesignTask'] },
        entityId: { in: [sampleId, ...(await formulaIdsOf(sampleId)), ...(await designIdsOf())] },
      },
      select: { action: true },
    });
    const actions = governed.map((a) => a.action);
    for (const expected of [
      'VERIFY_SAMPLE_PAYMENT',
      'UPDATE_FORMULA_COMPOSITION',
      'APPROVE_FORMULA',
      'CLIENT_APPROVE_DESIGN',
      'SUPERVISOR_REOPEN_DESIGN',
    ]) {
      expect(actions).toContain(expected);
    }
    // cross-tenant / unauthorized mutation count is zero: the only refused reopen
    // wrote nothing
    expect(
      await prisma.auditLog.count({
        where: { action: 'SUPERVISOR_REOPEN_DESIGN', actorUserId: rndUserId },
      }),
    ).toBe(0);
  }, 60000);

  async function formulaIdsOf(sampleId: string): Promise<string[]> {
    const rows = await prisma.formula.findMany({
      where: { sampleRequestId: sampleId },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async function designIdsOf(): Promise<string[]> {
    const rows = await prisma.designTask.findMany({
      where: { brief: { startsWith: TAG } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
});
