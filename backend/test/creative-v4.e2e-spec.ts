import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { DesignState, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Creative & Packaging Design V4 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;
  let testTaskId: string;
  let testLeadId: string;
  let testSupplierId: string;
  let testStaffId: string;
  const CORRECT_PIN = '123456';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup Test User with encrypted PIN
    const hashedPin = await bcrypt.hash(CORRECT_PIN, 10);
    const user = await prisma.user.create({
      data: {
        email: `tester-${Date.now()}@dreamlab.id`,
        fullName: 'Test APJ',
        passwordHash: 'hashed_pw',
        approvalPin: hashedPin,
        roles: ['APJ'],
        status: 'ACTIVE',
      },
    });
    testUserId = user.id;

    // Setup Test Staff (SalesLead picId references BussdevStaff)
    const staff = await prisma.bussdevStaff.create({
      data: {
        userId: testUserId,
        name: 'Test Staff',
      },
    });
    testStaffId = staff.id;

    // Setup Test Supplier
    const supplier = await prisma.supplier.create({
      data: { name: 'Test Printing Vendor' },
    });
    testSupplierId = supplier.id;

    // Setup Test Lead
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
    // Cleanup with safe order
    await prisma.purchaseOrderItem.deleteMany().catch(() => {});
    await prisma.purchaseOrder.deleteMany().catch(() => {});
    await prisma.designFeedback.deleteMany().catch(() => {});
    await prisma.designVersion.deleteMany().catch(() => {});
    await prisma.designTask.deleteMany().catch(() => {});
    await prisma.salesLead.deleteMany().catch(() => {});
    await prisma.bussdevStaff.deleteMany().catch(() => {});
    await prisma.supplier.deleteMany().catch(() => {});
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    await app.close();
  });

  it('Step 1: Create new Design Task (Inbox)', async () => {
    const res = await request(app.getHttpServer())
      .post('/creative/task')
      .send({
        leadId: testLeadId,
        brief: 'Test packaging design for Serum V2',
      })
      .expect(201);

    testTaskId = res.body.id;
    expect(testTaskId).toBeDefined();
    expect(res.body.kanbanState).toBe(DesignState.INBOX);
  });

  it('Step 2: Upload Version 1 (Should move to IN_PROGRESS)', async () => {
    // Mocking file upload since supertest handles multipart
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/version`)
      .field('uploadedBy', testUserId)
      .attach('artwork', Buffer.from('dummy artwork'), 'artwork.pdf')
      .attach('mockup', Buffer.from('dummy mockup'), 'mockup.jpg')
      .expect(200);

    const task = await prisma.designTask.findUnique({
      where: { id: testTaskId },
    });
    expect(task!.kanbanState).toBe(DesignState.IN_PROGRESS);
    expect(task!.revisionCount).toBe(0); // V1 is initial, not revision
  });

  it('Step 3: Submit to APJ (Should move to WAITING_APJ)', async () => {
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/submit`)
      .expect(200);

    const task = await prisma.designTask.findUnique({
      where: { id: testTaskId },
    });
    expect(task!.kanbanState).toBe(DesignState.WAITING_APJ);
  });

  it('Step 4: APJ Rejection (Revision 1)', async () => {
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/apj-review`)
      .send({
        status: ApprovalStatus.REJECTED,
        notes: 'Wrong logo placement',
        authorId: testUserId,
        pin: CORRECT_PIN,
      })
      .expect(200);

    const task = await prisma.designTask.findUnique({
      where: { id: testTaskId },
    });
    expect(task!.kanbanState).toBe(DesignState.REVISION);
    expect(task!.revisionCount).toBe(0); // Revision count updates on NEXT version upload
  });

  it('Step 5: Hit Revision Limit (Revisions 2 & 3)', async () => {
    // Upload V2 (Revision 1 already counted)
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/version`)
      .field('uploadedBy', testUserId)
      .attach('artwork', Buffer.from('v2'), 'v2.pdf')
      .expect(200);

    // Reject V2 -> Revision 2
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/apj-review`)
      .send({
        status: ApprovalStatus.REJECTED,
        authorId: testUserId,
        pin: CORRECT_PIN,
      })
      .expect(200);

    // Upload V3 -> Revision 2 counted
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/version`)
      .field('uploadedBy', testUserId)
      .attach('artwork', Buffer.from('v3'), 'v3.pdf')
      .expect(200);

    // Reject V3 -> Revision 2 (Still safe)
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/apj-review`)
      .send({
        status: ApprovalStatus.REJECTED,
        authorId: testUserId,
        pin: CORRECT_PIN,
      })
      .expect(200);

    // Upload V4 -> Revision 3 counted
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/version`)
      .field('uploadedBy', testUserId)
      .attach('artwork', Buffer.from('v4'), 'v4.pdf')
      .expect(200);

    // Reject V4 -> Revision 3 (LIMIT HIT)
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/apj-review`)
      .send({
        status: ApprovalStatus.REJECTED,
        authorId: testUserId,
        pin: CORRECT_PIN,
      })
      .expect(200);

    const task = await prisma.designTask.findUnique({
      where: { id: testTaskId },
    });
    expect(task!.revisionCount).toBe(3);
    expect(task!.isLocked).toBe(true);
  });

  it('Step 6: Block Upload on Locked Task', async () => {
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/version`)
      .field('uploadedBy', testUserId)
      .attach('artwork', Buffer.from('v5'), 'v5.pdf')
      .expect(400); // Bad Request: Task is locked
  });

  it('Step 7: Final Approval & SCM Interlock', async () => {
    // Unlock first (Manual override simulation)
    await prisma.designTask.update({
      where: { id: testTaskId },
      data: { isLocked: false, kanbanState: DesignState.IN_PROGRESS },
    });

    // Upload Final
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/version`)
      .field('uploadedBy', testUserId)
      .attach('artwork', Buffer.from('final'), 'final.pdf')
      .expect(200);

    // 1. APJ Approve -> WAITING_CLIENT
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/apj-review`)
      .send({
        status: ApprovalStatus.APPROVED,
        authorId: testUserId,
        pin: CORRECT_PIN,
      })
      .expect(200);

    // 2. Client Approve -> LOCKED (Trigger Interlock)
    await request(app.getHttpServer())
      .patch(`/creative/task/${testTaskId}/client-review`)
      .send({ status: ApprovalStatus.APPROVED })
      .expect(200);

    const task = await prisma.designTask.findUnique({
      where: { id: testTaskId },
    });
    expect(task!.kanbanState).toBe(DesignState.LOCKED);

    // Check SCM Interlock (PO Creation)
    const po = await prisma.purchaseOrder.findFirst({
      where: { notes: { contains: testTaskId } },
    });
    expect(po).toBeDefined();
  });
});
