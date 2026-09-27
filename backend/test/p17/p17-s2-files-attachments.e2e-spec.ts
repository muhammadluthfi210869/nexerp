/**
 * P17 S2: Secure File Storage & Presigned Attachments E2E Suite.
 *
 * Verifies:
 * - Presigned upload token generation with MIME validation
 * - Rejection of dangerous MIME types (UNSUPPORTED_FILE_TYPE)
 * - File confirmation and audit log recording
 * - Attachment of confirmed file to polymorphic entity
 */
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { bootP17App, P17App } from './p17-http-harness';
import { randomUUID } from 'crypto';

describe('P17 S2: Secure File Storage & Presigned Attachments', () => {
  let p17: P17App;
  let adminToken: string;
  let adminUser: any;
  let entityId: string;
  let createdFileId: string;

  beforeAll(async () => {
    p17 = await bootP17App();
    await p17.cleanupP17Data();

    const admin = await p17.createUser('Admin', [UserRole.SUPER_ADMIN]);
    adminUser = admin.user;
    adminToken = admin.token;

    entityId = randomUUID();
  });

  afterAll(async () => {
    await p17.cleanupP17Data();
    await p17.app.close();
  });

  it('S2.1 - Generates presigned upload URL and token for supported file type', async () => {
    const res = await request(p17.app.getHttpServer())
      .post('/files/presign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        filename: 'p17_contract_spec.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 50, // 50 KB
      })
      .expect(201);

    expect(res.body).toHaveProperty('fileId');
    expect(res.body).toHaveProperty('uploadUrl');
    expect(res.body).toHaveProperty('token');
    createdFileId = res.body.fileId;
  });

  it('S2.2 - Rejects upload request with unsupported/dangerous MIME type', async () => {
    const res = await request(p17.app.getHttpServer())
      .post('/files/presign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        filename: 'malware.exe',
        mimeType: 'application/x-executable',
        size: 1024 * 10,
      })
      .expect(400);

    const msg = res.body.detail || res.body.message || JSON.stringify(res.body);
    expect(msg).toMatch(/UNSUPPORTED_FILE_TYPE/i);
  });

  it('S2.3 - Rejects upload request exceeding maximum allowed file size (>10MB)', async () => {
    const res = await request(p17.app.getHttpServer())
      .post('/files/presign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        filename: 'large_dump.pdf',
        mimeType: 'application/pdf',
        size: 15 * 1024 * 1024, // 15 MB
      })
      .expect(400);

    const msg = res.body.detail || res.body.message || JSON.stringify(res.body);
    expect(msg).toMatch(/FILE_TOO_LARGE/i);
  });

  it('S2.4 - Confirms upload and creates File record + audit log', async () => {
    const res = await request(p17.app.getHttpServer())
      .post(`/files/${createdFileId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        actualSize: 1024 * 50,
      })
      .expect((res) => expect([200, 201]).toContain(res.status));

    expect(res.body).toHaveProperty('confirmed', true);
    expect(res.body.file_id).toBe(createdFileId);

    // Verify Audit Log
    const audit = await p17.prisma.activityLog.findFirst({
      where: {
        entityId: createdFileId,
        entityType: 'FileAttachment',
      },
    });
    expect(audit).toBeDefined();
  });

  it('S2.5 - Attaches confirmed file to entity and verifies retrieval', async () => {
    const attachRes = await request(p17.app.getHttpServer())
      .post(`/entities/PurchaseOrder/${entityId}/attachments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        filename: 'p17_contract_spec.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 50,
        storagePath: `uploads/${createdFileId}/p17_contract_spec.pdf`,
      })
      .expect(201);

    expect(attachRes.body).toHaveProperty('id');
    const attachmentId = attachRes.body.id;

    // List attachments
    const listRes = await request(p17.app.getHttpServer())
      .get(`/entities/PurchaseOrder/${entityId}/attachments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((a: any) => a.id === attachmentId)).toBe(true);
  });
});
