import { Injectable, Logger } from '@nestjs/common';
import { LeadCaptureService } from '../lead-capture/lead-capture.service';

@Injectable()
export class WaWebhookService {
  private readonly logger = new Logger(WaWebhookService.name);

  constructor(private readonly leadCapture: LeadCaptureService) {}

  /**
   * Verify webhook — dipanggil Meta saat setup webhook
   */
  verifyToken(mode: string | null, token: string | null, challenge: string | null): string | null {
    const VERIFY_TOKEN = process.env.WA_WEBHOOK_VERIFY_TOKEN || 'dreamlab_secret_2026';
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      this.logger.log('✅ Webhook verified by Meta');
      return challenge;
    }
    this.logger.warn('⚠️ Webhook verification failed');
    return null;
  }

  /**
   * Handle incoming message dari WA Cloud API
   */
  async handleIncoming(body: any) {
    try {
      this.logger.log('📩 WA Webhook received');
      
      // Kalau bukan message entry, skip
      if (!body?.entry?.[0]?.changes?.[0]?.value) {
        return { status: 'ignored' };
      }

      const value = body.entry[0].changes[0].value;
      const messages = value.messages;
      const contacts = value.contacts;

      if (!messages || messages.length === 0) {
        return { status: 'no_message' };
      }

      for (const msg of messages) {
        if (msg.type === 'text') {
          const phone = msg.from;         // Nomor pengirim
          const text = msg.text.body;     // Isi pesan
          const msgId = msg.id;           // WhatsApp message id (anti-duplikat webhook)
          const profileName = contacts?.[0]?.profile?.name || 'Unknown';

          this.logger.log(`📨 WA from ${phone}: "${text.slice(0, 50)}"`);

          // Extract tracking code dari isi pesan
          // Format: [Kode: DLxxxx] atau [Kode: DLxxxxxx]
          const trackingMatch = text.match(/\[Kode:\s*(DL\w+)\]/);
          const trackingCode = trackingMatch ? trackingMatch[1] : null;

          if (trackingCode) {
            this.logger.log(`🔗 Tracking code found: ${trackingCode}`);
            await this.leadCapture.updateFromWhatsApp(trackingCode, {
              phone,
              waName: profileName,
              waMessage: text,
              msgId,
            });
          } else {
            // Tracking code gak ketemu — upsert orphan lead dengan dedup
            this.logger.warn(`⚠️ No tracking code in message from ${phone}`);
            try {
              await this.leadCapture.upsertOrphanLead(phone, profileName, text, msgId);
            } catch (err) {
              this.logger.error(`❌ Failed to process orphan lead for ${phone}:`, err);
            }
          }
        }

        // Handle interactive messages (button reply)
        if (msg.type === 'interactive' && msg.interactive?.button_reply) {
          const phone = msg.from;
          const text = msg.interactive.button_reply.title || '';
          const msgId = msg.id;
          try {
            await this.leadCapture.upsertOrphanLead(
              phone,
              contacts?.[0]?.profile?.name || 'Unknown',
              text,
              msgId,
            );
          } catch (err) {
            this.logger.error(`❌ Failed to process interactive message from ${phone}:`, err);
          }
        }
      }

      return { status: 'ok' };
    } catch (err: any) {
      this.logger.error('❌ Webhook error:', err?.message || err);
      return { status: 'error', message: err?.message || 'unknown' };
    }
  }

  /**
   * Handle webhook dari GATEWAY pihak ketiga (Wablas, Mesolitica, Fonnte, dll).
   * Format payload fleksibel (dikenali dari beberapa nama field umum) supaya
   * bisa dipakai lintas gateway tanpa harus tahu format persis masing-masing.
   */
  async handleGateway(body: any) {
    try {
      this.logger.log('📩 WA Gateway webhook received');

      // Payload bisa dibungkus dalam objek `data` atau array `data[0]`
      let data = body;
      if (body?.data) {
        data = Array.isArray(body.data) ? body.data[0] || body : body.data;
      }

      const phone = this.pick(data, [
        'from', 'sender', 'phone', 'wa_id', 'msisdn',
        'from_number', 'sender_number', 'source',
      ]);
      const text = this.pick(data, [
        'text', 'message', 'body', 'content', 'message_body', 'message_text', 'pesan',
      ]);
      const name = this.pick(data, [
        'name', 'profileName', 'sender_name', 'contact_name', 'pushname',
      ]);
      const msgId = this.pick(data, [
        'id', 'message_id', 'msg_id', 'messageId', 'webhook_id', 'event_id',
      ]);

      if (!phone || !text) {
        this.logger.warn(`⚠️ Gateway payload tidak lengkap: phone=${!!phone} text=${!!text}`);
        return { status: 'incomplete', required: ['phone', 'text'] };
      }

      // Normalisasi nomor → format internasional 628xx
      const digits = phone.replace(/\D/g, '');
      const phone62 = digits.startsWith('0')
        ? '62' + digits.slice(1)
        : digits.startsWith('62') ? digits : '62' + digits;

      this.logger.log(`📨 Gateway from ${phone62}: "${text.slice(0, 50)}"`);

      // Jembatan tracking code kalau ada, sama seperti jalur Meta
      const trackingMatch = text.match(/\[Kode:\s*(DL\w+)\]/);
      const trackingCode = trackingMatch ? trackingMatch[1] : null;

      if (trackingCode) {
        await this.leadCapture.updateFromWhatsApp(trackingCode, {
          phone: phone62,
          waName: name || 'Unknown',
          waMessage: text,
          msgId: msgId || undefined,
        });
      } else {
        await this.leadCapture.upsertOrphanLead(phone62, name || 'Unknown', text, msgId || undefined);
      }

      return { status: 'ok' };
    } catch (err: any) {
      this.logger.error('❌ Gateway webhook error:', err?.message || err);
      return { status: 'error', message: err?.message };
    }
  }

  /** Ambil nilai string pertama dari daftar nama field yang dikenal */
  private pick(obj: any, keys: string[]): string | null {
    if (!obj || typeof obj !== 'object') return null;
    for (const key of keys) {
      const v = obj[key];
      if (v !== undefined && v !== null && typeof v !== 'object') {
        const s = String(v).trim();
        if (s) return s;
      }
    }
    return null;
  }
}