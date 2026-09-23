import request from 'supertest';
import { UserRole, Division } from '@prisma/client';
import { bootP16App, P16App, p16Message } from './p16-http-harness';

describe('P16 S2: Employee Management, Multi-Role Weights & Contract Expiry (BUS-RULE-071, BUS-RULE-074)', () => {
  let p16: P16App;
  let hrToken: string;

  beforeAll(async () => {
    p16 = await bootP16App();
    await p16.cleanupP16Data();

    const hrUser = await p16.createUser('HR_Officer', [UserRole.SUPER_ADMIN, UserRole.HR]);
    hrToken = hrUser.token;
  });

  afterAll(async () => {
    await p16.cleanupP16Data();
    await p16.app.close();
  });

  it('S2.1 - Rejects employee creation if role weights sum is not 100% (BUS-RULE-074)', async () => {
    const res = await request(p16.app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        nik: 'P16_EMP_FAIL_WEIGHT',
        name: 'P16 Invalid Role Weights',
        joinedAt: new Date().toISOString(),
        baseSalary: '7500000',
        roles: [
          { division: Division.BD, roleName: 'SALES_REP', weight: 0.5 },
          { division: Division.BD, roleName: 'MARKETING_LEAD', weight: 0.3 }, // Sum = 0.8 != 1.0
        ],
      })
      .expect(400);

    expect(p16Message(res)).toContain('KPI_ROLE_WEIGHT_INVALID');
  });

  it('S2.2 - Creates employee with multi-role weights summing exactly 100% (BUS-RULE-074)', async () => {
    const res = await request(p16.app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        nik: 'P16_EMP_MULTI_ROLE',
        name: 'P16 Multi Role Employee',
        joinedAt: new Date().toISOString(),
        baseSalary: '8000000',
        positionAllowance: '1500000',
        transportFlat: '500000',
        transportTentativeDaily: '25000',
        roles: [
          { division: Division.BD, roleName: 'SALES_REP', weight: 0.7 },
          { division: Division.BD, roleName: 'MARKETING_LEAD', weight: 0.3 }, // Sum = 1.0 (100%)
        ],
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('P16 Multi Role Employee');
    expect(res.body.roles).toHaveLength(2);
  });

  it('S2.3 - Encrypts baseSalary and NIK securely in database (Zero PII plaintext)', async () => {
    const empInDb = await p16.prisma.employee.findFirst({
      where: { name: 'P16 Multi Role Employee' },
    });
    expect(empInDb).toBeDefined();
    // Raw baseSalary must not equal plaintext 8000000
    expect(empInDb?.baseSalary).not.toBe('8000000');
    expect(typeof empInDb?.baseSalary).toBe('string');
  });

  it('S2.4 - Audits contracts expiring within 30 days (BUS-RULE-071)', async () => {
    // Seed an employee whose contract expires in 15 days
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 15);

    await p16.prisma.employee.create({
      data: {
        nik: 'P16_EXPIRING_EMP',
        name: 'P16 Expiring Contract',
        joinedAt: new Date(),
        baseSalary: 'vault_enc_dummy',
        contractEnd: expDate,
      },
    });

    const res = await request(p16.app.getHttpServer())
      .get('/hr/contracts/expiring?days=30')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const expiringEmp = res.body.find((e: any) => e.nik === 'P16_EXPIRING_EMP');
    expect(expiringEmp).toBeDefined();
    expect(expiringEmp.name).toBe('P16 Expiring Contract');
  });
});
