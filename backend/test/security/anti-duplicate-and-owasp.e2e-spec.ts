import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';

describe('Security & Stress: Anti-Duplicate Numbering & OWASP Penetration (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let idGen: IdGeneratorService;

  const runId = randomUUID().slice(0, 6).toUpperCase();
  const testPrefix = `TST-${runId}`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    idGen = app.get(IdGeneratorService);
  }, 120000);

  afterAll(async () => {
    // Cleanup system sequence entries created during the test
    await prisma.systemSequence.deleteMany({
      where: { prefix: { in: [testPrefix, `INV-${runId}`] } },
    });
    await app.close();
  });

  describe('1. Anti-Duplicate Sequence Number Stress Test (100 Concurrent Calls)', () => {
    it('executes 100 concurrent ID generation requests with 0 duplicates and 0 deadlocks', async () => {
      const CONCURRENT_COUNT = 100;
      const prefix = `INV-${runId}`;

      const promises = Array.from({ length: CONCURRENT_COUNT }, () =>
        idGen.generateId(prefix, 5),
      );

      const results = await Promise.all(promises);

      // 1. All 100 requests must succeed
      expect(results).toHaveLength(CONCURRENT_COUNT);

      // 2. Strict Uniqueness: Set size must equal 100 (ZERO duplicate invoice numbers)
      const uniqueSet = new Set(results);
      expect(uniqueSet.size).toBe(CONCURRENT_COUNT);

      // 3. Sequential Integrity: Numbers must cover 00001 through 00100
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const expectedPeriod = `${year}${month}`;

      for (let i = 1; i <= CONCURRENT_COUNT; i++) {
        const padded = String(i).padStart(5, '0');
        const expectedId = `${prefix}-${expectedPeriod}-${padded}`;
        expect(uniqueSet.has(expectedId)).toBe(true);
      }
    });
  });

  describe('2. OWASP Injection Resistance (SQLi & XSS Payload Penetration)', () => {
    it('neutralizes classic SQL injection payloads in auth login without database error', async () => {
      const sqliPayloads = [
        "' OR '1'='1",
        "admin'--",
        "'; DROP TABLE unified_invoices; --",
        "1' OR 1=1 #",
        "' UNION SELECT null, null, null --",
      ];

      for (const payload of sqliPayloads) {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: payload,
            password: 'password123',
          });

        // Must reject cleanly with 400 or 401, NEVER 500 (no SQL syntax crash or leaked table details)
        expect([400, 401]).toContain(res.status);
        expect(res.body).not.toHaveProperty('code', '42601'); // Postgres syntax error code
        expect(JSON.stringify(res.body)).not.toMatch(/syntax error/i);
      }
    });

    it('rejects forbidden non-whitelisted injection attributes in payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'valid.user@nexerp.test',
          password: 'password123',
          maliciousField: "<script>alert('xss')</script>",
          __proto__: { isAdmin: true },
        });

      // Whitelist validation pipe must reject unexpected properties
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/property maliciousField should not exist/i);
    });

    it('rejects forged and malformed JWT bearer tokens with 401 Unauthorized', async () => {
      const forgedTokens = [
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.', // Alg 'none' bypass attack
        'Bearer invalid-signature-token-xxx',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered_payload.fake_signature',
      ];

      for (const token of forgedTokens) {
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', token.startsWith('Bearer') ? token : `Bearer ${token}`);

        expect(res.status).toBe(401);
      }
    });
  });
});
