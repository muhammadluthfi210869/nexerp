import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { OutboundCounterService } from '../../lead-capture/outbound-counter.service';

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
  private readonly completedRequests = new Map<
    string,
    { expiresAt: number; result: unknown }
  >();
  private readonly inFlightRequests = new Map<string, Promise<unknown>>();

  constructor(
    private prisma: PrismaService,
    private outboundCounter: OutboundCounterService,
  ) {}

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
  async listConversations(limit = 100, assignedTo?: string) {
    const leads = await this.prisma.leadCapture.findMany({
      where: {
        ...(assignedTo ? { assignedTo } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
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
      name: l.fullName || l.waProfileName || `Lead ${l.trackingCode}`,
      phone: l.phone || null,
      source: l.source || l.utmSource || 'Website Inbound',
      status: l.status,
      workflowStatus: l.workflowStatus,
      lastMessageAt:
        l.messages[0]?.createdAt || l.contactedAt || l.updatedAt || l.createdAt,
      lastMessage: l.messages[0]?.body || l.waMessage || null,
      lastDirection:
        l.messages[0]?.direction || (l.waMessage ? 'INBOUND' : null),
      messageCount:
        l._count.messages > 0 ? l._count.messages : l.waMessage ? 1 : 0,
      assignedName: l.assignedName,
      assignedBusDevId: l.assignedTo,
      createdAt: l.createdAt,
    }));
  }

  async listBusDevs() {
    const agents = await this.prisma.roundRobinAgent.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: agent.isActive ? ('AKTIF' as const) : ('NON-AKTIF' as const),
      lastAssigned: agent.updatedAt.toISOString(),
      leadCount: agent.totalLeads,
      phone: agent.phoneNumber,
      formattedPhone: agent.phoneNumber.startsWith('+')
        ? agent.phoneNumber
        : `+${agent.phoneNumber}`,
      role: 'BusDev COMMERCIAL',
      specialty: 'Maklon & Client Consultation',
      deviceModel: `WhatsApp Bisnis #${agent.orderIndex + 1}`,
      whatsappAccountKey: `BUSDEV_${agent.orderIndex + 1}`,
      whatsappConfigured: Boolean(
        process.env[`BUSDEV_${agent.orderIndex + 1}_PHONE_NUMBER_ID`],
      ),
    }));
  }

  getGatewayStatus() {
    const tokenConfigured = Boolean(
      process.env.META_WHATSAPP_ACCESS_TOKEN || process.env.USER_TOKEN,
    );
    const configuredAccounts = Array.from(
      { length: 20 },
      (_, index) => index + 1,
    ).filter((number) =>
      Boolean(process.env[`BUSDEV_${number}_PHONE_NUMBER_ID`]),
    );

    return {
      configured: tokenConfigured && configuredAccounts.length > 0,
      tokenConfigured,
      configuredAccountCount: configuredAccounts.length,
      // This endpoint intentionally reports configuration readiness, not an
      // unverified claim that Meta is reachable right now.
      live: false,
    };
  }

  /** Full chat thread for one lead, oldest → newest */
  async getMessages(leadId: string) {
    const lead = await this.prisma.leadCapture.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        trackingCode: true,
        fullName: true,
        waProfileName: true,
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
    accountKey?: string;
    clientRequestId?: string;
  }) {
    const phone = this.normalizePhone(params.phone);
    if (phone.length < 8 || phone.length > 20) {
      throw new BadRequestException('Nomor WhatsApp tidak valid');
    }
    const message = params.message?.trim();
    if (!message) throw new BadRequestException('Pesan tidak boleh kosong');

    const requestKey = params.clientRequestId
      ? `${params.leadId || phone}:${params.clientRequestId}`
      : null;
    if (requestKey) {
      const cached = this.completedRequests.get(requestKey);
      if (cached && cached.expiresAt > Date.now()) return cached.result;
      const pending = this.inFlightRequests.get(requestKey);
      if (pending) return pending;
    }

    const operation = this.resolveAndDispatch({ ...params, phone, message });
    if (!requestKey) return operation;

    this.inFlightRequests.set(requestKey, operation);
    try {
      const result = await operation;
      this.completedRequests.set(requestKey, {
        expiresAt: Date.now() + 10 * 60 * 1000,
        result,
      });
      return result;
    } finally {
      this.inFlightRequests.delete(requestKey);
      if (this.completedRequests.size > 1000) {
        for (const [key, value] of this.completedRequests) {
          if (value.expiresAt <= Date.now()) this.completedRequests.delete(key);
        }
      }
    }
  }

  private async resolveAndDispatch(params: {
    leadId?: string;
    phone: string;
    message: string;
    accountKey?: string;
  }) {
    // Resolve or create lead
    const lead = params.leadId
      ? await this.prisma.leadCapture.findUnique({
          where: { id: params.leadId },
        })
      : null;
    if (params.leadId && !lead) {
      throw new NotFoundException('Lead tidak ditemukan');
    }
    if (!lead) {
      // Auto-create orphan lead (consistent with inbound flow)
      const trackingCode =
        'DL' + Math.random().toString(36).slice(2, 10).toUpperCase();
      const created = await this.prisma.leadCapture.create({
        data: {
          trackingCode,
          phone: params.phone,
          waProfileName: 'Outbound Initiated',
          status: 'PENDING',
        },
      });
      return this.dispatchAndPersist(
        created.id,
        params.phone,
        params.message,
        params.accountKey,
      );
    }
    if (!lead.phone) {
      await this.prisma.leadCapture.update({
        where: { id: lead.id },
        data: {
          phone: params.phone,
          status: 'WA_CONTACTED',
          contactedAt: new Date(),
        },
      });
    }
    return this.dispatchAndPersist(
      lead.id,
      params.phone,
      params.message,
      params.accountKey,
    );
  }

  /**
   * Internal: call Meta Graph API → on success persist OUTBOUND message.
   * phoneNumberId: optional override (BUSDEV_1/2). Default → BUSDEV_1.
   */
  private async dispatchAndPersist(
    leadId: string,
    phone: string,
    message: string,
    accountKey = 'BUSDEV_1',
  ) {
    const rawToken =
      process.env.META_WHATSAPP_ACCESS_TOKEN || process.env.USER_TOKEN;
    const token = (rawToken || '').replace(/^['"]|['"]$/g, '').trim();
    if (!/^BUSDEV_[1-9][0-9]?$/.test(accountKey)) {
      throw new BadRequestException('Akun WhatsApp tidak valid');
    }
    const rawPhoneId = process.env[`${accountKey}_PHONE_NUMBER_ID`] || '';
    const phoneNumberId = rawPhoneId.replace(/^['"]|['"]$/g, '').trim();

    if (!token) {
      this.logger.error('❌ META_WHATSAPP_ACCESS_TOKEN missing — cannot send');
      throw new ServiceUnavailableException(
        'Gateway WhatsApp belum dikonfigurasi',
      );
    }
    if (!phoneNumberId) {
      this.logger.error(
        `❌ No phone number id configured (${accountKey}_PHONE_NUMBER_ID)`,
      );
      throw new ServiceUnavailableException(
        `Nomor WhatsApp ${accountKey} belum dikonfigurasi`,
      );
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
        const dispatchError = data?.error?.message || `HTTP ${resp.status}`;
        this.logger.error(`❌ Meta API error: ${dispatchError}`);
        throw new BadGatewayException(
          `Meta WhatsApp menolak pesan: ${dispatchError}`,
        );
      } else {
        metaMsgId = data?.messages?.[0]?.id || null;
        this.logger.log(`✅ WA sent to ${phone} (msgId=${metaMsgId})`);
      }
    } catch (err: any) {
      if (err instanceof BadGatewayException) throw err;
      const dispatchError = err?.message || 'fetch failed';
      this.logger.error(`❌ Meta fetch error: ${dispatchError}`);
      throw new BadGatewayException('Gateway WhatsApp tidak dapat dihubungi');
    }

    // Persist only after Meta accepts the message. Failed attempts must never
    // appear as successfully sent chat bubbles.
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

    // T4: outbound counter — fire-and-forget stage transition
    void this.outboundCounter.recordBusdevReply(leadId);

    return {
      ok: true,
      dispatchError: null,
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
