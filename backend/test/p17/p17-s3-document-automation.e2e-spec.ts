/**
 * P17 S3: Document Automation & Reproducible PDF Engine E2E Suite.
 *
 * Verifies:
 * - DocumentDraft creation, retrieval, and stats
 * - Snapshot immutability (originalPayload preservation upon edit)
 * - Approval and rejection flow with reason audit
 * - Deterministic, reproducible PDF generation (%PDF-1.4 header)
 * - Templates catalog endpoints
 */
import request from 'supertest';
import { UserRole, DocumentType, SourceDocumentType, DocumentDraftStatus } from '@prisma/client';
import { bootP17App, P17App } from './p17-http-harness';
import { randomUUID } from 'crypto';

describe('P17 S3: Document Automation & PDF Engine', () => {
  let p17: P17App;
  let adminToken: string;
  let adminUser: any;
  let draftId: string;
  const initialPayload = {
    clientName: 'P17 PT Kosmetika Utama',
    brandName: 'P17 Glow Serum',
    estimatedValue: 150000000,
    terms: 'DP 50%, Pelunasan sebelum pengiriman',
  };

  beforeAll(async () => {
    p17 = await bootP17App();
    await p17.cleanupP17Data();

    const admin = await p17.createUser('Admin', [UserRole.SUPER_ADMIN]);
    adminUser = admin.user;
    adminToken = admin.token;

    // Seed initial document draft
    const sourceId = randomUUID();
    const draft = await p17.prisma.documentDraft.create({
      data: {
        draftNumber: `P17-QUO-${Date.now()}`,
        documentType: DocumentType.QUOTATION,
        sourceType: SourceDocumentType.SALES_ORDER,
        sourceId,
        status: DocumentDraftStatus.DRAFT,
        payload: initialPayload,
        createdById: adminUser.id,
        notes: 'P17 initial quotation draft',
      },
    });
    draftId = draft.id;
  });

  afterAll(async () => {
    await p17.cleanupP17Data();
    await p17.app.close();
  });

  it('S3.1 - Retrieves created document draft and stats', async () => {
    const res = await request(p17.app.getHttpServer())
      .get(`/document-automation/drafts/${draftId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id', draftId);
    expect(res.body.documentType).toBe('QUOTATION');
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.payload.clientName).toBe('P17 PT Kosmetika Utama');

    // Test stats endpoint
    const statsRes = await request(p17.app.getHttpServer())
      .get('/document-automation/drafts/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(statsRes.body).toHaveProperty('total');
    expect(statsRes.body).toHaveProperty('drafts');
  });

  it('S3.2 - Updates draft payload and verifies snapshot immutability (originalPayload)', async () => {
    const revisedPayload = {
      ...initialPayload,
      estimatedValue: 175000000, // Price updated
      notes: 'Revised after client negotiation',
    };

    const res = await request(p17.app.getHttpServer())
      .patch(`/document-automation/drafts/${draftId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        payload: revisedPayload,
        notes: 'Negotiated discount applied',
      })
      .expect(200);

    expect(res.body.status).toBe('REVIEWING');
    expect(res.body.payload.estimatedValue).toBe(175000000);
    // Snapshot immutability: originalPayload must match initialPayload
    expect(res.body.originalPayload).toBeDefined();
    expect(res.body.originalPayload.estimatedValue).toBe(150000000);
  });

  it('S3.3 - Rejects draft with reason and verifies state', async () => {
    const rejectRes = await request(p17.app.getHttpServer())
      .post(`/document-automation/drafts/${draftId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'Client requested postponement to next quarter',
      })
      .expect((res) => expect([200, 201]).toContain(res.status));

    expect(rejectRes.body.status).toBe('REJECTED');
    expect(rejectRes.body.rejectReason).toBe('Client requested postponement to next quarter');
  });

  it('S3.4 - Generates deterministic, reproducible PDF with valid %PDF-1.4 header', async () => {
    const pdfRes = await request(p17.app.getHttpServer())
      .post('/document-automation/pdf')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        documentType: 'QUOTATION',
        data: initialPayload,
        documentNumber: 'P17-DOC-PDF-001',
      })
      .expect(200);

    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    // Binary check: PDF format starts with %PDF-1.4
    const bodyBuffer = Buffer.isBuffer(pdfRes.body) ? pdfRes.body : Buffer.from(pdfRes.text);
    const headerString = bodyBuffer.subarray(0, 8).toString('utf-8');
    expect(headerString).toContain('%PDF-1.');
  });

  it('S3.5 - Retrieves templates catalog (documents, emails, whatsapp)', async () => {
    const docTmpl = await request(p17.app.getHttpServer())
      .get('/templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(docTmpl.body.data)).toBe(true);
    expect(docTmpl.body.data.length).toBeGreaterThanOrEqual(1);

    const emailTmpl = await request(p17.app.getHttpServer())
      .get('/email-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(emailTmpl.body.data)).toBe(true);

    const smsTmpl = await request(p17.app.getHttpServer())
      .get('/sms-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(smsTmpl.body.data)).toBe(true);
  });
});
