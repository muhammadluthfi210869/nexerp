import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

/**
 * Omni CRM Conversation service — bridge between the dashboard Inbox UI and
 * the underlying LeadCapture + LeadMessage tables (the source of truth for
 * WhatsApp conversations).
 *
 * Responsibilities:
 *   - listConversations(): LeadCapture rows that have WA phone, with last msg preview
 *   - getMessages(): ordered chat thread for one lead
 *   - sendOutbound(): POST to Meta WhatsApp Cloud API + persist OUTBOUND LeadMessage
 */
@Injectable()
export class OmniCrmConversationService {
  private readonly logger = new Logger(OmniCrmConversationService.name);

  constructor(private prisma: PrismaService) {}

  /** Normalisasi nomor: buang karakter non-digit, pastikan prefix 62 */
  private normalizePhone(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('62')) return digits;
    if (digits.startsWith('0')) return '62' + digits.slice(1);
    return '62' + digits;
  }

  /**
   * List of leads that have WA contact (= punya nomor HP). Each item carries
   * the last message preview so the sidebar list can render immediately.
   */
  async listConversations(limit = 50, assignedTo?: string) {
    const leads = await this.prisma.leadCapture.findMany({
      where: {
        phone: { not: null },
        ...(assignedTo ? { assignedTo } : {}),
      },
      orderBy: { contactedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, direction: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return leads.map((l) => ({
      id: l.id,
      trackingCode: l.trackingCode,
      name: l.fullName || l.waName || 'Tanpa Nama',
      phone: l.phone,
      source: l.source,
      status: l.status,
      workflowStatus: l.workflowStatus,
      lastMessageAt: l.contactedAt || l.createdAt,
      lastMessage: l.messages[0]?.body || null,
      lastDirection: l.messages[0]?.direction || null,
      messageCount: l._count.messages,
      assignedName: l.assignedName,
      createdAt: l.createdAt,
    }));
  }

  /** Full chat thread for one lead, oldest → newest */
  async getMessages(leadId: string) {
    const lead = await this.prisma.leadCapture.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        trackingCode: true,
        fullName: true,
        waName: true,
        phone: true,
        source: true,
        status: true,
        workflowStatus: true,
      },
    });
    if (!lead) return null;

    const messages = await this.prisma.leadMessage.findMany({
      where: { leadId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        direction: true,
        phone: true,
        waName: true,
        body: true,
        createdAt: true,
        msgId: true,
      },
    });

    return { lead, messages };
  }

  /**
   * Send a WhatsApp text message via Meta Cloud API and persist it as
   * an OUTBOUND LeadMessage linked to the lead (create lead if phone is new).
   */
  async sendOutbound(params: {
    leadId?: string;
    phone: string;
    message: string;
    phoneNumberId?: string;
  }) {
    const phone = this.normalizePhone(params.phone);
    if (!phone) throw new Error('INVALID_PHONE');
    if (!params.message?.trim()) throw new Error('EMPTY_MESSAGE');

    // Resolve or create lead
    const lead = params.leadId
      ? await this.prisma.leadCapture.findUnique({ where: { id: params.leadId } })
      : null;
    if (!lead) {
      // Auto-create orphan lead (consistent with inbound flow)
      const trackingCode = 'DL' + Math.random().toString(36).slice(2, 10).toUpperCase();
      const created = await this.prisma.leadCapture.create({
        data: {
          trackingCode,
          phone,
          waName: 'Outbound Initiated',
          status: 'WA_CONTACTED',
          contactedAt: new Date(),
        },
      });
      return this.dispatchAndPersist(created.id, phone, params.message, params.phoneNumberId);
    }
    if (!lead.phone) {
      await this.prisma.leadCapture.update({
        where: { id: lead.id },
        data: { phone, status: 'WA_CONTACTED', contactedAt: new Date() },
      });
    }
    return this.dispatchAndPersist(lead.id, phone, params.message, params.phoneNumberId);
  }

  /**
   * Internal: call Meta Graph API → on success persist OUTBOUND message.
   * phoneNumberId: optional override (BUSDEV_1/2). Default → BUSDEV_1.
   */
  private async dispatchAndPersist(
    leadId: string,
    phone: string,
    message: string,
    phoneNumberIdOverride?: string,
  ) {
    const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId =
      phoneNumberIdOverride ||
      process.env.BUSDEV_1_PHONE_NUMBER_ID ||
      '';

    if (!token) {
      this.logger.error('❌ META_WHATSAPP_ACCESS_TOKEN missing — cannot send');
      throw new Error('META_TOKEN_MISSING');
    }
    if (!phoneNumberId) {
      this.logger.error('❌ No phone number id configured (BUSDEV_1_PHONE_NUMBER_ID)');
      throw new Error('PHONE_NUMBER_ID_MISSING');
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: { body: message },
    };

    let metaMsgId: string | null = null;
    let dispatchError: string | null = null;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data: any = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        dispatchError = data?.error?.message || `HTTP ${resp.status}`;
        this.logger.error(`❌ Meta API error: ${dispatchError}`);
      } else {
        metaMsgId = data?.messages?.[0]?.id || null;
        this.logger.log(`✅ WA sent to ${phone} (msgId=${metaMsgId})`);
      }
    } catch (err: any) {
      dispatchError = err?.message || 'fetch failed';
      this.logger.error(`❌ Meta fetch error: ${dispatchError}`);
    }

    // Always persist the outbound message — even on dispatch error, so the
    // operator sees the attempt in the chat thread and can retry.
    const saved = await this.prisma.leadMessage.create({
      data: {
        leadId,
        direction: 'OUTBOUND',
        phone,
        waName: null,
        body: message,
        msgId: metaMsgId || `local-${Date.now()}`,
      },
    });

    // Touch lead timestamps so it floats to top of inbox
    await this.prisma.leadCapture.update({
      where: { id: leadId },
      data: { contactedAt: new Date(), status: 'WA_CONTACTED' },
    });

    return {
      ok: !dispatchError,
      dispatchError,
      metaMsgId,
      message: {
        id: saved.id,
        direction: saved.direction,
        phone: saved.phone,
        body: saved.body,
        createdAt: saved.createdAt,
      },
    };
  }
}
