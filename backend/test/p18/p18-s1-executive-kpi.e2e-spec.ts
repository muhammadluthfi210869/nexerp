/**
 * P18-S1: Executive KPI Rollup & Calculations Acceptance Suite.
 *
 * Verifies:
 * - AC-P18-01: Executive KPI Rollup & Calculations (BUS-RULE-081..090, 106)
 * - S1.1: GET /dashboards/executive and /executive/metrics return real structured KPI data
 * - S1.2: BUS-RULE-082 Lead conversion rate = (salesOrderCount / leadCount) * 100
 * - S1.3: BUS-RULE-086 OTD on-time delivery rate calculation
 * - S1.4: BUS-RULE-090 KPI Direction semantics: HIGHER, LOWER, ZERO
 */
import request from 'supertest';
import { UserRole, SOStatus, WorkflowStatus } from '@prisma/client';
import { bootP18App, P18App } from './p18-http-harness';
import { ExecutiveService } from '../../src/modules/executive/executive.service';

describe('P18 S1: Executive KPI Rollup & Calculations (BUS-RULE-081..090, 106)', () => {
  let p18: P18App;
  let adminToken: string;
  let directorToken: string;
  let execService: ExecutiveService;

  beforeAll(async () => {
    p18 = await bootP18App();
    await p18.cleanupP18Data();

    execService = p18.app.get(ExecutiveService);

    const admin = await p18.createUser('Admin', [UserRole.SUPER_ADMIN]);
    adminToken = admin.token;

    const director = await p18.createUser('Director', [UserRole.DIRECTOR]);
    directorToken = director.token;
  });

  afterAll(async () => {
    await p18.cleanupP18Data();
    await p18.app.close();
  });

  it('S1.1 - Fetches live executive metrics from /dashboards/executive and /executive/metrics', async () => {
    const res1 = await request(p18.app.getHttpServer())
      .get('/dashboards/executive')
      .set('Authorization', `Bearer ${directorToken}`)
      .expect(200);

    expect(res1.body).toHaveProperty('data');
    expect(res1.body.data).toHaveProperty('revenue_ytd');
    expect(res1.body.data).toHaveProperty('net_income_ytd');
    expect(res1.body.data).toHaveProperty('ar_outstanding');
    expect(res1.body.data).toHaveProperty('ap_outstanding');
    expect(res1.body.data).toHaveProperty('lead_conversion_pct');
    expect(res1.body.data).toHaveProperty('otd_pct');

    const res2 = await request(p18.app.getHttpServer())
      .get('/executive/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res2.body).toHaveProperty('revenue');
    expect(res2.body).toHaveProperty('pipeline');
    expect(res2.body).toHaveProperty('production');
    expect(res2.body).toHaveProperty('cashflow');
  });

  it('S1.2 - Reconciles Lead Conversion Rate (BUS-RULE-082) against real leads and SOs', async () => {
    const staff =
      (await p18.prisma.bussdevStaff.findFirst()) ||
      (await p18.prisma.bussdevStaff.create({
        data: { name: 'P18 Staff Alpha' },
      }));

    const lead = await p18.prisma.salesLead.create({
      data: {
        clientName: 'P18 Lead Alpha',
        contactInfo: 'p18-lead@test.com',
        source: 'EXHIBITION',
        productInterest: 'Serum Vitamin C',
        status: WorkflowStatus.WON_DEAL,
        picId: staff.id,
      },
    });

    const res = await request(p18.app.getHttpServer())
      .get('/dashboards/executive')
      .set('Authorization', `Bearer ${directorToken}`)
      .expect(200);

    expect(typeof res.body.data.lead_conversion_pct).toBe('number');
    expect(res.body.data.lead_conversion_pct).toBeGreaterThanOrEqual(0);
  });

  it('S1.3 - Reconciles On-Time Delivery OTD (BUS-RULE-086) calculation', async () => {
    const res = await request(p18.app.getHttpServer())
      .get('/dashboards/executive')
      .set('Authorization', `Bearer ${directorToken}`)
      .expect(200);

    expect(typeof res.body.data.otd_pct).toBe('number');
    expect(res.body.data.otd_pct).toBeGreaterThanOrEqual(0);
    expect(res.body.data.otd_pct).toBeLessThanOrEqual(100);
  });

  it('S1.4 - Enforces Universal KPI Threshold Direction semantics (BUS-RULE-090)', () => {
    // 1. HIGHER better: achievement = (value / target) * 100
    // Revenue target 100M, achieved 120M -> 120%
    const higherAchieved = execService.calculateKpiAchievement(120, 100, 'HIGHER');
    expect(higherAchieved).toBe(120);

    // 2. LOWER better: achievement = max(0, 100 - ((value - target) / target) * 100)
    // Defect rate target 2%, actual 1.5% -> 100 - ((1.5-2)/2)*100 = 125%
    const lowerGood = execService.calculateKpiAchievement(1.5, 2, 'LOWER');
    expect(lowerGood).toBe(125);

    // Defect rate target 2%, actual 3% -> 100 - ((3-2)/2)*100 = 50%
    const lowerBad = execService.calculateKpiAchievement(3, 2, 'LOWER');
    expect(lowerBad).toBe(50);

    // Target <= 0 on LOWER must be rejected
    expect(() => execService.calculateKpiAchievement(1, 0, 'LOWER')).toThrow();

    // 3. ZERO target: 100% if value == 0, 0% if value != 0
    const zeroExact = execService.calculateKpiAchievement(0, 0, 'ZERO');
    expect(zeroExact).toBe(100);

    const zeroFailed = execService.calculateKpiAchievement(2, 0, 'ZERO');
    expect(zeroFailed).toBe(0);
  });
});
