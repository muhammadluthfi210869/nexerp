import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { ResourceNotFoundException } from '../../common/exceptions/api-exception';

export interface NotificationMessage {
  title: string;
  body: string;
  type: 'GATE_OPENED' | 'GATE_BLOCKED' | 'SLA_BREACH' | 'HANDOVER' | 'CRITICAL';
  referenceType?: string;
  referenceId?: string;
  link?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private readonly preferencesMap = new Map<string, any>();

  // --- IN-APP NOTIFICATION (DB) ---

  async sendInApp(userId: string, message: NotificationMessage): Promise<void> {
    // BUS-RULE-092: 1-hour notification deduplication / aggregation
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (message.referenceId) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId,
          type: message.type,
          referenceId: message.referenceId,
          createdAt: { gte: oneHourAgo },
        },
      });

      if (existing) {
        await this.prisma.notification.update({
          where: { id: existing.id },
          data: {
            title: message.title,
            body: `${message.body} (agregat)`,
            createdAt: new Date(),
          },
        });
        this.logger.log(`[IN-APP DEDUP] Aggregated notification for User ${userId}: ${message.title}`);
        return;
      }
    }

    await this.prisma.notification.create({
      data: {
        userId,
        title: message.title,
        body: message.body,
        type: message.type,
        referenceType: message.referenceType,
        referenceId: message.referenceId,
        link: message.link,
        isRead: false,
      },
    });
    this.logger.log(`[IN-APP] User ${userId}: ${message.title}`);
  }

  async sendToRole(role: string, message: NotificationMessage): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { roles: { has: role as any }, status: 'ACTIVE' },
    });
    for (const user of users) {
      await this.sendInApp(user.id, message);
    }
  }

  async sendToDivision(
    division: string,
    message: NotificationMessage,
  ): Promise<void> {
    // Map division to UserRole — simplified mapping
    const roleMap: Record<string, string[]> = {
      BD: ['COMMERCIAL'],
      RND: ['RND'],
      FINANCE: ['FINANCE'],
      SCM: ['SCM', 'PURCHASING'],
      LEGAL: ['COMPLIANCE', 'APJ'],
      CREATIVE: ['ADMIN'],
      PRODUCTION: ['PRODUCTION', 'PPIC', 'PRODUCTION_OP'],
      QC: ['QC_LAB'],
      WAREHOUSE: ['WAREHOUSE'],
      MANAGEMENT: ['DIRECTOR', 'HEAD_OPS'],
    };

    const roles = roleMap[division] || [division];
    for (const role of roles) {
      await this.sendToRole(role, message);
    }
  }

  // --- EXTERNAL CHANNELS (PLACEHOLDER) ---

  async sendWhatsApp(to: string, message: string) {
    // TODO: Integrate with Fonnte / Twilio / WABlas
    this.logger.warn(
      `[WA STUB] Not actually sent — to=${to} msg=${message.slice(0, 80)}`,
    );
  }

  async sendEmail(to: string, subject: string, body: string) {
    // TODO: Integrate with Nodemailer / SendGrid
    this.logger.warn(
      `[EMAIL STUB] Not actually sent — to=${to} subject=${subject} body=${body.slice(0, 80)}`,
    );
  }

  // --- EVENT LISTENERS ---

  @OnEvent('finance.gate1.verified')
  async handleGate1Verified(payload: {
    leadId: string;
    clientName: string;
    verifiedBy: string;
  }) {
    await this.sendToRole('RND', {
      title: 'Gate 1 Terbuka — Sample Payment Verified',
      body: `Pembayaran sampel untuk ${payload.clientName} telah diverifikasi oleh Finance. R&D dapat mulai formulasi.`,
      type: 'GATE_OPENED',
      referenceType: 'lead',
      referenceId: payload.leadId,
      link: `/rnd/inbox`,
    });
  }

  @OnEvent('finance.gate2.verified')
  async handleGate2Verified(payload: {
    leadId: string;
    clientName: string;
    brandName: string;
  }) {
    const message: NotificationMessage = {
      title: 'Gate 2 Terbuka — DP Production Verified',
      body: `DP untuk ${payload.clientName} (${payload.brandName}) telah diverifikasi. Semua track paralel aktif.`,
      type: 'GATE_OPENED',
      referenceType: 'lead',
      referenceId: payload.leadId,
    };

    await Promise.all([
      this.sendToRole('SCM', {
        ...message,
        body: `${message.body} SCM: lakukan pengecekan BOM & PR jika perlu.`,
        link: '/scm/purchase-requests',
      }),
      this.sendToRole('COMPLIANCE', {
        ...message,
        body: `${message.body} Legal: mulai proses registrasi BPOM/HKI.`,
        link: '/legality/inbox',
      }),
      this.sendToRole('APJ', {
        ...message,
        body: `${message.body} APJ: mulai proses registrasi BPOM/HKI.`,
        link: '/legality/inbox',
      }),
      this.sendToRole('ADMIN', {
        ...message,
        body: `${message.body} Creative: task desain kemasan tersedia.`,
        link: '/creative/board',
      }),
      this.sendToRole('WAREHOUSE', {
        ...message,
        body: `${message.body} Warehouse: cek kapasitas gudang.`,
        link: '/warehouse/hub',
      }),
    ]);
  }

  @OnEvent('finance.gate3.verified')
  async handleGate3Verified(payload: { leadId: string; clientName: string }) {
    await this.sendToRole('WAREHOUSE', {
      title: 'Gate 3 Terbuka — Pelunasan Diverifikasi',
      body: `Pelunasan untuk ${payload.clientName} telah diverifikasi. Delivery Order dapat dicetak.`,
      type: 'GATE_OPENED',
      referenceType: 'lead',
      referenceId: payload.leadId,
      link: `/warehouse/delivery`,
    });
  }

  @OnEvent('sample.revision.overlimit')
  async handleRevisionOverlimit(payload: {
    leadId: string;
    clientName: string;
    revisionCount: number;
  }) {
    await this.sendToRole('DIRECTOR', {
      title: '⚠️ Sample Revision Overlimit',
      body: `Sampel untuk ${payload.clientName} telah mencapai ${payload.revisionCount}x revisi. Perlu intervensi Direktur.`,
      type: 'SLA_BREACH',
      referenceType: 'lead',
      referenceId: payload.leadId,
      link: `/bussdev/pipeline`,
    });
  }

  @OnEvent('stock.shortage')
  async handleStockShortage(payload: {
    materialName: string;
    shortage: number;
    leadId: string;
  }) {
    await this.sendToRole('PURCHASING', {
      title: '⚠️ Stock Shortage Detected',
      body: `Material ${payload.materialName} kekurangan ${payload.shortage} unit. PR otomatis telah dibuat.`,
      type: 'CRITICAL',
      referenceType: 'lead',
      referenceId: payload.leadId,
      link: `/scm/purchase-requests`,
    });
  }

  @OnEvent('bpom.published')
  async handleBpomPublished(payload: {
    leadId: string;
    productName: string;
    registrationNo: string;
  }) {
    await Promise.all([
      this.sendToRole('COMMERCIAL', {
        title: '✅ BPOM NA Terbit',
        body: `Nomor Notifikasi BPOM untuk ${payload.productName}: ${payload.registrationNo}. Produksi dapat dimulai.`,
        type: 'GATE_OPENED',
        referenceType: 'lead',
        referenceId: payload.leadId,
        link: `/production/work-orders`,
      }),
      this.sendToRole('PRODUCTION', {
        title: '✅ BPOM NA Terbit',
        body: `Nomor Notifikasi BPOM untuk ${payload.productName}: ${payload.registrationNo}. Produksi dapat dimulai.`,
        type: 'GATE_OPENED',
        referenceType: 'lead',
        referenceId: payload.leadId,
        link: `/production/work-orders`,
      }),
    ]);
  }

  @OnEvent('sla.breach')
  async handleSlaBreach(payload: {
    entityType: string;
    entityId: string;
    detail: string;
  }) {
    await this.sendToRole('HEAD_OPS', {
      title: '🚨 SLA Breach',
      body: `${payload.entityType} ${payload.entityId}: ${payload.detail}`,
      type: 'SLA_BREACH',
      referenceType: payload.entityType,
      referenceId: payload.entityId,
    });
  }

  // --- DOCUMENT AUTOMATION NOTIFICATIONS ---

  @OnEvent('document.draft_created')
  async handleDocumentDraftCreated(payload: {
    draftId: string;
    documentType: string;
    sourceType: string;
  }) {
    await this.sendToRole('FINANCE', {
      title: '📄 New Document Draft',
      body: `Auto-generated ${payload.documentType} draft created. Review in Document Center.`,
      type: 'HANDOVER',
      referenceType: 'document_draft',
      referenceId: payload.draftId,
      link: '/document-center',
    });
  }

  @OnEvent('document.draft_approved')
  async handleDocumentDraftApproved(payload: {
    draftId: string;
    documentType: string;
  }) {
    await this.sendToRole('FINANCE', {
      title: '✅ Document Approved',
      body: `${payload.documentType} draft has been approved and executed.`,
      type: 'GATE_OPENED',
      referenceType: 'document_draft',
      referenceId: payload.draftId,
      link: '/document-center',
    });
  }

  @OnEvent('document.draft_auto_approved')
  async handleDocumentDraftAutoApproved(payload: {
    draftId: string;
    documentType: string;
  }) {
    await this.sendToRole('FINANCE', {
      title: '⚡ Document Auto-Approved',
      body: `${payload.documentType} draft was auto-approved (no edits within deadline).`,
      type: 'GATE_OPENED',
      referenceType: 'document_draft',
      referenceId: payload.draftId,
      link: '/document-center',
    });
  }

  // --- QUERIES ---

  async getAllNotifications(userId: string, limit: number = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId?: string) {
    if (userId) {
      return this.prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async getNotification(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notif || notif.userId !== userId) {
      throw new ResourceNotFoundException('Notification', id);
    }
    return notif;
  }

  async listNotifications(
    userId: string,
    filter: { read?: boolean; type?: string; page?: number; limit?: number },
  ) {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 50;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (filter.read !== undefined) {
      where.isRead = filter.read;
    }
    if (filter.type) {
      where.type = filter.type;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getNotificationPreferences(userId: string) {
    return (
      this.preferencesMap.get(userId) || {
        in_app: true,
        email_digest: true,
        whatsapp_alerts: true,
        sla_warnings: true,
        quiet_hours_enabled: false,
      }
    );
  }

  async replaceNotificationPreferences(userId: string, prefs: any) {
    this.preferencesMap.set(userId, prefs);
    return prefs;
  }

  // --- BUS-RULE-093: SLA TIMER & ESCALATION ---

  async scanSlaPendingApprovals() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pending = await this.prisma.approval.findMany({
      where: {
        decision: null,
        requestedAt: { lte: cutoff },
      },
    });

    for (const app of pending) {
      this.logger.warn(`[SLA ESCALATION] Approval ${app.id} pending >24h`);
      this.eventEmitter.emit('notification.sla.escalate', {
        approvalId: app.id,
        governedEntityType: app.governedEntityType,
        governedEntityId: app.governedEntityId,
        requestedAt: app.requestedAt,
        escalationLevel: 1,
      });

      await this.sendToRole('DIRECTOR', {
        title: `🚨 Eskalasi SLA: Approval ${app.governedEntityType} Pending >24 Jam`,
        body: `Persetujuan ${app.governedEntityType} (${app.governedEntityId}) belum diproses lebih dari 24 jam. Mohon ditindaklanjuti.`,
        type: 'SLA_BREACH',
        referenceType: app.governedEntityType,
        referenceId: app.governedEntityId,
      });
    }

    return { scanned: pending.length, escalated: pending.length };
  }
}
