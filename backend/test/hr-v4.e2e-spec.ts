import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { EncryptionService } from '../src/shared/encryption.service';
import { GeofencingService } from '../src/shared/geofencing.service';
import { AttendanceStatus, PayrollStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('HR & Performance V4 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let encryption: EncryptionService;
  let geofencing: GeofencingService;
  let eventEmitter: EventEmitter2;
  let testEmployeeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    encryption = app.get<EncryptionService>(EncryptionService);
    geofencing = app.get<GeofencingService>(GeofencingService);
    eventEmitter = app.get<EventEmitter2>(EventEmitter2);

    // Setup Test Employee
    const emp = await prisma.employee.create({
      data: {
        name: 'QA Tester',
        joinedAt: new Date(),
        baseSalary: encryption.encrypt('10000000'),
        isActive: true,
      },
    });
    testEmployeeId = emp.id;

    // Setup System Config for Geofencing (Jakarta Center)
    await prisma.systemConfig.upsert({
      where: { key: 'FACTORY_LAT' },
      update: { value: '-6.200000' },
      create: { key: 'FACTORY_LAT', value: '-6.200000', group: 'HR' },
    });
    await prisma.systemConfig.upsert({
      where: { key: 'FACTORY_LNG' },
      update: { value: '106.816666' },
      create: { key: 'FACTORY_LNG', value: '106.816666', group: 'HR' },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.attendance
      .deleteMany({ where: { employeeId: testEmployeeId } })
      .catch(() => {});
    await prisma.payrollItem
      .deleteMany({ where: { employeeId: testEmployeeId } })
      .catch(() => {});
    await prisma.kpiPointLog
      .deleteMany({ where: { employeeId: testEmployeeId } })
      .catch(() => {});
    await prisma.employee
      .delete({ where: { id: testEmployeeId } })
      .catch(() => {});
    await app.close();
  });

  describe('Core Components Validation', () => {
    it('Encryption: Should handle AES-256-GCM correctly', () => {
      const secret = 'TOP_SECRET_SALARY_DATA';
      const encrypted = encryption.encrypt(secret);
      expect(encrypted).toContain(':');
      const decrypted = encryption.decrypt(encrypted);
      expect(decrypted).toBe(secret);
    });

    it('Geofencing: Should correctly calculate distance (Haversine)', () => {
      const res = geofencing.isWithinRadius(
        -6.2001,
        106.816666,
        -6.2,
        106.816666,
        50,
      );
      expect(res.isWithin).toBe(true);
      expect(res.distance).toBeLessThan(50);
    });
  });

  describe('Operational Workflows', () => {
    it('Attendance: Should clock-in successfully if within radius', async () => {
      const res = await request(app.getHttpServer())
        .post('/hr/attendance/clock-in')
        .send({
          employeeId: testEmployeeId,
          lat: -6.200005,
          lng: 106.816668,
        })
        .expect(201);

      expect(res.body.status).toBe(AttendanceStatus.ON_TIME);
    });

    it('Passive Harvesting: Should log KPI points on system events', async () => {
      const eventCode = 'test.harvest.event';
      await prisma.kpiMetricDefinition.upsert({
        where: { eventCode },
        update: { points: 50 },
        create: {
          eventCode,
          label: 'Unit Test Harvest',
          points: 50,
          division: 'SYSTEM',
        },
      });

      eventEmitter.emit(eventCode, { employeeId: testEmployeeId });

      await new Promise((r) => setTimeout(r, 1000));

      const log = await prisma.kpiPointLog.findFirst({
        where: { employeeId: testEmployeeId, metricCode: eventCode },
      });

      expect(log).toBeDefined();
      expect(log?.points).toBe(50);
    });

    it('Payroll: Should encrypt all salary fields in draft', async () => {
      const period = '2024-05';
      const res = await request(app.getHttpServer())
        .post('/hr/payroll/generate')
        .send({ period })
        .expect(201);

      const payrollId = res.body.id;
      const item = await prisma.payrollItem.findFirst({
        where: { payrollId, employeeId: testEmployeeId },
      });

      expect(item).toBeDefined();
      expect(item?.baseSalary).not.toBe('10000000');
      expect(encryption.decrypt(item!.baseSalary)).toBe('10000000');
    });
  });
});
