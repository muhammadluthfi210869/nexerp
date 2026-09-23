/**
 * P18-S4: RBAC & Executive Audit Trail Governance Acceptance Suite.
 *
 * Verifies:
 * - AC-P18-05: RBAC & Executive Audit Trail Governance
 * - S4.1: Cross-cutting read for DIRECTOR and SUPER_ADMIN
 * - S4.2: Audit log access for auditor / security roles
 * - S4.3: Departmental restriction (403 Forbidden) for unauthorized staff
 * - S4.4: GET /executive/audit-logs returns real records from ActivityLog (zero mock fallback)
 */
import request from 'supertest';
import { UserRole, LogActivityType } from '@prisma/client';
import { bootP18App, P18App } from './p18-http-harness';
import { randomUUID } from 'crypto';

describe('P18 S4: RBAC & Executive Audit Trail Governance', () => {
  let p18: P18App;
  let superAdminToken: string;
  let directorToken: string;
  let auditorToken: string;
  let operatorToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    p18 = await bootP18App();
    await p18.cleanupP18Data();

    const admin = await p18.createUser('SuperAdmin', [UserRole.SUPER_ADMIN]);
    superAdminToken = admin.token;
    adminUserId = admin.user.id;

    const director = await p18.createUser('Director', [UserRole.DIRECTOR]);
    directorToken = director.token;

    const auditor = await p18.createUser('Auditor', [UserRole.IT_SYS]);
    auditorToken = auditor.token;

    const operator = await p18.createUser('Operator', [UserRole.PRODUCTION_OP]);
    operatorToken = operator.token;

    // Seed real activity log
    await p18.prisma.activityLog.create({
      data: {
        userId: adminUserId,
        type: LogActivityType.CREATE,
        entityType: 'SalesOrder',
        entityId: randomUUID(),
        path: '/sales/orders',
        method: 'POST',
        status: 201,
        metadata: { action: 'P18 Audit Verification' },
      },
    });
  });

  afterAll(async () => {
    await p18.cleanupP18Data();
    await p18.app.close();
  });

  it('S4.1 - DIRECTOR and SUPER_ADMIN have full cross-cutting executive read rights', async () => {
    // Director
    await request(p18.app.getHttpServer())
      .get('/dashboards/executive')
      .set('Authorization', `Bearer ${directorToken}`)
      .expect(200);

    // Super Admin
    await request(p18.app.getHttpServer())
      .get('/executive/metrics')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    await request(p18.app.getHttpServer())
      .get('/reports/ar-aging')
      .set('Authorization', `Bearer ${directorToken}`)
      .expect(200);
  });

  it('S4.2 - Auditor / IT_SYS has access to audit logs', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/executive/audit-logs')
      .set('Authorization', `Bearer ${auditorToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('S4.3 - PRODUCTION_OP is denied (403 Forbidden) from accessing executive analytics', async () => {
    await request(p18.app.getHttpServer())
      .get('/dashboards/executive')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(403);

    await request(p18.app.getHttpServer())
      .get('/executive/metrics')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(403);

    await request(p18.app.getHttpServer())
      .get('/reports/profit-loss')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(403);
  });

  it('S4.4 - GET /executive/audit-logs returns real ActivityLog events (zero mock fallback)', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/executive/audit-logs')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const target = res.body.find((l: any) => l.entity === 'SalesOrder');
    expect(target).toBeDefined();
    expect(target.action).toBe('CREATE');
    expect(target.status).toBe('SUCCESS');
    expect(target.details).toContain('P18 Audit Verification');
  });
});
