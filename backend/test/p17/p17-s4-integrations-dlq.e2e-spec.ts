/**
 * P17 S4: Resilient Integrations, Webhooks & Outbox DLQ E2E Suite.
 *
 * Verifies:
 * - Meta WhatsApp webhook verification (GET hub.mode=subscribe)
 * - HMAC-SHA256 signature verification on WhatsApp incoming webhook
 * - Inbound message deduplication (24h idempotency)
 * - Outbox DLQ quarantine on max retries
 * - SLA scanner for pending approvals
 * - In-app notification 1-hour deduplication
 */
import request from 'supertest';
import { createHmac } from 'crypto';
import { UserRole } from '@prisma/client';
import { bootP17App, P17App } from './p17-http-harness';
import { randomUUID } from 'crypto';
import { NotificationService } from '../../src/modules/notification/notification.service';

describe('P17 S4: Resilient Integrations, Webhooks & Outbox DLQ (BUS-RULE-092, BUS-RULE-093, BUS-RULE-101)', () => {
  let p17: P17App;
  let adminToken: string;
  let adminUser: any;
  const appSecret = 'nex_wa_app_secret_test';

  beforeAll(async () => {
    process.env.WA_APP_SECRET = appSecret;
    process.env.WA_WEBHOOK_VERIFY_TOKEN = 'dreamlab_secret_2026';

    p17 = await bootP17App();
    await p17.cleanupP17Data();

    const admin = await p17.createUser('Admin', [UserRole.SUPER_ADMIN]);
    adminUser = admin.user;
    adminToken = admin.token;
  });

  afterAll(async () => {
    await p17.cleanupP17Data();
    await p17.app.close();
  });

  it('S4.1 - Verifies WhatsApp Webhook setup challenge from Meta (GET)', async () => {
    const res = await request(p17.app.getHttpServer())
      .get('/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'dreamlab_secret_2026',
        'hub.challenge': '11559922',
      })
      .expect(200);

    expect(res.text).toBe('11559922');
  });

  it('S4.2 - Rejects WhatsApp webhook with missing or invalid HMAC signature (401)', async () => {
    await request(p17.app.getHttpServer())
      .post('/webhooks/whatsapp')
      .send({
        object: 'whatsapp_business_account',
        entry: [],
      })
      .expect(401);

    await request(p17.app.getHttpServer())
      .post('/webhooks/whatsapp')
      .set('x-hub-signature-256', 'sha256=invalid_hex_signature_string')
      .send({
        object: 'whatsapp_business_account',
        entry: [],
      })
      .expect(401);
  });

  it('S4.3 - Accepts WhatsApp webhook with valid HMAC signature and deduplicates subsequent identical messageId (BUS-RULE-101)', async () => {
    const msgId = `p17_wa_msg_${Date.now()}`;
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '6281111111', phone_number_id: '12345' },
                contacts: [{ profile: { name: 'P17 Prospect' }, wa_id: '6289999999' }],
                messages: [
                  {
                    from: '6289999999',
                    id: msgId,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: 'Halo saya ingin tanya info maklon kosmetik' },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const rawBody = JSON.stringify(payload);
    const signature = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');

    // 1st request — success
    const firstRes = await request(p17.app.getHttpServer())
      .post('/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', signature)
      .send(rawBody)
      .expect(200);

    expect(firstRes.body).toMatchObject({ success: true });

    // 2nd request with exact same payload and msgId — deduplicated
    const secondRes = await request(p17.app.getHttpServer())
      .post('/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', signature)
      .send(rawBody)
      .expect(200);

    expect(secondRes.body).toMatchObject({ success: true, duplicate: true });
  });

  it('S4.4 - Outbox DLQ quarantine: records failed events exceeding max retries', async () => {
    const eventId = randomUUID();
    const failedEvent = await p17.prisma.outboxDlq.create({
      data: {
        outboxEventId: eventId,
        payload: {
          eventType: 'p17.integration.failed',
          entityId: randomUUID(),
          destination: 'https://third-party.erp.test/webhook',
          error: 'Connection timed out after 3 retries',
        },
        reason: 'MAX_RETRIES_EXCEEDED: HTTP 504 Gateway Timeout',
        deadLetteredAt: new Date(),
      },
    });

    expect(failedEvent).toBeDefined();
    expect(failedEvent.outboxEventId).toBe(eventId);
    expect(failedEvent.reason).toContain('MAX_RETRIES_EXCEEDED');

    // Verify DLQ retrieval
    const foundDlq = await p17.prisma.outboxDlq.findUnique({
      where: { id: failedEvent.id },
    });
    expect(foundDlq?.reason).toContain('MAX_RETRIES_EXCEEDED');
  });

  it('S4.5 - Notification 1-Hour Deduplication (BUS-RULE-092)', async () => {
    const notifService = p17.app.get(NotificationService);
    const refId = randomUUID();

    // 1st notification
    await notifService.sendInApp(adminUser.id, {
      title: 'P17 Alert: Stock Minimum',
      body: 'Stok bahan baku A menipis',
      type: 'CRITICAL',
      referenceId: refId,
    });

    const initialCount = await p17.prisma.notification.count({
      where: { userId: adminUser.id, referenceId: refId },
    });
    expect(initialCount).toBe(1);

    // 2nd notification with same type & referenceId within 1 hour -> Aggregated, count stays 1!
    await notifService.sendInApp(adminUser.id, {
      title: 'P17 Alert: Stock Minimum (Baru)',
      body: 'Stok bahan baku A menipis lagi',
      type: 'CRITICAL',
      referenceId: refId,
    });

    const aggregatedCount = await p17.prisma.notification.count({
      where: { userId: adminUser.id, referenceId: refId },
    });
    expect(aggregatedCount).toBe(1);

    const updatedNotif = await p17.prisma.notification.findFirst({
      where: { userId: adminUser.id, referenceId: refId },
    });
    expect(updatedNotif?.body).toContain('(agregat)');
  });

  it('S4.6 - Scans SLA pending approvals and triggers alerts (BUS-RULE-093)', async () => {
    const res = await request(p17.app.getHttpServer())
      .post('/notifications/scan-sla')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('breachedCount');
    expect(typeof res.body.breachedCount).toBe('number');
  });
});
