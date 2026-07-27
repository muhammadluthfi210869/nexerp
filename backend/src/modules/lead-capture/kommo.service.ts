import { Injectable, Logger } from '@nestjs/common';

/**
 * Kommo API v4 client.
 * Menarik leads & contacts dari Kommo untuk disimpan di LeadCapture.
 */
@Injectable()
export class KommoService {
  private readonly logger = new Logger(KommoService.name);

  private readEnv(name: string): string | undefined {
    const value = process.env[name]?.trim();
    if (!value) return undefined;
    return value.replace(/^['"]|['"]$/g, '').trim();
  }

  getAccountBaseUrl(): string {
    const raw = this.readEnv('KOMMO_BASE_URL') ?? this.readEnv('KOMMO_SUBDOMAIN');
    if (!raw) throw new Error('KOMMO_SUBDOMAIN or KOMMO_BASE_URL not set');

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let host: string;

    try {
      host = new URL(withProtocol).host;
    } catch {
      throw new Error(`Invalid Kommo account URL/subdomain: ${raw}`);
    }

    const subdomain = host.replace(/\.kommo\.com$/i, '').trim();
    if (!subdomain || subdomain.includes('/')) {
      throw new Error(`Invalid Kommo subdomain: ${raw}`);
    }

    return `https://${subdomain}.kommo.com`;
  }

  private getBaseUrl(): string {
    return `${this.getAccountBaseUrl()}/api/v4`;
  }

  private getToken(): string {
    const token =
      this.readEnv('TOKEN_BERUMUR_PANJANG') ??
      this.readEnv('KOMMO_LONG_LIVED_TOKEN') ??
      this.readEnv('KOMMO_API_TOKEN');
    if (!token) throw new Error('TOKEN_BERUMUR_PANJANG or KOMMO_API_TOKEN not set');
    return token;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    };
  }

  private async fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 20_000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async getAccountStatus() {
    const res = await fetch(`${this.getBaseUrl()}/account`, { headers: this.getHeaders() });
    const text = await res.text().catch(() => '');

    if (!res.ok) {
      return {
        configuredBaseUrl: this.getAccountBaseUrl(),
        ok: false,
        status: res.status,
        error: text.slice(0, 500),
      };
    }

    const account = text ? JSON.parse(text) : {};
    return {
      configuredBaseUrl: this.getAccountBaseUrl(),
      ok: true,
      account: {
        id: account.id,
        name: account.name,
        subdomain: account.subdomain,
      },
    };
  }

  // ──────────────────────────────────────────────
  //  PULL ALL LEADS from Kommo (full sync)
  // ──────────────────────────────────────────────

  async pullAllLeads(dateFrom?: string, dateTo?: string) {
    this.logger.log(`[Kommo Pull] Starting... dateFrom=${dateFrom || 'all'} dateTo=${dateTo || 'all'}`);

    const leads: any[] = [];
    let page = 1;
    const limit = 250;
    const [pipelines, users] = await Promise.all([
      this.fetchPipelines(),
      this.fetchUsers(),
    ]);

    while (true) {
      const url = new URL(`${this.getBaseUrl()}/leads`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('page', String(page));
      url.searchParams.set('with', 'contacts,source,loss_reason');
      if (dateFrom) url.searchParams.set('filter[created_at][from]', dateFrom);
      if (dateTo) url.searchParams.set('filter[created_at][to]', dateTo);

      const res = await this.fetchWithTimeout(url.toString(), { headers: this.getHeaders() });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Kommo API error ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      const batch = data?._embedded?.leads ?? [];
      leads.push(...batch);

      if (batch.length < limit) break;
      page++;
      if (page > 200) break;
    }

    this.logger.log(`[Kommo Pull] Fetched ${leads.length} leads`);

    // Get contact details for each lead
    const contactIds = new Set<string>();
    for (const lead of leads) {
      if (lead._embedded?.contacts) {
        for (const c of lead._embedded.contacts) {
          if (c.id) contactIds.add(String(c.id));
        }
      }
    }

    const [contacts, talks, events] = await Promise.all([
      this.fetchContacts(Array.from(contactIds)),
      this.fetchTalks(),
      this.fetchChatEvents(),
    ]);
    return { leads, contacts, pipelines, users, talks, events };
  }

  private async fetchPipelines(): Promise<any[]> {
    const res = await this.fetchWithTimeout(`${this.getBaseUrl()}/leads/pipelines`, { headers: this.getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data?._embedded?.pipelines ?? [];
  }

  private async fetchUsers(): Promise<any[]> {
    const res = await this.fetchWithTimeout(`${this.getBaseUrl()}/users?limit=250`, { headers: this.getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data?._embedded?.users ?? [];
  }

  private async fetchTalks(): Promise<any[]> {
    const talks: any[] = [];
    const limit = 250;

    for (let page = 1; page <= 80; page++) {
      const res = await this.fetchWithTimeout(`${this.getBaseUrl()}/talks?limit=${limit}&page=${page}`, { headers: this.getHeaders() });
      if (!res.ok) break;
      const data = await res.json();
      const batch = data?._embedded?.talks ?? [];
      talks.push(...batch);
      if (batch.length < limit) break;
    }

    return talks;
  }

  private async fetchChatEvents(): Promise<any[]> {
    const events: any[] = [];
    const limit = 100;

    for (let page = 1; page <= 30; page++) {
      const res = await this.fetchWithTimeout(`${this.getBaseUrl()}/events?limit=${limit}&page=${page}`, { headers: this.getHeaders() });
      if (!res.ok) break;
      const data = await res.json();
      const batch = data?._embedded?.events ?? [];
      events.push(...batch.filter((event: any) =>
        event?.entity_type === 'lead' &&
        (event?.type === 'incoming_chat_message' || event?.type === 'outgoing_chat_message')
      ));
      if (batch.length < limit) break;
    }

    return events;
  }

  private async fetchContacts(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    const contacts: any[] = [];

    // Kommo allows batch fetch: GET /api/v4/contacts?id[]=1&id[]=2
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50));

    for (let i = 0; i < batches.length; i += 5) {
      const group = batches.slice(i, i + 5);
      const results = await Promise.all(group.map(async (batch) => {
        const url = `${this.getBaseUrl()}/contacts?` + batch.map(id => `id[]=${id}`).join('&') + '&limit=50';
        const res = await this.fetchWithTimeout(url, { headers: this.getHeaders() });
        if (!res.ok) return [];
        const data = await res.json();
        return data?._embedded?.contacts ?? [];
      }));
      contacts.push(...results.flat());
    }

    return contacts;
  }

  // ──────────────────────────────────────────────
  //  FIND CONTACT BY PHONE
  // ──────────────────────────────────────────────

  async findContactByPhone(phone: string): Promise<{ name: string; phone: string } | null> {
    try {
      const cleaned = phone.replace(/[^0-9]/g, '');
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

      if (contacts.length === 0) return null;

      const contact = contacts[0];
      const name = contact.name || 'Unknown';
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

      return { name, phone: foundPhone };
    } catch (err) {
      this.logger.error(`[Kommo] findContactByPhone error:`, err);
      return null;
    }
  }

  // ──────────────────────────────────────────────
  //  WEBHOOK PROCESSING
  // ──────────────────────────────────────────────

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
        this.logger.error(`[Kommo Webhook] Error:`, err);
      }
    };

    (body.contacts.add ?? []).forEach((c: any) => processContact(c, 'Added'));
    (body.contacts.update ?? []).forEach((c: any) => processContact(c, 'Updated'));

    return { processed };
  }

  extractPhones(contact: any): string[] {
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

    if (contact.phone) phones.push(String(contact.phone));
    return phones;
  }
}
