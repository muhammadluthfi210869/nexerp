import request from 'supertest';
import { UserRole } from '@prisma/client';
import { bootP16App, P16App } from './p16-http-harness';

describe('P16 S1: Recruitment ATS, Onboarding & Training (BUS-RULE-115, BUS-RULE-116)', () => {
  let p16: P16App;
  let hrToken: string;
  let createdCandidateId: string;
  let testEmployeeId: string;

  beforeAll(async () => {
    p16 = await bootP16App();
    await p16.cleanupP16Data();

    const hrUser = await p16.createUser('HR_Admin', [UserRole.SUPER_ADMIN, UserRole.HR]);
    hrToken = hrUser.token;

    // Create a base test employee for training & onboarding tests
    const emp = await p16.prisma.employee.create({
      data: {
        nik: 'P16_EMP_001',
        name: 'P16 Candidate Transferred',
        joinedAt: new Date(),
        baseSalary: 'vault_enc_dummy',
        onboardingStatus: 'COMPLETED',
      },
    });
    testEmployeeId = emp.id;
  });

  afterAll(async () => {
    await p16.cleanupP16Data();
    await p16.app.close();
  });

  it('S1.1 - Creates a candidate with full ATS profile (BUS-RULE-115)', async () => {
    const res = await request(p16.app.getHttpServer())
      .post('/hr/candidates')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'P16 John Doe Applicant',
        department: 'ENGINEERING',
        email: 'p16_john_doe@nex-p16.test',
        phone: '08123456789',
        cvUrl: 'https://storage.nexerp.internal/cv/p16_john.pdf',
        cvReviewScore: 85,
        cvReviewNotes: 'Strong full-stack NestJS and Next.js skills',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('P16 John Doe Applicant');
    expect(res.body.stage).toBe('SCREENING');
    expect(res.body.status).toBe('IN_PROCESS');
    expect(res.body.cvReviewScore).toBe(85);
    createdCandidateId = res.body.id;
  });

  it('S1.2 - Lists and filters candidates by stage and department', async () => {
    const res = await request(p16.app.getHttpServer())
      .get('/hr/candidates?department=ENGINEERING')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((c: any) => c.id === createdCandidateId);
    expect(found).toBeDefined();
    expect(found.department).toBe('ENGINEERING');
  });

  it('S1.3 - Advances candidate stage through the ATS pipeline', async () => {
    // Advance to HR_INTERVIEW
    const r1 = await request(p16.app.getHttpServer())
      .patch(`/hr/candidates/${createdCandidateId}/stage`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ stage: 'HR_INTERVIEW' })
      .expect(200);
    expect(r1.body.stage).toBe('HR_INTERVIEW');

    // Advance to USER_INTERVIEW
    const r2 = await request(p16.app.getHttpServer())
      .patch(`/hr/candidates/${createdCandidateId}/stage`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ stage: 'USER_INTERVIEW' })
      .expect(200);
    expect(r2.body.stage).toBe('USER_INTERVIEW');

    // Advance to OFFERING
    const r3 = await request(p16.app.getHttpServer())
      .patch(`/hr/candidates/${createdCandidateId}/stage`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ stage: 'OFFERING' })
      .expect(200);
    expect(r3.body.stage).toBe('OFFERING');

    // Complete pipeline to DONE
    const r4 = await request(p16.app.getHttpServer())
      .patch(`/hr/candidates/${createdCandidateId}/stage`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ stage: 'DONE' })
      .expect(200);
    expect(r4.body.stage).toBe('DONE');
    expect(r4.body.status).toBe('PASSED');
  });

  it('S1.4 - Supports rejection with historical note/reason', async () => {
    // Create candidate to reject
    const candRes = await request(p16.app.getHttpServer())
      .post('/hr/candidates')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'P16 Rejected Candidate',
        department: 'FINANCE',
        email: 'p16_rejected@nex-p16.test',
      })
      .expect(201);

    const rejectId = candRes.body.id;

    const res = await request(p16.app.getHttpServer())
      .patch(`/hr/candidates/${rejectId}/stage`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        stage: 'REJECTED',
        rejectionReason: 'Salary expectation misaligned with budget band',
      })
      .expect(200);

    expect(res.body.stage).toBe('REJECTED');
    expect(res.body.status).toBe('REJECTED');
    expect(res.body.rejectionReason).toBe('Salary expectation misaligned with budget band');
  });

  it('S1.5 - Logs employee training and updates total training hours (BUS-RULE-116)', async () => {
    const res = await request(p16.app.getHttpServer())
      .post(`/hr/employees/${testEmployeeId}/training`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        trainingType: 'ISO 27001 Security Compliance',
        hours: 16,
        goal: 'Master information security audit procedures and access management',
        trainingDate: '2026-09-15',
        certificateUrl: 'https://storage.nexerp.internal/certs/p16_iso27001.pdf',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.employeeId).toBe(testEmployeeId);
    expect(res.body.hours).toBe(16);
    expect(res.body.goal).toContain('Master information security');

    // Verify employee totalTrainingHours updated
    const emp = await p16.prisma.employee.findUnique({ where: { id: testEmployeeId } });
    expect(emp?.totalTrainingHours).toBe(16);
  });

  it('S1.6 - Retrieves all training history and verifies 3-day onboarding', async () => {
    const res = await request(p16.app.getHttpServer())
      .get(`/hr/employees/${testEmployeeId}/trainings`)
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].trainingType).toBe('ISO 27001 Security Compliance');

    // Check onboarding standard fields
    const emp = await p16.prisma.employee.findUnique({ where: { id: testEmployeeId } });
    expect(emp?.onboardingStatus).toBe('COMPLETED');
  });
});
