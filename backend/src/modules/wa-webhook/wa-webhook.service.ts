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
            });
          } else {
            // Tracking code gak ketemu — simpan sebagai orphan lead
            this.logger.warn(`⚠️ No tracking code in message from ${phone}`);
            // Bisa dicari berdasarkan phone number atau dibuat baru
            await this.leadCapture.track({
              intent: 'WhatsApp Direct',
              pageUrl: 'wa-direct',
            }).then(async (lead) => {
              await this.leadCapture.updateFromWhatsApp(lead.trackingCode, {
                phone,
                waName: profileName,
                waMessage: text,
              });
            });
          }
        }

        // Handle interactive messages (button reply)
        if (msg.type === 'interactive' && msg.interactive?.button_reply) {
          const phone = msg.from;
          const text = msg.interactive.button_reply.title || '';
          await this.leadCapture.track({
            intent: 'Interactive: ' + text,
            pageUrl: 'wa-interactive',
          }).then(async (lead) => {
            await this.leadCapture.updateFromWhatsApp(lead.trackingCode, {
              phone,
              waName: contacts?.[0]?.profile?.name || 'Unknown',
              waMessage: text,
            });
          });
        }
      }

      return { status: 'ok' };
    } catch (err) {
      this.logger.error('❌ Webhook error:', err);
      return { status: 'error', message: err.message };
    }
  }
}