import request from 'supertest';
import { UserRole, LogActivityType, Division } from '@prisma/client';
import { bootP16App, P16App, p16Message } from './p16-http-harness';

describe('P16 S4: KPI Engine, Passive Event Harvesting, Monthly Trends & Leaderboard (BUS-RULE-072, BUS-RULE-118)', () => {
  let p16: P16App;
  let hrToken: string;
  let user1Token: string;
  let user1Id: string;
  let user2Id: string;
  let employeeId: string;

  beforeAll(async () => {
    p16 = await bootP16App();
    await p16.cleanupP16Data();

    const hrUser = await p16.createUser('HR_Kpi', [UserRole.SUPER_ADMIN, UserRole.HR]);
    hrToken = hrUser.token;

    const u1 = await p16.createUser('KpiUserOne', [UserRole.PRODUCTION_OP]);
    user1Token = u1.token;
    user1Id = u1.user.id;

    const u2 = await p16.createUser('KpiUserTwo', [UserRole.PRODUCTION_OP]);
    user2Id = u2.user.id;

    const emp = await p16.prisma.employee.create({
      data: {
        nik: 'P16_EMP_KPI_01',
        name: 'P16 Kpi Subject Employee',
        joinedAt: new Date(),
        baseSalary: 'vault_enc_dummy',
        userId: user1Id,
      },
    });
    employeeId = emp.id;

    // Seed ActivityLogs for user 1: 5 CREATEs, 4 STATE_TRANSITIONs (completionRate = 4/5 = 0.8)
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      await p16.prisma.activityLog.create({
        data: {
          user: { connect: { id: user1Id } },
          type: LogActivityType.CREATE,
          division: Division.BD,
          createdAt: now,
        },
      });
    }
    for (let i = 0; i < 4; i++) {
      await p16.prisma.activityLog.create({
        data: {
          user: { connect: { id: user1Id } },
          type: LogActivityType.STATE_TRANSITION,
          division: Division.BD,
          createdAt: now,
        },
      });
    }

    // Seed ActivityLogs for user 2: 2 CREATEs, 2 STATE_TRANSITIONs (completionRate = 2/2 = 1.0)
    for (let i = 0; i < 2; i++) {
      await p16.prisma.activityLog.create({
        data: {
          user: { connect: { id: user2Id } },
          type: LogActivityType.CREATE,
          division: Division.BD,
          createdAt: now,
        },
      });
      await p16.prisma.activityLog.create({
        data: {
          user: { connect: { id: user2Id } },
          type: LogActivityType.STATE_TRANSITION,
          division: Division.BD,
          createdAt: now,
        },
      });
    }
  });

  afterAll(async () => {
    await p16.cleanupP16Data();
    await p16.app.close();
  });

  it('S4.1 - Strictly blocks manual subjective KPI score injection (BUS-RULE-072, PERFORMANCE_MANUAL_BLOCKED)', async () => {
    const res = await request(p16.app.getHttpServer())
      .post('/hr/kpi/subjective')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId,
        period: '2026-09',
        score: 95,
      })
      .expect(400);

    expect(p16Message(res)).toContain('PERFORMANCE_MANUAL_BLOCKED');
  });

  it('S4.2 - Retrieves canonical KPI definitions', async () => {
    const res = await request(p16.app.getHttpServer())
      .get('/kpi/definitions')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('code');
  });

  it('S4.3 - Computes authenticated user scorecard via GET /kpi/me with passive event metrics', async () => {
    const res = await request(p16.app.getHttpServer())
      .get('/kpi/me')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    expect(res.body.userId).toBe(user1Id);
    expect(res.body.total).toBe(9); // 5 creates + 4 transitions
    expect(res.body.completionRate).toBe(0.8);
    expect(res.body.breakdown[LogActivityType.CREATE]).toBe(5);
    expect(res.body.breakdown[LogActivityType.STATE_TRANSITION]).toBe(4);
  });

  it('S4.4 - Retrieves monthly KPI trends for graphical visualization (BUS-RULE-118)', async () => {
    const res = await request(p16.app.getHttpServer())
      .get(`/kpi/monthly-trends?userId=${user1Id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(6); // Last 6 months
    const currentMonth = res.body[res.body.length - 1];
    expect(currentMonth.total).toBe(9);
    expect(currentMonth.completionRate).toBe(0.8);
  });

  it('S4.5 - Ranks top performers in global leaderboard (BUS-RULE-118)', async () => {
    const res = await request(p16.app.getHttpServer())
      .get('/kpi/leaderboard?limit=5')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    // User 2 has completionRate 1.0, user 1 has 0.8
    const u2Entry = res.body.find((p: any) => p.userId === user2Id);
    const u1Entry = res.body.find((p: any) => p.userId === user1Id);

    expect(u2Entry).toBeDefined();
    expect(u1Entry).toBeDefined();
    expect(u2Entry.completionRate).toBe(1.0);
    expect(u1Entry.completionRate).toBe(0.8);
  });

  it('S4.6 - Handles division KPI calculation with null safety for 0 denominator', async () => {
    const res = await request(p16.app.getHttpServer())
      .get(`/kpi/division/${Division.FINANCE}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(res.body.division).toBe(Division.FINANCE);
    // If no users have activity, returns aggregateScore 0, never NaN
    expect(Number.isFinite(res.body.aggregateScore)).toBe(true);
  });
});
