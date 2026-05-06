import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  BUSSDEV_EVENTS,
  BussdevStageUpdatedEvent,
} from './events/bussdev.events';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { ACTIVITY_EVENT } from '../activity-stream/events/activity.events';
import { Division, StreamEventType, WorkflowStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BussdevListener {
  private readonly logger = new Logger(BussdevListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent(BUSSDEV_EVENTS.STAGE_UPDATED)
  async handleStageUpdated(event: BussdevStageUpdatedEvent) {
    this.logger.log(
      `[EVENT] Stage Updated for Lead ${event.leadId}: ${event.previousStage} -> ${event.newStage}`,
    );

    // 3.1 APJ & Designer Registration (Trigger: SPK_SIGNED)
    if (event.newStage === WorkflowStatus.SPK_SIGNED) {
      await this.handleDealHandover(event.leadId, event.loggedBy);
    }
  }

  private async handleDealHandover(leadId: string, loggedBy: string) {
    try {
      const lead = await this.prisma.salesLead.findUnique({
        where: { id: leadId },
      });

      if (!lead) return;

      // 1. Auto-create Design Task
      await this.prisma.designTask.create({
        data: {
          leadId: leadId,
          brief: `Automatic design request for deal: ${lead.clientName}. Product: ${lead.productInterest}`,
        },
      });

      // 2. Auto-create Legality Request (Regulatory Pipeline)
      await this.prisma.regulatoryPipeline.create({
        data: {
          leadId: leadId,
          type: 'BPOM',
          currentStage: 'DRAFT',
          legalPicId: lead.picId, // Temporary: Assigning to the same PIC for now as fallback
        },
      });

      this.logger.log(
        `[HANDOVER] Created Design Task and Legality Request for Lead ${leadId}`,
      );

      // Notify via Activity Stream
      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId,
        senderDivision: Division.BD,
        eventType: StreamEventType.HANDOVER,
        notes: 'Deal Verified. APJ & Designer notified automatically.',
        loggedBy: 'SYSTEM',
      });

      // 5.1 Parallel Notification Bridge (Handover)
      const baseMsg = {
        title: 'Deal Baru',
        type: 'HANDOVER' as const,
        referenceType: 'lead',
        referenceId: leadId,
      };
      await this.notificationService.sendToDivision('BD', {
        ...baseMsg,
        body: `Deal Baru: ${lead.clientName}. Segera siapkan Sample Request.`,
      });
      await this.notificationService.sendToDivision('CREATIVE', {
        ...baseMsg,
        body: `Design Task Otomatis: ${lead.clientName}. Brief tersedia.`,
      });
      await this.notificationService.sendToDivision('LEGAL', {
        ...baseMsg,
        body: `Pendaftaran APJ: ${lead.clientName}. Segera proses dokumen.`,
      });
    } catch (error: any) {
      this.logger.error(`Handover failed: ${error.message}`);
    }
  }

  @OnEvent(BUSSDEV_EVENTS.PAYMENT_VALIDATED)
  async handlePaymentValidated(event: {
    leadId: string;
    amount: number;
    verifiedBy: string;
  }) {
    this.logger.log(
      `[EVENT] Payment Validated for Lead ${event.leadId}. Amount: ${event.amount}`,
    );

    // 3.2 Finance Payment Hook (Production Advance)
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: event.leadId },
    });

    if (!lead) return;

    const totalEstimated = Number(lead.planOmset || lead.estimatedValue || 0);
    const validatedActivities = await this.prisma.leadActivity.findMany({
      where: { leadId: event.leadId, isValidated: true },
    });

    const totalPaid = validatedActivities.reduce(
      (sum, act) => sum + Number(act.amount || 0),
      0,
    );

    if (totalPaid >= totalEstimated * 0.5) {
      // Advance to Production Process
      if (
        lead.status !== WorkflowStatus.PRODUCTION_PLAN &&
        lead.status !== WorkflowStatus.WON_DEAL
      ) {
        await this.prisma.salesLead.update({
          where: { id: event.leadId },
          data: { status: WorkflowStatus.PRODUCTION_PLAN },
        });

        this.logger.log(
          `[AUTO-ADVANCE] Lead ${event.leadId} moved to PRODUCTION_PROCESS (50% DP reached)`,
        );

        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: event.leadId,
          senderDivision: Division.FINANCE,
          eventType: StreamEventType.STATE_CHANGE,
          notes: 'AUTO-TRIGGER: DP 50% Tercapai. Gerbang Produksi Dibuka.',
          loggedBy: 'SYSTEM',
        });

        // 5.2 Parallel Notification Bridge (Gate Unlocked)
        const gateMsg = {
          title: 'Gate 2 Terbuka',
          type: 'GATE_OPENED' as const,
          referenceType: 'lead',
          referenceId: event.leadId,
        };
        await this.notificationService.sendToDivision('PRODUCTION', {
          ...gateMsg,
          body: `PRODUKSI DIMULAI: Lead ${lead.clientName} telah tervalidasi DP 50%.`,
        });
        await this.notificationService.sendToDivision('SCM', {
          ...gateMsg,
          body: `PENGADAAN MATERIAL: Lead ${lead.clientName} siap diproduksi. Cek ketersediaan stok.`,
        });
      }
    }
  }

  @OnEvent(BUSSDEV_EVENTS.ORDER_SHIPPED)
  async handleOrderShipped(event: { leadId: string; orderId: string }) {
    this.logger.log(`[EVENT] Order Shipped for Lead ${event.leadId}`);

    // 3.3 Warehouse Notification (Trigger: COMPLETED_WON)
    await this.prisma.salesLead.update({
      where: { id: event.leadId },
      data: {
        status: WorkflowStatus.WON_DEAL,
        wonAt: new Date(),
      },
    });

    // Update staff metrics (simplified)
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: event.leadId },
    });
    if (lead?.picId) {
      await this.prisma.bussdevStaff.update({
        where: { id: lead.picId },
        data: {
          totalWon: { increment: 1 },
        },
      });
    }

    this.eventEmitter.emit(ACTIVITY_EVENT, {
      leadId: event.leadId,
      senderDivision: Division.WAREHOUSE,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'ORDER SHIPPED: Lead marked as WON DEAL.',
      loggedBy: 'SYSTEM',
    });

    // 5.3 Parallel Notification Bridge (Closing)
    await this.notificationService.sendToDivision('MANAGEMENT', {
      title: 'Selesai — Won Deal',
      body: `SALES WIN! Lead ${lead?.clientName} telah selesai dikirim. Target Tercapai.`,
      type: 'GATE_OPENED',
      referenceType: 'lead',
      referenceId: event.leadId,
    });
  }

  @OnEvent(BUSSDEV_EVENTS.FORMULA_LOCKED)
  handleFormulaLocked(event: any) {
    this.logger.log(`[EVENT] Formula Locked for Lead ${event.leadId}.`);
  }
}
