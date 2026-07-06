import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { DesignState, ApprovalStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/roles.guard';
import { ExecutionContext } from '@nestjs/common';

describe('Creative & Packaging Design V4 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;
  let testTaskId: string;
  let testLeadId: string;
  let testStaffId: string;
  const CORRECT_PIN = '123456';
  const MOCK_USER_ID = '00000000-0000-4000-a000-000000000001';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: MOCK_USER_ID, roles: [UserRole.SUPER_ADMIN] };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const hashedPin = await bcrypt.hash(CORRECT_PIN, 10);
    const hashedManagerPin = await bcrypt.hash('654321', 10);
    const user = await prisma.user.create({
      data: {
        id: MOCK_USER_ID,
        email: `tester-${Date.now()}@dreamlab.id`,
        fullName: 'Test APJ',
        passwordHash: 'hashed_pw',
        approvalPin: hashedPin,
        managerPin: hashedManagerPin,
        roles: ['APJ', 'SUPER_ADMIN'],
        status: 'ACTIVE',
      },
    });
    testUserId = user.id;

    const staff = await prisma.bussdevStaff.create({
      data: {
        userId: testUserId,
        name: 'Test Staff',
      },
    });
    testStaffId = staff.id;

    const lead = await prisma.salesLead.create({
      data: {
        clientName: 'Test Client',
        brandName: 'Test Brand',
        contactInfo: '0812345678',
        source: 'GOOGLE',
        productInterest: 'Serum Packaging',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;
  });

  afterAll(async () => {
    await prisma.purchaseOrder.deleteMany().catch(() => {});
    await prisma.designFeedback.deleteMany().catch(() => {});
    await prisma.designVersion.deleteMany().catch(() => {});
    await prisma.designTask.deleteMany().catch(() => {});
    await prisma.salesLead.deleteMany().catch(() => {});
    await prisma.bussdevStaff.deleteMany().catch(() => {});
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    await app.close();
  });

  // ============================================================
  // SECTION 1: INPUT VALIDATION (DTO)
  // ============================================================
  describe('INPUT VALIDATION — DTO layer', () => {
    it('Rejects createTask with missing leadId', async () => {
      await request(app.getHttpServer())
        .post('/creative/task')
        .send({ brief: 'no lead' })
        .expect(400);
    });

    it('Rejects createTask with empty brief', async () => {
      await request(app.getHttpServer())
        .post('/creative/task')
        .send({ leadId: testLeadId, brief: '' })
        .expect(400);
    });

    it('Rejects apjReview with missing pin', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${testTaskId || '00000000-0000-4000-a000-000000000000'}/apj-review`)
        .send({ status: ApprovalStatus.APPROVED })
        .expect(400);
    });

    it('Rejects clientReview with invalid status', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${testTaskId || '00000000-0000-4000-a000-000000000000'}/client-review`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });
  });

  // ============================================================
  // SECTION 2: STATE MACHINE (Strict Routing)
  // ============================================================
  describe('STATE MACHINE — Strict Routing enforcement', () => {
    let taskId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/creative/task')
        .send({ leadId: testLeadId, brief: 'State machine test', taskType: 'PACKAGING_DESIGN' })
        .expect(201);
      taskId = res.body.id;
      testTaskId = taskId;
    });

    it('Blocks submit from INBOX (no artwork)', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(400);
    });

    it('Allows upload V1 from INBOX → IN_PROGRESS', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from('art'), 'artwork.pdf')
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.kanbanState).toBe(DesignState.IN_PROGRESS);
    });

    it('Allows submit from IN_PROGRESS → WAITING_APJ', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.kanbanState).toBe(DesignState.WAITING_APJ);
    });

    it('Blocks upload while in WAITING_APJ', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from('cheat'), 'cheat.pdf')
        .expect(400);
    });

    it('Blocks submit from WAITING_APJ (double-submit)', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(400);
    });

    it('APJ rejects → REVISION', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/apj-review`)
        .send({ status: ApprovalStatus.REJECTED, notes: 'Fix logo', pin: CORRECT_PIN })
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.kanbanState).toBe(DesignState.REVISION);
    });

    it('Allows upload from REVISION → stays IN_PROGRESS', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from('v2'), 'v2.pdf')
        .expect(200);
    });

    it('Blocks direct client-review without APJ gate', async () => {
      // Put it back to WAITING_APJ first
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(200);

      // APJ approves
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/apj-review`)
        .send({ status: ApprovalStatus.APPROVED, pin: CORRECT_PIN })
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.kanbanState).toBe(DesignState.WAITING_CLIENT);

      // Client approves → LOCKED
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/client-review`)
        .send({ status: ApprovalStatus.APPROVED })
        .expect(200);

      const locked = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(locked!.kanbanState).toBe(DesignState.LOCKED);
    });

    it('Blocks any mutation on LOCKED task', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(400);
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from('x'), 'x.pdf')
        .expect(400);
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/client-review`)
        .send({ status: ApprovalStatus.REJECTED })
        .expect(400);
    });
  });

  // ============================================================
  // SECTION 3: BUSINESS PROCESS (Golden Path)
  // ============================================================
  describe('BUSINESS PROCESS — Golden Path with revisions', () => {
    let taskId: string;

    it('Creates task with taskType and slaDeadline', async () => {
      const res = await request(app.getHttpServer())
        .post('/creative/task')
        .send({
          leadId: testLeadId,
          brief: 'Golden path test',
          taskType: 'LOGO_DESIGN',
        })
        .expect(201);

      taskId = res.body.id;
      expect(res.body.taskType).toBe('LOGO_DESIGN');
      expect(res.body.slaDeadline).toBeDefined();
      expect(res.body.kanbanState).toBe(DesignState.INBOX);
    });

    it('Upload V1 → revisionCount 0', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .field('printSpecs', JSON.stringify({ finish: 'Glossy', paper: 'Art Carton' }))
        .attach('artwork', Buffer.from('v1'), 'artwork.pdf')
        .attach('mockup', Buffer.from('m1'), 'mockup.jpg')
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.revisionCount).toBe(0);

      const version = await prisma.designVersion.findFirst({
        where: { taskId, versionNumber: 1 },
      });
      expect(version).toBeDefined();
      expect(version!.printSpecs).toBeDefined();
    });

    it('Submit → WAITING_APJ', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(200);
    });

    it('APJ rejects with notes → REVISION, feedback created', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/apj-review`)
        .send({ status: ApprovalStatus.REJECTED, notes: 'Wrong font size', pin: CORRECT_PIN })
        .expect(200);

      const feedback = await prisma.designFeedback.findFirst({
        where: { taskId, approvalStatus: ApprovalStatus.REJECTED },
      });
      expect(feedback).toBeDefined();
      expect(feedback!.content).toBe('Wrong font size');
      expect(feedback!.signatureHash).toBeDefined();
    });

    it('Upload V2 → revisionCount 1', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from('v2'), 'v2.pdf')
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.revisionCount).toBe(1);
    });

    it('APJ approves → WAITING_CLIENT', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/apj-review`)
        .send({ status: ApprovalStatus.APPROVED, pin: CORRECT_PIN })
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.kanbanState).toBe(DesignState.WAITING_CLIENT);
    });

    it('Client rejects → REVISION with feedback', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/client-review`)
        .send({ status: ApprovalStatus.REJECTED, notes: 'Change background color' })
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.kanbanState).toBe(DesignState.REVISION);
    });

    it('Final approval → LOCKED + isFinal + PO auto-created', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from('v3'), 'v3.pdf')
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/apj-review`)
        .send({ status: ApprovalStatus.APPROVED, pin: CORRECT_PIN })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/client-review`)
        .send({ status: ApprovalStatus.APPROVED })
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.kanbanState).toBe(DesignState.LOCKED);
      expect(task!.isFinal).toBe(true);
      expect(task!.finalArtworkUrl).toBeDefined();
      expect(task!.finalMockupUrl).toBeDefined();

      const po = await prisma.purchaseOrder.findFirst({
        where: { notes: { contains: taskId } },
      });
      expect(po).toBeDefined();
      expect(po!.poNumber).toContain('PO-DESIGN');
    });
  });

  // ============================================================
  // SECTION 4: REVISION CAP & LOCK/UNLOCK
  // ============================================================
  describe('REVISION CAP & UNLOCK — Lock/Unlock with PIN', () => {
    let taskId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/creative/task')
        .send({ leadId: testLeadId, brief: 'Revision cap test' })
        .expect(201);
      taskId = res.body.id;

      // Upload V1 (initial, not a revision)
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from('v1'), 'v1.pdf')
        .expect(200);
    });

    async function cycleRevision(label: string) {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/apj-review`)
        .send({ status: ApprovalStatus.REJECTED, pin: CORRECT_PIN })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from(label), `${label}.pdf`)
        .expect(200);
    }

    it('Revisions 1-3 cycle normally', async () => {
      // V2 is revision 1
      await cycleRevision('v2');
      let task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.revisionCount).toBe(1);
      expect(task!.isLocked).toBe(false);

      // V3 is revision 2
      await cycleRevision('v3');
      task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.revisionCount).toBe(2);
      expect(task!.isLocked).toBe(false);

      // V4 is revision 3 → LOCKED
      await cycleRevision('v4');
      task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.revisionCount).toBe(3);
      expect(task!.isLocked).toBe(true);
    });

    it('Blocks upload at revision limit', async () => {
      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.isLocked).toBe(true);

      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from('blocked'), 'blocked.pdf')
        .expect(400);
    });

    it('Blocks unlock without PIN for WAIVE action', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/unlock`)
        .send({ action: 'WAIVE' })
        .expect(400);
    });

    it('Blocks unlock with wrong PIN', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/unlock`)
        .send({ action: 'WAIVE', managerPin: '000000' })
        .expect(400);
    });

    it('Allows unlock with correct PIN', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/unlock`)
        .send({ action: 'WAIVE', managerPin: '654321' })
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.isLocked).toBe(false);
    });

    it('Allows unlock with CHARGE (no PIN needed)', async () => {
      // Lock again: submit then reject (CAP locks the task since revisionCount = 3)
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/apj-review`)
        .send({ status: ApprovalStatus.REJECTED, pin: CORRECT_PIN })
        .expect(200);

      // Task should now be locked — upload is blocked by CAP
      const locked = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(locked!.isLocked).toBe(true);
      expect(locked!.revisionCount).toBe(3);

      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/unlock`)
        .send({ action: 'CHARGE' })
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.isLocked).toBe(false);
    });
  });

  // ============================================================
  // SECTION 5: COMMUNICATION PROTOCOL (Events & Interlocks)
  // ============================================================
  describe('COMMUNICATION PROTOCOL — Events & Interlocks', () => {
    let taskId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/creative/task')
        .send({ leadId: testLeadId, brief: 'Interlock test' })
        .expect(201);
      taskId = res.body.id;
    });

    it('Client approval auto-creates PurchaseOrder', async () => {
      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/version`)
        .attach('artwork', Buffer.from('final-art'), 'final.pdf')
        .attach('mockup', Buffer.from('final-mock'), 'mockup.jpg')
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/submit`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/apj-review`)
        .send({ status: ApprovalStatus.APPROVED, pin: CORRECT_PIN })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/creative/task/${taskId}/client-review`)
        .send({ status: ApprovalStatus.APPROVED })
        .expect(200);

      const task = await prisma.designTask.findUnique({ where: { id: taskId } });
      expect(task!.kanbanState).toBe(DesignState.LOCKED);

      const po = await prisma.purchaseOrder.findFirst({
        where: { notes: { contains: taskId } },
      });
      expect(po).toBeDefined();
      expect(po!.notes).toContain(taskId);
      expect(po!.notes).toContain('/uploads/creative_assets/');
    });

    it('Immutable version history preserved', async () => {
      const versions = await prisma.designVersion.findMany({
        where: { taskId },
        orderBy: { versionNumber: 'asc' },
      });
      expect(versions.length).toBeGreaterThanOrEqual(1);
      versions.forEach((v) => {
        expect(v.artworkUrl).toBeDefined();
        expect(v.versionNumber).toBeGreaterThan(0);
      });
    });

    it('Feedback audit trail has signatureHash', async () => {
      const feedbacks = await prisma.designFeedback.findMany({
        where: { taskId },
      });
      expect(feedbacks.length).toBeGreaterThanOrEqual(1);
      feedbacks.forEach((f) => {
        expect(f.signatureHash).toBeDefined();
        expect(f.fromDivision).toBeDefined();
      });
    });
  });

  // ============================================================
  // SECTION 6: OUTPUT FIDELITY (API Response Contract)
  // ============================================================
  describe('OUTPUT FIDELITY — API response contract', () => {
    it('board endpoint returns paginated data', async () => {
      const res = await request(app.getHttpServer())
        .get('/creative/board')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('board endpoint accepts page/limit params', async () => {
      const res = await request(app.getHttpServer())
        .get('/creative/board?page=1&limit=5')
        .expect(200);

      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });

    it('tasks endpoint returns paginated data', async () => {
      const res = await request(app.getHttpServer())
        .get('/creative/tasks')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    });

    it('available-sales-orders returns array', async () => {
      const res = await request(app.getHttpServer())
        .get('/creative/available-sales-orders')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
