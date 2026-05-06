import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';

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

  constructor(private prisma: PrismaService) {}

  // --- IN-APP NOTIFICATION (DB) ---

  async sendInApp(userId: string, message: NotificationMessage): Promise<void> {
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
    this.logger.log(`[WA] Sending to ${to}: ${message}`);
  }

  async sendEmail(to: string, subject: string, body: string) {
    // TODO: Integrate with Nodemailer / SendGrid
    this.logger.log(`[EMAIL] Sending to ${to} | Subject: ${subject}`);
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

  // --- QUERIES ---

  async getUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string) {
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
}
