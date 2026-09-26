import request from 'supertest';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';

import { bootP08App, p08Code, type P08App } from '../p08/p08-http-harness';
import { AuthService } from '../../src/modules/auth/auth.service';

/**
 * Fase 3a — the minimum tenant foundation, proved through a REAL login.
 *
 * The isolation suite (`tenant-isolation.e2e-spec.ts`) proves the `/rnd` surface
 * refuses cross-tenant access, but it mints its tokens through the harness, which
 * injects the `organizationId` claim directly. That leaves the decisive question
 * open: after a real `POST /auth/login`, does the issued access token carry a
 * tenant, or does every real session 400 on `/rnd`?
 *
 * Today it carries none — `auth.service.ts:103-108` signs only
 * `{sub, email, roles, sessionId}`, so `jwt.strategy.ts:60` maps an always-
 * `undefined` claim. This spec is the FAILING reproduction CLAUDE.md requires
 * before the fix: it drives the real login route and then calls `/rnd`.
 *
 * The tenant source is `tenant_scopes` (the membership table that already exists,
 * and the one `platform/scope/scope.service.ts` reads). No new table is needed.
 */
const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_login_tenant_${RUN_ID}`;
const PASSWORD = 'p08-tenant-claim-probe';

describe('login issues a tenant claim (Fase 3a minimum foundation)', () => {
  let ctx: P08App;
  let prisma: P08App['prisma'];
  let tenant: string;
  let email: string;
  let leadId: string;
  const userIds: string[] = [];
  const sampleIds: string[] = [];

  const server = () => ctx.app.getHttpServer();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ctx = await bootP08App();
    prisma = ctx.prisma;
    tenant = randomUUID();

    email = `${TAG}.rnd@nex-p08.test`;
    const passwordHash = await ctx.app.get(AuthService).hashPassword(PASSWORD);

    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        fullName: `${TAG} rnd`,
        passwordHash,
        roles: ['RND'] as any,
        status: 'ACTIVE' as any,
      },
    });
    userIds.push(user.id);

    // Membership — the tenant a real login must be scoped to.
    await prisma.tenantScope.create({
      data: {
        userId: user.id,
        organizationId: tenant,
        effectiveFrom: new Date(),
        primary: true,
      },
    });

    const staff = await prisma.bussdevStaff.create({
      data: { name: `${TAG} Staff`, organizationId: tenant },
    });
    const lead = await prisma.salesLead.create({
      data: {
        clientName: `${TAG} Corp`,
        contactInfo: `0815${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'login tenant claim',
        picId: staff.id,
        organizationId: tenant,
      },
    });
    leadId = lead.id;
  }, 180000);

  afterAll(async () => {
    try {
      await prisma.sampleStageLog.deleteMany({
        where: { sampleRequestId: { in: sampleIds } },
      });
      await prisma.sampleRequest.deleteMany({ where: { id: { in: sampleIds } } });
      await prisma.tenantScope.deleteMany({ where: { userId: { in: userIds } } });
      // Filters are never left `undefined`: that would widen them to "every row".
      await prisma.salesLead.deleteMany({ where: { clientName: `${TAG} Corp` } });
      await prisma.bussdevStaff.deleteMany({ where: { name: `${TAG} Staff` } });
      await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}.` } } });
    } finally {
      await ctx.app.close();
    }
  }, 120000);

  it('POST /auth/login returns a token whose claim resolves a tenant on /rnd', async () => {
    const login = await request(server())
      .post('/auth/login')
      .send({ email, password: PASSWORD });
    expect([200, 201]).toContain(login.status);

    const token =
      login.body.access_token ?? login.body.accessToken ?? login.body.accessToken;
    expect(typeof token).toBe('string');

    // 1. The claim itself. `jwt.strategy.ts` reads `organizationId || tenantId`.
    const decoded = jwt.decode(token) as Record<string, unknown> | null;
    expect(decoded).not.toBeNull();
    expect(decoded!.organizationId ?? decoded!.tenantId).toBe(tenant);

    // 2. The claim actually works end to end: a real session can create a sample
    //    for its own tenant's lead, instead of 400 TENANT_UNRESOLVED.
    const created = await request(server())
      .post('/rnd/samples')
      .set(auth(token))
      .send({
        leadId,
        productName: `${TAG} sample`,
        targetFunction: 'Brightening',
        textureReq: 'Liquid',
        colorReq: 'Clear',
        aromaReq: 'None',
      });
    expect(p08Code(created.body)).not.toBe('TENANT_UNRESOLVED');
    expect(created.status).toBe(201);
    sampleIds.push(created.body.id);
  }, 90000);
});