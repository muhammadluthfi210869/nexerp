import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

/**
 * Kommo API v4 client for lead enrichment.
 * Digunakan oleh webhook receiver & manual sync endpoint.
 */
@Injectable()
export class KommoService {
  private readonly logger = new Logger(KommoService.name);

  private getBaseUrl(): string {
    const subdomain = process.env.KOMMO_SUBDOMAIN;
    if (!subdomain) throw new Error('KOMMO_SUBDOMAIN not set');
    return `https://${subdomain}.kommo.com/api/v4`;
  }

  private getToken(): string {
    const token = process.env.KOMMO_API_TOKEN;
    if (!token) throw new Error('KOMMO_API_TOKEN not set');
    return token;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Cari kontak di Kommo berdasarkan nomor HP.
   * Kommo API v4: GET /api/v4/contacts?query={phone}
   * Query akan mencari di semua field termasuk custom fields.
   */
  async findContactByPhone(phone: string): Promise<{ name: string; phone: string } | null> {
    try {
      const cleaned = phone.replace(/[^0-9]/g, '');
      // Ambil 10 digit terakhir untuk fuzzy search
      const last10 = cleaned.slice(-10);

      const url = `${this.getBaseUrl()}/contacts?query=${last10}&limit=5`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(url, {
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.logger.error(`[Kommo] Search failed: ${res.status} ${res.statusText}`);
        return null;
      }

      const data = await res.json();
      const contacts = data?._embedded?.contacts ?? [];

      if (contacts.length === 0) {
        this.logger.warn(`[Kommo] No contact found for phone ending: ${last10}`);
        return null;
      }

      // Ambil kontak pertama
      const contact = contacts[0];
      const name = contact.name || 'Unknown';

      // Extract phone from custom_fields_values
      let foundPhone = phone;
      if (contact.custom_fields_values) {
        for (const field of contact.custom_fields_values) {
          if (field.field_name?.toLowerCase().includes('phone') ||
              field.field_name?.toLowerCase().includes('telepon') ||
              field.field_name?.toLowerCase().includes('hp') ||
              field.field_code === 'PHONE') {
            const val = field.values?.[0]?.value;
            if (val) foundPhone = String(val);
            break;
          }
        }
      }

      this.logger.log(`[Kommo] Found contact: ${name} (${foundPhone})`);
      return { name, phone: foundPhone };
    } catch (err) {
      this.logger.error(`[Kommo] findContactByPhone error:`, err);
      return null;
    }
  }

  /**
   * Proses webhook dari Kommo.
   * Format payload standar Kommo v4:
   * {
   *   "contacts": {
   *     "add": [{ "id": ..., "name": "...", "custom_fields_values": [...] }],
   *     "update": [...]
   *   },
   *   "leads": { ... }
   * }
   */
  async processWebhook(body: any): Promise<{ processed: number }> {
    let processed = 0;
    if (!body?.contacts) return { processed };

    const processContact = (contact: any, action: string) => {
      try {
        const name = contact?.name;
        const phones = this.extractPhones(contact);
        for (const phone of phones) {
          this.logger.log(`[Kommo Webhook] ${action} contact: ${name} | Phone: ${phone}`);
          processed++;
        }
      } catch (err) {
        this.logger.error(`[Kommo Webhook] Error processing ${action} contact:`, err);
      }
    };

    // Proses contacts added & updated
    (body.contacts.add ?? []).forEach((c: any) => processContact(c, 'Added'));
    (body.contacts.update ?? []).forEach((c: any) => processContact(c, 'Updated'));

    return { processed };
  }

  /**
   * Extract phone numbers from Kommo contact custom_fields_values
   */
  private extractPhones(contact: any): string[] {
    const phones: string[] = [];

    if (contact.custom_fields_values) {
      for (const field of contact.custom_fields_values) {
        const fname = (field.field_name || '').toLowerCase();
        const fcode = (field.field_code || '').toUpperCase();
        if (fname.includes('phone') || fname.includes('telepon') ||
            fname.includes('hp') || fname.includes('wa') ||
            fcode === 'PHONE' || fcode === 'PHONE_WORK') {
          for (const val of (field.values || [])) {
            if (val.value) phones.push(String(val.value));
          }
        }
      }
    }

    // Also check top-level phone fields
    if (contact.phone) {
      phones.push(String(contact.phone));
    }

    return phones;
  }
}
