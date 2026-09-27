/**
 * P17 S1: Polymorphic Communication Protocol & Mentions E2E Suite.
 *
 * Verifies:
 * - Atomic Note creation + @username mention resolution
 * - In-app notification creation for mentioned user
 * - Outbox event `entity.mention.created` emission under parent ACL
 * - Validation error on non-existent @username
 * - Polymorphic comment replies and tagging
 */
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { bootP17App, P17App } from './p17-http-harness';
import { randomUUID } from 'crypto';

describe('P17 S1: Polymorphic Communication & Mentions (BUS-RULE-091, BUS-RULE-094, BUS-RULE-095)', () => {
  let p17: P17App;
  let adminToken: string;
  let adminUser: any;
  let targetUser: any;
  let entityId: string;
  let createdNoteId: string;

  beforeAll(async () => {
    p17 = await bootP17App();
    await p17.cleanupP17Data();

    const admin = await p17.createUser('Admin', [UserRole.SUPER_ADMIN]);
    adminUser = admin.user;
    adminToken = admin.token;

    const target = await p17.createUser('TargetStaff', [UserRole.ADMIN]);
    targetUser = target.user;

    entityId = randomUUID();
  });

  afterAll(async () => {
    await p17.cleanupP17Data();
    await p17.app.close();
  });

  it('S1.1 - Creates a note with @username mention and creates atomic mention + notification + outbox event', async () => {
    // Extract target username from email or full name
    const targetUsername = targetUser.email.split('@')[0];

    const res = await request(p17.app.getHttpServer())
      .post(`/entities/SalesOrder/${entityId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        body: `Tolong verifikasi termin pembayaran order ini @${targetUsername}`,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.body).toContain(targetUsername);
    createdNoteId = res.body.id;

    // Verify mention record in DB
    const mentions = await p17.prisma.communicationMention.findMany({
      where: { replyId: createdNoteId },
    });
    expect(mentions.length).toBe(1);
    expect(mentions[0].mentionedUserId).toBe(targetUser.id);

    // Verify notification created for targetUser
    const notif = await p17.prisma.notification.findFirst({
      where: {
        userId: targetUser.id,
        type: 'MENTION',
      },
    });
    expect(notif).toBeDefined();
    expect(notif?.title).toContain('Mention');

    // Verify outbox event emitted
    const outbox = await p17.prisma.outboxEvent.findFirst({
      where: {
        eventType: 'entity.mention.created',
      },
    });
    expect(outbox).toBeDefined();
  });

  it('S1.2 - Lists notes for the polymorphic entity', async () => {
    const res = await request(p17.app.getHttpServer())
      .get(`/entities/SalesOrder/${entityId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].id).toBe(createdNoteId);
  });

  it('S1.3 - Returns 400 MENTION_USER_NOT_FOUND when mentioning non-existent username', async () => {
    const res = await request(p17.app.getHttpServer())
      .post(`/entities/SalesOrder/${entityId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        body: 'Halo @unknown_ghost_user_999999 tolong cek ya',
      })
      .expect(400);

    const msg = res.body.detail || res.body.message || JSON.stringify(res.body);
    expect(msg).toMatch(/MENTION_USER_NOT_FOUND/i);
  });

  it('S1.4 - Updates and deletes a note', async () => {
    const updateRes = await request(p17.app.getHttpServer())
      .put(`/entities/SalesOrder/${entityId}/notes/${createdNoteId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        body: 'Revisi: Termin pembayaran sudah dikonfirmasi 50:50',
      })
      .expect(200);

    expect(updateRes.body.body).toBe('Revisi: Termin pembayaran sudah dikonfirmasi 50:50');

    // Delete note
    await request(p17.app.getHttpServer())
      .delete(`/entities/SalesOrder/${entityId}/notes/${createdNoteId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect((r) => expect([200, 204]).toContain(r.status));

    // Verify note is deleted
    const checkRes = await request(p17.app.getHttpServer())
      .get(`/entities/SalesOrder/${entityId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(checkRes.body.find((n: any) => n.id === createdNoteId)).toBeUndefined();
  });

  it('S1.5 - Adds a comment reply and lists comments', async () => {
    const commentRes = await request(p17.app.getHttpServer())
      .post(`/entities/SalesOrder/${entityId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        body: 'Komentar: Semua dokumen persyaratan telah dilengkapi',
      })
      .expect(201);

    expect(commentRes.body).toHaveProperty('id');
    const commentId = commentRes.body.id;

    const listRes = await request(p17.app.getHttpServer())
      .get(`/entities/SalesOrder/${entityId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((c: any) => c.id === commentId)).toBe(true);
  });

  it('S1.6 - Tags polymorphic entity and retrieves tags', async () => {
    const tagRes = await request(p17.app.getHttpServer())
      .post(`/entities/SalesOrder/${entityId}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tag: 'URGENT_APPROVAL',
      })
      .expect(201);

    expect(tagRes.body).toHaveProperty('id');
    expect(tagRes.body.tag).toBe('URGENT_APPROVAL');

    const listTags = await request(p17.app.getHttpServer())
      .get(`/entities/SalesOrder/${entityId}/tags`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(listTags.body)).toBe(true);
    expect(listTags.body.some((t: any) => t.tag === 'URGENT_APPROVAL')).toBe(true);
  });
});
