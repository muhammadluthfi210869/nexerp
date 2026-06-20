import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';
import {
  DocumentType,
  DocumentDraftStatus,
  SourceDocumentType,
  WorkflowStatus,
} from '@prisma/client';

/**
 * E2E Tests — Document Automation Full API Flow
 *
 * Tests all API endpoints for document automation.
 * Requires a running PostgreSQL database.
 * If no DB is available, tests are skipped.
 */

describe('Document Automation — E2E API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hasDb = false;

  // Test data IDs
  let leadId: string;
  let soId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    try {
      await prisma.$connect();
      hasDb = true;
    } catch {
      console.warn('⚠ No database available — skipping E2E tests');
      return;
    }

    await app.init();

    // Seed test data
    await seedTestData();
  });

  afterAll(async () => {
    if (hasDb) {
      await cleanupTestData();
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  const runTest = (name: string, fn: () => Promise<void>) => {
    it(name, async () => {
      if (!hasDb) return;
      await fn();
    });
  };

  async function seedTestData() {
    // Create a test lead
    const lead = await prisma.salesLead.create({
      data: {
        clientName: 'E2E Document Test Client',
        brandName: 'E2E Brand',
        contactInfo: 'e2e@test.com',
        source: 'DIRECT',
        productInterest: 'Test Serum',
        estimatedValue: 100000000,
        status: 'NEW_LEAD',
        picId: (await prisma.bussdevStaff.findFirst())?.id || '',
      },
    });
    leadId = lead.id;
  }

  async function cleanupTestData() {
    // Clean up test drafts
    await prisma.documentDraft.deleteMany({
      where: { draftNumber: { startsWith: 'E2E-' } },
    });
    // Clean up test lead
    await prisma.salesLead.deleteMany({
      where: { clientName: 'E2E Document Test Client' },
    });
  }

  // ──────────────────────────────────────────────
  // D1-D7: Manual Draft Generation
  // ──────────────────────────────────────────────

  runTest('D1: POST /document-automation/generate/quotation/:leadId', async () => {
    const res = await request(app.getHttpServer())
      .post(`/document-automation/generate/quotation/${leadId}`)
      .expect(201);

    expect(res.body).toBeDefined();
    expect(res.body.documentType).toBe(DocumentType.QUOTATION);
    expect(res.body.draftNumber).toBeDefined();
  });

  runTest('D2: POST /document-automation/generate/dp-invoice/:salesOrderId', async () => {
    // First create a sales order
    const soRes = await request(app.getHttpServer())
      .post('/commercial/sales-orders')
      .send({
        leadId,
        sampleId: (await prisma.sampleRequest.findFirst({ where: { leadId } }))?.id || '',
        totalAmount: 100000000,
        brandName: 'E2E Brand',
        items: [{
          productName: 'Test Serum',
          quantity: 1000,
          unitPrice: 100000,
        }],
      });

    if (soRes.status === 201) {
      soId = soRes.body.id;
      const res = await request(app.getHttpServer())
        .post(`/document-automation/generate/dp-invoice/${soId}`)
        .expect(201);

      expect(res.body.documentType).toBe(DocumentType.INVOICE_DP);
    }
  });

  runTest('D3: GET /document-automation/drafts — list all drafts', async () => {
    const res = await request(app.getHttpServer())
      .get('/document-automation/drafts')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  runTest('D4: GET /document-automation/drafts?documentType=INVOICE_DP — filter by type', async () => {
    const res = await request(app.getHttpServer())
      .get('/document-automation/drafts?documentType=INVOICE_DP')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((draft: any) => {
      expect(draft.documentType).toBe('INVOICE_DP');
    });
  });

  runTest('D5: GET /document-automation/drafts/stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/document-automation/drafts/stats')
      .expect(200);

    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('drafts');
    expect(res.body).toHaveProperty('approved');
    expect(typeof res.body.total).toBe('number');
  });

  // ──────────────────────────────────────────────
  // D6-D8: Draft CRUD Operations
  // ──────────────────────────────────────────────

  runTest('D6: GET /document-automation/drafts/:id — get draft detail', async () => {
    // First create a draft
    const createRes = await request(app.getHttpServer())
      .post(`/document-automation/generate/quotation/${leadId}`)
      .expect(201);

    if (createRes.body.id) {
      const res = await request(app.getHttpServer())
        .get(`/document-automation/drafts/${createRes.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(createRes.body.id);
      expect(res.body.payload).toBeDefined();
    }
  });

  runTest('D7: PATCH /document-automation/drafts/:id — update draft', async () => {
    const createRes = await request(app.getHttpServer())
      .post(`/document-automation/generate/quotation/${leadId}`)
      .expect(201);

    if (createRes.body.id) {
      const res = await request(app.getHttpServer())
        .patch(`/document-automation/drafts/${createRes.body.id}`)
        .send({ notes: 'Updated notes' })
        .expect(200);

      expect(res.body.notes).toBe('Updated notes');
    }
  });

  runTest('D8: POST /document-automation/drafts/:id/approve — approve draft', async () => {
    const createRes = await request(app.getHttpServer())
      .post(`/document-automation/generate/quotation/${leadId}`)
      .expect(201);

    if (createRes.body.id) {
      const res = await request(app.getHttpServer())
        .post(`/document-automation/drafts/${createRes.body.id}/approve`)
        .send({ notes: 'Approved for testing' })
        .expect(201);

      expect(res.body.status).toBe(DocumentDraftStatus.APPROVED);
    }
  });

  // ──────────────────────────────────────────────
  // D9-D10: Rejection & Error Handling
  // ──────────────────────────────────────────────

  runTest('D9: POST /document-automation/drafts/:id/reject — reject draft', async () => {
    const createRes = await request(app.getHttpServer())
      .post(`/document-automation/generate/quotation/${leadId}`)
      .expect(201);

    if (createRes.body.id) {
      const res = await request(app.getHttpServer())
        .post(`/document-automation/drafts/${createRes.body.id}/reject`)
        .send({ reason: 'Incorrect pricing' })
        .expect(201);

      expect(res.body.status).toBe(DocumentDraftStatus.REJECTED);
    }
  });

  runTest('D10: GET /document-automation/drafts/invalid-id — 404 error', async () => {
    await request(app.getHttpServer())
      .get('/document-automation/drafts/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  // ──────────────────────────────────────────────
  // D11-D12: PDF Generation
  // ──────────────────────────────────────────────

  runTest('D11: POST /document-automation/pdf — generate PDF directly', async () => {
    const res = await request(app.getHttpServer())
      .post('/document-automation/pdf')
      .send({
        documentType: 'QUOTATION',
        documentNumber: 'E2E-QUO-001',
        data: {
          clientName: 'E2E Test Client',
          brandName: 'E2E Brand',
          items: [{ productName: 'Test', quantity: 1, unitPrice: 100000, subtotal: 100000 }],
        },
      })
      .expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body).toBeDefined();
  });

  runTest('D12: GET /document-automation/drafts/:id/pdf — download draft PDF', async () => {
    const createRes = await request(app.getHttpServer())
      .post(`/document-automation/generate/quotation/${leadId}`)
      .expect(201);

    if (createRes.body.id) {
      const res = await request(app.getHttpServer())
        .get(`/document-automation/drafts/${createRes.body.id}/pdf`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
    }
  });

  // ──────────────────────────────────────────────
  // D13-D14: Auto-Approve
  // ──────────────────────────────────────────────

  runTest('D13: POST /document-automation/process-auto-approvals', async () => {
    const res = await request(app.getHttpServer())
      .post('/document-automation/process-auto-approvals')
      .expect(200);

    expect(res.body).toHaveProperty('processed');
    expect(typeof res.body.processed).toBe('number');
  });

  // ──────────────────────────────────────────────
  // D15: Duplicate Prevention via API
  // ──────────────────────────────────────────────

  runTest('D15: generate same quotation twice → only 1 draft', async () => {
    await request(app.getHttpServer())
      .post(`/document-automation/generate/quotation/${leadId}`)
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/document-automation/generate/quotation/${leadId}`)
      .expect(201);

    // Should return existing draft, not create new one
    const drafts = await prisma.documentDraft.findMany({
      where: {
        sourceId: leadId,
        documentType: DocumentType.QUOTATION,
      },
    });
    expect(drafts.length).toBe(1);
  });
});
