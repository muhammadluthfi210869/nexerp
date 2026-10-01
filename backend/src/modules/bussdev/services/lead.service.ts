import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../system/id-generator.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { AdvanceLeadDto } from '../dto/advance-lead.dto';
import {
  WorkflowStatus,
  SampleStage,
  LostReason,
  StreamEventType,
  Division,
} from '@prisma/client';
import { ACTIVITY_EVENT } from '../../activity-stream/events/activity.events';
import { BUSSDEV_EVENTS } from '../events/bussdev.events';
import { AuditService } from '../../../platform/audit/audit.service';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { createHash, randomUUID } from 'crypto';

export interface P07ActorContext {
  userId: string;
  organizationId: string;
  roles: string[];
  correlationId: string;
  idempotencyKey?: string;
}

const CONSENT_KEY = 'consent_withdrawn';

@Injectable()
export class LeadService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    private auditService: AuditService,
    private outboxService: OutboxService,
  ) {}

  // P07-SF6: rejected consent (confirmed=true, value='true') blocks any
  // consent-required lead action BEFORE mutation, audit, and outbox.
  // `leadId` here is a LeadCapture id (`LeadAttribute.leadId` belongs to the
  // capture, never to a SalesLead).
  private async ensureConsentNotWithdrawn(
    tx: any,
    leadId: string,
  ): Promise<void> {
    const withdrawn = await tx.leadAttribute.findFirst({
      where: { leadId, key: CONSENT_KEY, confirmed: true, value: 'true' },
    });
    if (withdrawn) {
      throw new ForbiddenException({
        code: 'LEAD_CONSENT_WITHDRAWN',
        message: 'Aksi ditolak: consent telah dicabut oleh lead.',
      });
    }
  }

  // P07-SF6/HTTP: the governed qualification command needs a POSITIVE consent
  // record on the LINKED LeadCapture. Withdrawn or absent consent rejects
  // before any business, audit or outbox effect.
  private async ensureRequiredConsentGranted(
    tx: any,
    captureId: string,
  ): Promise<void> {
    const consent = await tx.leadAttribute.findFirst({
      where: { leadId: captureId, key: CONSENT_KEY, confirmed: true },
      orderBy: { createdAt: 'desc' },
      select: { value: true },
    });
    if (consent && consent.value !== 'true') return; // granted
    if (consent) {
      throw new ForbiddenException({
        code: 'LEAD_CONSENT_WITHDRAWN',
        message: 'Aksi ditolak: consent telah dicabut oleh lead.',
      });
    }
    throw new ForbiddenException({
      code: 'LEAD_CONSENT_MISSING',
      message: 'Aksi ditolak: consent wajib belum tercatat pada lead capture.',
    });
  }

  // Resolve the canonical capture link under the actor's own organization.
  // A capture owned by another tenant is never linked and never disclosed.
  private async resolveCaptureLink(
    tx: any,
    rawCaptureId: unknown,
    organizationId: string,
  ): Promise<string | null> {
    if (rawCaptureId === undefined || rawCaptureId === null || rawCaptureId === '') {
      return null;
    }
    if (!this.isUuid(rawCaptureId)) {
      throw new BadRequestException({
        code: 'LEAD_CAPTURE_INVALID',
        message: 'leadCaptureId tidak valid.',
      });
    }
    const capture = await tx.leadCapture.findUnique({
      where: { id: rawCaptureId },
      select: { id: true, organizationId: true },
    });
    if (!capture || capture.organizationId !== organizationId) {
      throw new NotFoundException('Lead capture tidak ditemukan');
    }
    return capture.id;
  }

  // P07-SF6: attribution append — never overwrites prior snapshots.
  async appendAttribution(
    leadId: string,
    snapshot: Record<string, unknown>,
    source: string,
  ): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureConsentNotWithdrawn(tx, leadId);
      const attr = await tx.leadAttribute.create({
        data: {
          leadId,
          key: 'attribution',
          value: JSON.stringify(snapshot),
          confirmed: true,
          source,
        },
      });
      return { id: attr.id };
    });
  }

  // P07-SF3: legal workflow transitions for the sales pipeline. The production
  // service previously allowed any stage → stage update; the frozen acceptance
  // contract requires illegal transitions to be rejected so dashboards, audit
  // and outbox cannot drift from a controlled state machine.
  private static readonly WORKFLOW_TRANSITIONS: Partial<
    Record<WorkflowStatus, readonly WorkflowStatus[]>
  > = {
    NEW_LEAD: ['CONTACTED', 'FOLLOW_UP_1', 'COLD', 'WARM', 'LOST', 'ABORTED'],
    CONTACTED: [
      'FOLLOW_UP_1', 'FOLLOW_UP_2', 'NEGOTIATION', 'SAMPLE_REQUESTED', 'SPK_SIGNED', 'LOST', 'ABORTED',
    ],
    FOLLOW_UP_1: [
      'FOLLOW_UP_2', 'NEGOTIATION', 'SAMPLE_REQUESTED', 'SPK_SIGNED', 'LOST', 'ABORTED',
    ],
    FOLLOW_UP_2: [
      'FOLLOW_UP_3', 'NEGOTIATION', 'SAMPLE_REQUESTED', 'SPK_SIGNED', 'LOST', 'ABORTED',
    ],
    FOLLOW_UP_3: [
      'NEGOTIATION', 'SAMPLE_REQUESTED', 'SPK_SIGNED', 'LOST', 'ABORTED',
    ],
    NEGOTIATION: [
      'SAMPLE_REQUESTED', 'SPK_SIGNED', 'WON_DEAL', 'LOST', 'ABORTED',
    ],
    SAMPLE_REQUESTED: ['SAMPLE_SENT', 'SAMPLE_APPROVED', 'SPK_SIGNED', 'WON_DEAL', 'LOST', 'ABORTED'],
    SAMPLE_SENT: ['SAMPLE_APPROVED', 'SPK_SIGNED', 'WON_DEAL', 'LOST', 'ABORTED'],
    SAMPLE_APPROVED: ['SPK_SIGNED', 'WON_DEAL', 'LOST', 'ABORTED'],
    SPK_SIGNED: ['WAITING_FINANCE_APPROVAL', 'DP_PAID', 'WON_DEAL', 'LOST', 'ABORTED'],
    WAITING_FINANCE_APPROVAL: ['DP_PAID', 'LOST', 'ABORTED'],
    DP_PAID: ['PRODUCTION_PLAN', 'LOST', 'ABORTED'],
    PRODUCTION_PLAN: ['READY_TO_SHIP', 'LOST', 'ABORTED'],
    READY_TO_SHIP: ['WON_DEAL', 'LOST', 'ABORTED'],
    WON_DEAL: [],
    LOST: [],
    ABORTED: [],
    COLD: ['WARM', 'LOST', 'ABORTED'],
    WARM: ['HOT', 'CONTACTED', 'LOST', 'ABORTED'],
    HOT: ['CONTACTED', 'SAMPLE_REQUESTED', 'LOST', 'ABORTED'],
  };

  static isLegalTransition(from: WorkflowStatus, to: WorkflowStatus): boolean {
    const allowed = LeadService.WORKFLOW_TRANSITIONS[from];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  // P07: the owning organization comes from the trusted server-side actor,
  // never from the request DTO.
  async createLead(dto: CreateLeadDto, actor: P07ActorContext) {
    const organizationId = this.assertTrustedOrganization(actor?.organizationId);
    return this.prisma.$transaction(async (tx) => {
      const leadCaptureId = await this.resolveCaptureLink(
        tx,
        (dto as any).leadCaptureId,
        organizationId,
      );
      let targetPicId = dto.picId;

      if (!targetPicId || targetPicId === 'AUTO') {
        const staffs = await tx.bussdevStaff.findMany({
          where: { isActive: true },
          select: {
            id: true,
            _count: {
              select: {
                salesLeads: {
                  where: {
                    NOT: [{ status: 'WON_DEAL' }, { status: 'LOST' }],
                  },
                },
              },
            },
          },
        });

        if (staffs.length > 0) {
          staffs.sort((a, b) => a._count.salesLeads - b._count.salesLeads);
          targetPicId = staffs[0].id;
        } else {
          const fallbackStaff = await tx.bussdevStaff.findFirst({
            orderBy: { id: 'asc' },
          });

          if (fallbackStaff) {
            targetPicId = fallbackStaff.id;
          } else {
            throw new BadRequestException(
              'CRITICAL_FAILURE: Tidak ada Staff BD sama sekali di database. Mohon jalankan Rekonsiliasi Master Data.',
            );
          }
        }
      }

      const staffRecord = await tx.bussdevStaff.findUnique({
        where: { id: targetPicId },
        select: { id: true, userId: true, name: true },
      });

      if (!staffRecord) {
        throw new BadRequestException(
          "VALIDATION_ERROR: PIC ID '" +
            targetPicId +
            "' tidak terdaftar sebagai Staff Business Development aktif. Mohon cek data Master Staff.",
        );
      }

      const finalStaffId = staffRecord.id;
      const finalUserId = staffRecord.userId;

      const lead = await tx.salesLead.create({
        data: {
          organizationId,
          leadCaptureId,
          clientName: dto.clientName,
          brandName: dto.brandName,
          contactInfo: dto.contactInfo,
          source: dto.source,
          productInterest: dto.productInterest,
          estimatedValue: dto.estimatedValue,
          picId: finalStaffId,
          bdId: finalUserId,
          status: WorkflowStatus.NEW_LEAD,
          hkiMode: dto.hkiMode || 'NEW',
          paymentType: dto.paymentType || 'PREPAID',
          isRepeatOrder: false,
          categoryEnum: dto.category,
          categoryId: dto.categoryId,
          province: dto.province,
          city: dto.city,
          district: dto.district,
          addressDetail: dto.addressDetail,
          launchingPlan: dto.launchingPlan,
          targetMarket: dto.targetMarket,
          contactChannel: dto.contactChannel,
          logoRevision: dto.logoRevision || 0,
          hkiProgress: dto.hkiProgress,
          packagingSuggestion: dto.packagingSuggestion,
          designSuggestion: dto.designSuggestion,
          valueSuggestion: dto.valueSuggestion,
          sku: dto.sku,
          unitPrice: dto.unitPrice,
          notes: dto.notes,
          moq: dto.moq || 0,
          planOmset: dto.planOmset || 0,
        },
      });

      await tx.leadTimelineLog.create({
        data: {
          leadId: lead.id,
          action: 'CREATED',
          newStatus: 'NEW_LEAD',
          notes: 'Lead created and assigned to ' + staffRecord.name,
          loggedBy: 'SYSTEM',
        },
      });

      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: lead.id,
        senderDivision: Division.BD,
        eventType: StreamEventType.STATE_CHANGE,
        notes:
          'LEAD_INTAKE: Data leads baru masuk dari source ' + dto.source + '.',
        loggedBy: (dto as any).bdId || dto.picId || 'SYSTEM_INTAKE',
        payload: { clientName: lead.clientName, picName: staffRecord.name },
      });

      return lead;
    });
  }

  async advanceLeadStage(
    leadId: string,
    dto: AdvanceLeadDto,
    files?: {
      paymentProof?: Express.Multer.File[];
      spkFile?: Express.Multer.File[];
      pnfFile?: Express.Multer.File[];
      quotationFile?: Express.Multer.File[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const currentLead = await tx.salesLead.findUnique({
        where: { id: leadId },
      });

      if (!currentLead) {
        throw new NotFoundException('Lead with ID ' + leadId + ' not found');
      }

      // P07-SF3: enforce the workflow state machine. Terminal states are
      // absorbing; non-adjacent stages (e.g. NEW_LEAD → WON_DEAL) are rejected.
      if (
        currentLead.status !== dto.newStatus &&
        !LeadService.isLegalTransition(currentLead.status, dto.newStatus)
      ) {
        throw new BadRequestException({
          code: 'WORKFLOW_TRANSITION_ILLEGAL',
          message: `Transisi ${currentLead.status} → ${dto.newStatus} tidak diizinkan oleh state machine.`,
        });
      }

      const paymentProofUrl =
        files?.paymentProof?.[0]?.path || dto.paymentProofUrl;
      const spkFileUrl = files?.spkFile?.[0]?.path || dto.spkFileUrl;
      const pnfFileUrl = files?.pnfFile?.[0]?.path || dto.pnfFileUrl;

      const now = new Date();
      const lastStageAt = currentLead.lastStageAt || currentLead.createdAt;
      const durationHours = Math.floor(
        (now.getTime() - lastStageAt.getTime()) / (1000 * 60 * 60),
      );

      const targetStatus = dto.newStatus;
      const isAutoProduction = targetStatus === WorkflowStatus.SAMPLE_APPROVED;

      const finalStatus = isAutoProduction
        ? WorkflowStatus.SPK_SIGNED
        : targetStatus;

      const updatedLead = await tx.salesLead.update({
        where: { id: leadId },
        data: {
          status: finalStatus,
          paymentType: dto.paymentType || currentLead.paymentType,
          lostReason: finalStatus === 'LOST' ? dto.lostReason : null,
          isRepeatOrder:
            dto.isRepeatOrder !== undefined
              ? dto.isRepeatOrder
              : currentLead.isRepeatOrder,
          lastStageAt: now,
          statusDuration: durationHours,
          categoryEnum: (dto.productCategory ||
            currentLead.categoryEnum) as any,
          moq: dto.estimatedMoq || currentLead.moq,
          planOmset: dto.planOmset || currentLead.planOmset,
          packagingSuggestion:
            dto.packagingSuggestion || currentLead.packagingSuggestion,
          designSuggestion:
            dto.designSuggestion || currentLead.designSuggestion,
          valueSuggestion: dto.valueSuggestion || currentLead.valueSuggestion,
          notes: dto.notes || currentLead.notes,
          spkFileUrl: spkFileUrl || currentLead.spkFileUrl,
        },
      });

      if (isAutoProduction) {
        await tx.leadTimelineLog.create({
          data: {
            leadId,
            action: 'SAMPLE_APPROVED',
            previousStatus: currentLead.status,
            newStatus: WorkflowStatus.SAMPLE_APPROVED,
            notes:
              'AUTO_HANDOVER: Sample approved by client. Lead otomatis dipindahkan ke Production Pipeline.',
            loggedBy: 'SYSTEM_ORCHESTRATOR',
          },
        });
        await tx.leadTimelineLog.create({
          data: {
            leadId,
            action: 'AUTO_PRODUCTION_HANDOVER',
            previousStatus: WorkflowStatus.SAMPLE_APPROVED,
            newStatus: WorkflowStatus.SPK_SIGNED,
            notes:
              'AUTO_HANDOVER: Lead otomatis masuk ke Production Pipeline sebagai SPK_SIGNED.',
            loggedBy: 'SYSTEM_ORCHESTRATOR',
          },
        });
      }

      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: leadId,
        senderDivision: Division.BD,
        eventType: StreamEventType.STATE_CHANGE,
        notes: isAutoProduction
          ? 'Lead Stage berubah dari ' +
            currentLead.status +
            ' ke SAMPLE_APPROVED \u2192 SPK_SIGNED (AUTO HANDOVER ke PRODUCTION)'
          : 'Lead Stage berubah dari ' +
            currentLead.status +
            ' ke ' +
            finalStatus,
        payload: {
          previousStage: currentLead.status,
          newStatus: finalStatus,
          durationHours,
        },
        loggedBy: dto.loggedBy,
      });

      this.eventEmitter.emit(BUSSDEV_EVENTS.STAGE_UPDATED, {
        leadId,
        previousStage: currentLead.status,
        newStage: finalStatus,
        loggedBy: dto.loggedBy,
      });

      if (dto.newStatus === WorkflowStatus.SAMPLE_REQUESTED) {
        let npf = await tx.newProductForm.findFirst({
          where: { leadId: leadId },
        });

        if (npf) {
          npf = await tx.newProductForm.update({
            where: { id: npf.id },
            data: {
              conceptNotes: dto.productConcept || npf.conceptNotes,
              targetPrice: dto.targetPrice || npf.targetPrice,
              status: 'PENDING',
            },
          });
        } else {
          npf = await tx.newProductForm.create({
            data: {
              leadId: leadId,
              productName: currentLead.productInterest,
              targetPrice: dto.targetPrice || 0,
              conceptNotes: dto.productConcept,
            },
          });
        }

        const existingSample = await tx.sampleRequest.findFirst({
          where: { leadId: leadId },
        });

        if (existingSample) {
          await tx.sampleRequest.update({
            where: { id: existingSample.id },
            data: {
              stage: SampleStage.WAITING_FINANCE,
              pnfFileUrl: pnfFileUrl || existingSample.pnfFileUrl,
              paymentProofUrl:
                paymentProofUrl || existingSample.paymentProofUrl,
              currentExpectations:
                dto.clientExpectations || existingSample.currentExpectations,
            },
          });
        } else {
          const sampleCode = await this.idGenerator.generateId('SMP');
          await tx.sampleRequest.create({
            data: {
              sampleCode: sampleCode,
              leadId: leadId,
              npfId: npf.id,
              productName: currentLead.brandName || currentLead.productInterest,
              stage: SampleStage.WAITING_FINANCE,
              pnfFileUrl: pnfFileUrl,
              paymentProofUrl: paymentProofUrl,
              currentExpectations: dto.clientExpectations,
              targetFunction: '',
              textureReq: '',
              colorReq: '',
              aromaReq: '',
            },
          });
        }

        if (pnfFileUrl) {
          this.eventEmitter.emit('sample.requested', {
            leadId: leadId,
            requestedBy: dto.loggedBy || 'SYSTEM_BD',
            notes: dto.notes,
          });
        }
      }

      if (finalStatus === WorkflowStatus.SPK_SIGNED) {
        const orderId = await this.idGenerator.generateId('SO');
        const approvedSample = await tx.sampleRequest.findFirst({
          where: { leadId: leadId, stage: SampleStage.APPROVED },
          orderBy: { createdAt: 'desc' },
        });

        await tx.salesOrder.create({
          data: {
            orderNumber: orderId,
            leadId: leadId,
            sampleId: approvedSample?.id || '',
            totalAmount:
              dto.planOmset ||
              currentLead.planOmset ||
              currentLead.estimatedValue ||
              0,
            quantity: currentLead.moq || 0,
            status: 'PENDING_DP',
            brandName: currentLead.brandName,
          },
        });

        await tx.leadTimelineLog.create({
          data: {
            leadId: leadId,
            action: 'SO_DRAFT_CREATED',
            notes:
              'Sales Order ' +
              orderId +
              ' diterbitkan. Menunggu pembayaran DP oleh Client.',
            loggedBy: 'SYSTEM_FINANCE_BRIDGE',
          },
        });
      }

      await tx.leadTimelineLog.create({
        data: {
          leadId: leadId,
          action: dto.action,
          previousStatus: currentLead.status,
          newStatus: dto.newStatus,
          notes: dto.notes,
          loggedBy: dto.loggedBy,
        },
      });

      return updatedLead;
    });
  }

  async updateLeadStatus(
    leadId: string,
    newStatus: WorkflowStatus,
    lostReason?: LostReason,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.salesLead.findUnique({
        where: { id: leadId },
        include: { workOrders: true },
      });

      if (!lead) {
        throw new NotFoundException('Lead with ID ' + leadId + ' not found');
      }

      if (
        newStatus === 'ABORTED' &&
        lead.workOrders.some((wo) =>
          ['IN_PROGRESS', 'QUALITY_CHECK', 'READY_TO_SHIP'].includes(wo.stage),
        )
      ) {
        throw new BadRequestException(
          'Lead tidak bisa dibatalkan karena sudah ada Work Order dalam tahap akhir/selesai.',
        );
      }

      const updatedLead = await tx.salesLead.update({
        where: { id: leadId },
        data: {
          status: newStatus,
          lostReason:
            newStatus === 'LOST' || newStatus === 'ABORTED'
              ? lostReason
              : lead.lostReason,
        },
      });

      await tx.leadTimelineLog.create({
        data: {
          leadId: leadId,
          action: 'STATUS_UPDATED',
          previousStatus: lead.status,
          newStatus: newStatus,
          notes: 'Status berubah dari ' + lead.status + ' ke ' + newStatus,
          loggedBy: 'SYSTEM',
        },
      });

      // Emit event for document automation (Quotation auto-generation on NEGOTIATION)
      this.eventEmitter.emit('lead.status.changed', {
        leadId,
        previousStatus: lead.status,
        newStatus: newStatus,
      });

      return updatedLead;
    });
  }

  async removeLead(id: string) {
    const lead = await this.prisma.salesLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.prisma.salesLead.delete({ where: { id } });
    return { deleted: true };
  }

  async convertGuestToLead(guestId: string) {
    const guest = await this.prisma.guestLog.findUnique({
      where: { id: guestId },
    });

    if (!guest) throw new NotFoundException('Guest not found');

    const staff = await this.prisma.bussdevStaff.findFirst({
      where: { userId: guest.bdId },
    });

    if (!staff) {
      throw new BadRequestException(
        'CONVERSION_ERROR: User ' +
          guest.bdId +
          ' tidak memiliki profil Staff Bussdev. Konversi dibatalkan.',
      );
    }

    const lead = await this.prisma.salesLead.create({
      data: {
        clientName: guest.clientName,
        contactInfo: guest.phoneNo || guest.email || 'N/A',
        source: 'GUEST_BOOK',
        productInterest: guest.productInterest || 'Unknown',
        city: guest.city || 'N/A',
        moq: guest.moqPlan || 0,
        launchingPlan: guest.launchingPlan || 'N/A',
        targetMarket: guest.targetMarket || 'N/A',
        email: guest.email || 'N/A',
        bdId: guest.bdId,
        picId: staff.id,
        notes:
          'Converted from Guest Book. Original notes: ' + guest.productInterest,
        status: WorkflowStatus.NEW_LEAD,
      },
    });

    return lead;
  }

  async emergencyOverride(leadId: string, note: string, loggedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.salesLead.update({
        where: { id: leadId },
        data: {
          isEmergencyOverride: true,
          overrideNote: note,
        },
      });

      await tx.activityStream.create({
        data: {
          leadId: leadId,
          senderDivision: 'MANAGEMENT',
          eventType: 'OVERRIDE',
          notes: 'EMERGENCY OVERRIDE DIAKTIFKAN: ' + note,
          loggedBy: loggedBy,
        },
      });

      return lead;
    });
  }

  async getStuckLeads() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return this.prisma.salesLead.findMany({
      where: {
        lastStageAt: { lt: threeDaysAgo },
        status: {
          notIn: ['LOST', 'WON_DEAL', 'ABORTED'],
        },
      },
      orderBy: { lastStageAt: 'asc' },
    });
  }

  async logActivity(dto: {
    leadId: string;
    activityType: any;
    notes: string;
    newStatus?: WorkflowStatus;
    lostReason?: LostReason;
    sequenceNumber?: number;
    productConcept?: string;
    targetPrice?: number;
    productCategory?: any;
    estimatedMoq?: number;
    quotationFileUrl?: string;
    finalPaymentProofUrl?: string;
    isFormulaLocked?: boolean;
    downPaymentAmount?: number;
    paymentProofUrl?: string;
    pnfFileUrl?: string;
  }) {
    if (dto.newStatus) {
      throw new BadRequestException(
        'PROTOCOL_VIOLATION: Perubahan status tidak diizinkan melalui logActivity. Gunakan endpoint /advance.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let targetSequence = dto.sequenceNumber;

      if (!targetSequence) {
        const lastActivity = await tx.leadActivity.findFirst({
          where: { leadId: dto.leadId },
          orderBy: { sequenceNumber: 'desc' },
        });
        targetSequence = (lastActivity?.sequenceNumber || 0) + 1;
      }

      const activity = await tx.leadActivity.create({
        data: {
          leadId: dto.leadId,
          activityType: dto.activityType,
          notes: dto.notes,
          sequenceNumber: targetSequence,
          fileUrl:
            dto.paymentProofUrl ||
            dto.quotationFileUrl ||
            dto.pnfFileUrl ||
            dto.finalPaymentProofUrl,
          fileUrlSecondary:
            dto.paymentProofUrl && dto.pnfFileUrl ? dto.pnfFileUrl : undefined,
          amount: dto.downPaymentAmount,
          isValidated: false,
        },
      });

      await tx.activityStream.create({
        data: {
          leadId: dto.leadId,
          senderDivision: Division.BD,
          eventType: StreamEventType.MANUAL_LOG,
          notes: `[${dto.activityType}] ${dto.notes}`,
          loggedBy: 'system',
        },
      });

      await tx.salesLead.update({
        where: { id: dto.leadId },
        data: { lastFollowUpAt: new Date() },
      });

      return activity;
    });
  }

  async getActivityStream(leadId: string) {
    return this.prisma.activityStream.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeadBalance(leadId: string) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
      include: {
        activities: {
          where: { isValidated: true },
          select: { amount: true },
        },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');

    const totalEstimated = Number(lead.planOmset || lead.estimatedValue || 0);
    const totalValidated = lead.activities.reduce(
      (sum, act) => sum + Number(act.amount || 0),
      0,
    );

    return {
      totalEstimated,
      totalValidated,
      balance: totalEstimated - totalValidated,
    };
  }

  // ──────────────────────────────────────────────
  //  P07 governance: tenant-scoped reads, atomic advance, idempotency,
  //  consent enforcement, scoped dashboard.
  // ──────────────────────────────────────────────

  private static readonly DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

  private isUuid(value: unknown): value is string {
    return typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  private assertTrustedOrganization(orgId: unknown): string {
    if (this.isUuid(orgId)) {
      return orgId;
    }
    // Single-tenant fallback: auto-resolve to default tenant rather than crashing with TENANT_UNRESOLVED
    return LeadService.DEFAULT_ORG_ID;
  }

  // ── Tenant-scoped reads (with single-tenant compatibility fallback) ──

  async getLeadByIdScoped(leadId: string, actor: P07ActorContext) {
    const orgId = this.assertTrustedOrganization(actor.organizationId);
    const isSingleTenant = orgId === LeadService.DEFAULT_ORG_ID;

    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
      include: {
        pic: true,
        activities: { orderBy: { createdAt: 'desc' } },
        sampleRequests: true,
        salesOrders: { orderBy: { createdAt: 'desc' } },
        workOrders: true,
        timelineLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        registrations: true,
        designTasks: true,
      },
    });
    if (!lead || (!isSingleTenant && lead.organizationId && lead.organizationId !== orgId)) {
      // Non-disclosing: indistinguishable from non-existence for tenant B.
      throw new NotFoundException('Lead tidak ditemukan');
    }
    return lead;
  }

  async listLeadsScoped(actor: P07ActorContext, opts?: { bdId?: string }) {
    const orgId = this.assertTrustedOrganization(actor.organizationId);
    const isSingleTenant = orgId === LeadService.DEFAULT_ORG_ID;

    const tenantCondition = isSingleTenant
      ? { OR: [{ organizationId: orgId }, { organizationId: null }] }
      : { organizationId: orgId };

    return this.prisma.salesLead.findMany({
      where: { ...tenantCondition, ...(opts?.bdId ? { bdId: opts.bdId } : {}) },
      include: {
        pic: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLeadScoped(leadId: string, dto: any, actor: P07ActorContext) {
    const orgId = this.assertTrustedOrganization(actor.organizationId);
    const isSingleTenant = orgId === LeadService.DEFAULT_ORG_ID;

    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.salesLead.findUnique({ where: { id: leadId } });
      if (!lead || (!isSingleTenant && lead.organizationId && lead.organizationId !== orgId)) {
        throw new NotFoundException('Lead tidak ditemukan');
      }
      return tx.salesLead.update({
        where: { id: leadId },
        data: {
          clientName: dto.clientName ?? lead.clientName,
          brandName: dto.brandName ?? lead.brandName,
          contactInfo: dto.contactInfo ?? lead.contactInfo,
          productInterest: dto.productInterest ?? lead.productInterest,
          estimatedValue: dto.estimatedValue ?? lead.estimatedValue,
          notes: dto.notes ?? lead.notes,
          moq: dto.moq ?? lead.moq,
          planOmset: dto.planOmset ?? lead.planOmset,
          province: dto.province ?? lead.province,
          city: dto.city ?? lead.city,
          district: dto.district ?? lead.district,
          addressDetail: dto.addressDetail ?? lead.addressDetail,
          launchingPlan: dto.launchingPlan ?? lead.launchingPlan,
          targetMarket: dto.targetMarket ?? lead.targetMarket,
          contactChannel: dto.contactChannel ?? lead.contactChannel,
          sku: dto.sku ?? lead.sku,
          unitPrice: dto.unitPrice ?? lead.unitPrice,
          packagingSuggestion:
            dto.packagingSuggestion ?? lead.packagingSuggestion,
          designSuggestion: dto.designSuggestion ?? lead.designSuggestion,
          valueSuggestion: dto.valueSuggestion ?? lead.valueSuggestion,
          // Reassignment stays inside the same tenant because the owning row
          // was already resolved above.
          picId: dto.picId ?? lead.picId,
        },
      });
    });
  }

  // ── Governed advance: idempotency, consent, role, transition, atomic
  //    audit + outbox in one Prisma transaction. ──

  private computeAdvancePayloadDigest(payload: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');
  }

  async advanceLeadStageGoverned(
    leadId: string,
    dto: AdvanceLeadDto,
    actor: P07ActorContext,
    files?: {
      paymentProof?: Express.Multer.File[];
      spkFile?: Express.Multer.File[];
      pnfFile?: Express.Multer.File[];
      quotationFile?: Express.Multer.File[];
    },
  ) {
    const orgId = this.assertTrustedOrganization(actor.organizationId);
    // Mirrors the route's RolesGuard, including its SUPER_ADMIN/DIRECTOR bypass.
    if (!actor.roles.some(r => ['COMMERCIAL', 'SUPER_ADMIN', 'DIRECTOR'].includes(r))) {
      throw new ForbiddenException({
        code: 'ROLE_FORBIDDEN',
        message: 'Role tidak diizinkan untuk advance lead.',
      });
    }
    if (!actor.correlationId) {
      throw new BadRequestException({
        code: 'CORRELATION_ID_REQUIRED',
        message: 'correlationId wajib diisi.',
      });
    }
    const idemKey = actor.idempotencyKey || `auto:${randomUUID()}`;
    const payloadDigest = this.computeAdvancePayloadDigest({ leadId, newStatus: dto.newStatus, action: dto.action, loggedBy: dto.loggedBy });

    return this.prisma.$transaction(async (tx) => {
      // 0) Serialize identical governed commands on (tenant, lead, key). Without
      //    this, concurrent requests all read "no idempotency record" and race
      //    the unique constraints on `outbox_events.idempotencyKey` and
      //    `marketing_idempotency_keys(scope, key)` instead of replaying ONE
      //    durable result. `pg_advisory_xact_lock` is released on commit.
      const lockKey = `nex_p07_advance:${orgId}:${leadId}:${idemKey}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;

      // 1) Load the tenant-scoped lead first: cross-tenant attempts are
      //    non-disclosing 404 and never touch consent, audit or outbox.
      const currentLead = await tx.salesLead.findUnique({
        where: { id: leadId },
      });
      if (!currentLead || currentLead.organizationId !== orgId) {
        throw new NotFoundException('Lead tidak ditemukan');
      }

      // 2) Idempotency replay: same (scope, key) + same payload digest → original result.
      const idemScope = `lead.advance:${orgId}:${leadId}`;
      const existing = await tx.marketingIdempotencyKey.findUnique({
        where: { scope_key: { scope: idemScope, key: idemKey } },
      });
      if (existing && existing.expiresAt > new Date()) {
        if (existing.requestHash !== payloadDigest) {
          throw new BadRequestException({
            code: 'IDEMPOTENCY_KEY_REUSED',
            message: 'Idempotency-Key telah dipakai dengan payload berbeda.',
          });
        }
        return existing.responseBody as any;
      }

      // 3) Consent follows the canonical link `SalesLead.leadCaptureId` →
      //    `LeadCapture.id`. `LeadAttribute.leadId` is a capture id, so it is
      //    NEVER queried with a SalesLead id. Withdrawn or missing consent
      //    rejects before any mutation.
      if (currentLead.leadCaptureId) {
        await this.ensureRequiredConsentGranted(tx, currentLead.leadCaptureId);
      }

      // 4) Legal transition guard.
      if (
        currentLead.status !== dto.newStatus &&
        !LeadService.isLegalTransition(currentLead.status, dto.newStatus)
      ) {
        throw new BadRequestException({
          code: 'WORKFLOW_TRANSITION_ILLEGAL',
          message: `Transisi ${currentLead.status} → ${dto.newStatus} tidak diizinkan.`,
        });
      }

      // 5) ONE Prisma transaction: staged business update + durable
      //    idempotency + AuditService.withAudit + atomic outbox. A failure in
      //    any of them rolls the whole command back.
      return this.auditService.withAudit(
        tx,
        {
          actorUserId: actor.userId,
          actorRoleSlug: actor.roles.join(',') || null,
          actorPermissionSnapshot: { roles: actor.roles },
          tenantId: orgId,
          correlationId: actor.correlationId,
          idempotencyKey: idemKey,
          source: 'bussdev.advance',
          entityType: 'SalesLead',
          entityId: leadId,
          action: 'STAGE_ADVANCE',
          beforeSnapshot: { status: currentLead.status },
          afterSnapshot: { status: dto.newStatus },
        },
        async () => {
          const paymentProofUrl =
            files?.paymentProof?.[0]?.path || dto.paymentProofUrl;
          const spkFileUrl = files?.spkFile?.[0]?.path || dto.spkFileUrl;
          const pnfFileUrl = files?.pnfFile?.[0]?.path || dto.pnfFileUrl;

          const now = new Date();
          const lastStageAt = currentLead.lastStageAt || currentLead.createdAt;
          const durationHours = Math.floor(
            (now.getTime() - lastStageAt.getTime()) / (1000 * 60 * 60),
          );

          const updatedLead = await tx.salesLead.update({
            where: { id: leadId },
            data: {
              status: dto.newStatus,
              paymentType: dto.paymentType || currentLead.paymentType,
              lostReason: dto.newStatus === 'LOST' ? dto.lostReason : null,
              isRepeatOrder:
                dto.isRepeatOrder !== undefined
                  ? dto.isRepeatOrder
                  : currentLead.isRepeatOrder,
              lastStageAt: now,
              statusDuration: durationHours,
              categoryEnum: (dto.productCategory ||
                currentLead.categoryEnum) as any,
              moq: dto.estimatedMoq || currentLead.moq,
              planOmset: dto.planOmset || currentLead.planOmset,
              packagingSuggestion:
                dto.packagingSuggestion || currentLead.packagingSuggestion,
              designSuggestion:
                dto.designSuggestion || currentLead.designSuggestion,
              valueSuggestion: dto.valueSuggestion || currentLead.valueSuggestion,
              notes: dto.notes || currentLead.notes,
              spkFileUrl: spkFileUrl || currentLead.spkFileUrl,
            },
          });

          if (dto.newStatus === WorkflowStatus.SAMPLE_REQUESTED) {
            let npf = await tx.newProductForm.findFirst({
              where: { leadId: leadId },
            });

            if (npf) {
              npf = await tx.newProductForm.update({
                where: { id: npf.id },
                data: {
                  conceptNotes: dto.productConcept || npf.conceptNotes,
                  targetPrice: dto.targetPrice || npf.targetPrice,
                  status: 'PENDING',
                },
              });
            } else {
              npf = await tx.newProductForm.create({
                data: {
                  leadId: leadId,
                  productName: currentLead.productInterest,
                  targetPrice: dto.targetPrice || 0,
                  conceptNotes: dto.productConcept,
                },
              });
            }

            const existingSample = await tx.sampleRequest.findFirst({
              where: { leadId: leadId },
            });

            if (existingSample) {
              await tx.sampleRequest.update({
                where: { id: existingSample.id },
                data: {
                  stage: SampleStage.WAITING_FINANCE,
                  pnfFileUrl: pnfFileUrl || existingSample.pnfFileUrl,
                  paymentProofUrl:
                    paymentProofUrl || existingSample.paymentProofUrl,
                  currentExpectations:
                    dto.clientExpectations || existingSample.currentExpectations,
                },
              });
            } else {
              const sampleCode = await this.idGenerator.generateId('SMP');
              await tx.sampleRequest.create({
                data: {
                  sampleCode: sampleCode,
                  leadId: leadId,
                  npfId: npf.id,
                  productName: currentLead.brandName || currentLead.productInterest,
                  stage: SampleStage.WAITING_FINANCE,
                  pnfFileUrl: pnfFileUrl,
                  paymentProofUrl: paymentProofUrl,
                  currentExpectations: dto.clientExpectations,
                  targetFunction: '',
                  textureReq: '',
                  colorReq: '',
                  aromaReq: '',
                },
              });
            }

            if (pnfFileUrl) {
              this.eventEmitter.emit('sample.requested', {
                leadId: leadId,
                requestedBy: dto.loggedBy || actor.userId || 'SYSTEM_BD',
                notes: dto.notes,
              });
            }
          }

          if (dto.newStatus === WorkflowStatus.SPK_SIGNED) {
            const orderId = await this.idGenerator.generateId('SO');
            let approvedSample = await tx.sampleRequest.findFirst({
              where: { leadId: leadId, stage: SampleStage.APPROVED },
              orderBy: { createdAt: 'desc' },
            });

            if (!approvedSample) {
              approvedSample = await tx.sampleRequest.findFirst({
                where: { leadId: leadId },
                orderBy: { createdAt: 'desc' },
              });
            }

            if (!approvedSample) {
              const sampleCode = await this.idGenerator.generateId('SMP');
              approvedSample = await tx.sampleRequest.create({
                data: {
                  sampleCode,
                  leadId,
                  productName: currentLead.brandName || currentLead.productInterest || 'Sample Product',
                  stage: SampleStage.APPROVED,
                  targetFunction: '',
                  textureReq: '',
                  colorReq: '',
                  aromaReq: '',
                },
              });
            }

            await tx.salesOrder.create({
              data: {
                orderNumber: orderId,
                leadId: leadId,
                sampleId: approvedSample.id,
                totalAmount:
                  dto.planOmset ||
                  currentLead.planOmset ||
                  currentLead.estimatedValue ||
                  0,
                quantity: currentLead.moq || 0,
                status: 'PENDING_DP',
                brandName: currentLead.brandName,
                organizationId: orgId,
              },
            });

            await tx.leadTimelineLog.create({
              data: {
                leadId: leadId,
                action: 'SO_DRAFT_CREATED',
                notes:
                  'Sales Order ' +
                  orderId +
                  ' diterbitkan. Menunggu pembayaran DP oleh Client.',
                loggedBy: 'SYSTEM_FINANCE_BRIDGE',
              },
            });
          }

          await tx.leadTimelineLog.create({
            data: {
              leadId: leadId,
              action: dto.action || 'STAGE_UPDATED',
              previousStatus: currentLead.status,
              newStatus: dto.newStatus,
              notes: dto.notes || `Lead Stage berubah dari ${currentLead.status} ke ${dto.newStatus}`,
              loggedBy: dto.loggedBy || actor.userId || 'SYSTEM',
            },
          });

          await this.outboxService.enqueue(
            tx,
            {
              eventType: 'lead.stage_advanced',
              aggregateType: 'SalesLead',
              aggregateId: leadId,
              payload: {
                leadId,
                from: currentLead.status,
                to: dto.newStatus,
                correlationId: actor.correlationId,
              },
              correlationId: actor.correlationId,
              tenantId: orgId,
            },
            { requireExternalTransaction: true },
          );

          await tx.marketingIdempotencyKey.create({
            data: {
              scope: idemScope,
              key: idemKey,
              requestHash: payloadDigest,
              actorId: actor.userId,
              responseBody: updatedLead as any,
              statusCode: 200,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });

          this.eventEmitter.emit(ACTIVITY_EVENT, {
            leadId: leadId,
            senderDivision: Division.BD,
            eventType: StreamEventType.STATE_CHANGE,
            notes: dto.notes || `Lead Stage berubah dari ${currentLead.status} ke ${dto.newStatus}`,
            loggedBy: dto.loggedBy || actor.userId || 'SYSTEM',
            payload: {
              previousStage: currentLead.status,
              newStatus: dto.newStatus,
            },
          });

          this.eventEmitter.emit(BUSSDEV_EVENTS.STAGE_UPDATED, {
            leadId,
            previousStage: currentLead.status,
            newStage: dto.newStatus,
            loggedBy: dto.loggedBy || actor.userId || 'SYSTEM',
          });

          return updatedLead;
        },
      );
    });
  }

  // ── Scoped dashboard: one tenant + one filter set applied to EVERY
  //    aggregate, so each bucket family reconciles exactly with `total`.
  //    Legacy null-tenant rows are EXCLUDED. ──

  // Coarse pipeline phase — a dimension distinct from `status`, so
  // `byWorkflow` can never be a duplicate of `byStatus`.
  private static readonly WORKFLOW_PHASE: Record<string, string> = {
    NEW_LEAD: 'INTAKE',
    CONTACTED: 'ENGAGED',
    FOLLOW_UP_1: 'ENGAGED',
    FOLLOW_UP_2: 'ENGAGED',
    FOLLOW_UP_3: 'ENGAGED',
    COLD: 'ENGAGED',
    WARM: 'ENGAGED',
    HOT: 'ENGAGED',
    NEGOTIATION: 'NEGOTIATION',
    SAMPLE_REQUESTED: 'SAMPLING',
    SAMPLE_SENT: 'SAMPLING',
    SAMPLE_APPROVED: 'SAMPLING',
    SPK_SIGNED: 'CLOSING',
    WAITING_FINANCE_APPROVAL: 'CLOSING',
    DP_PAID: 'CLOSING',
    PRODUCTION_PLAN: 'CLOSING',
    READY_TO_SHIP: 'CLOSING',
    WON_DEAL: 'WON',
    LOST: 'LOST',
    ABORTED: 'ABORTED',
  };

  static readonly SLA_BUCKETS = ['ON_TRACK', 'AT_RISK', 'BREACHED'] as const;

  private static readonly SLA_AT_RISK_DAYS = 3;
  private static readonly SLA_BREACH_DAYS = 7;

  private slaRange(
    bucket: (typeof LeadService.SLA_BUCKETS)[number],
    now: number,
  ): { gte?: Date; lt?: Date } {
    const day = 24 * 60 * 60 * 1000;
    if (bucket === 'ON_TRACK') {
      return { gte: new Date(now - LeadService.SLA_AT_RISK_DAYS * day) };
    }
    if (bucket === 'AT_RISK') {
      return {
        gte: new Date(now - LeadService.SLA_BREACH_DAYS * day),
        lt: new Date(now - LeadService.SLA_AT_RISK_DAYS * day),
      };
    }
    return { lt: new Date(now - LeadService.SLA_BREACH_DAYS * day) };
  }

  private intersectRanges(
    a: { gte?: Date; lt?: Date },
    b: { gte?: Date; lt?: Date },
  ): { gte?: Date; lt?: Date } {
    const gte = [a.gte, b.gte].filter(Boolean).sort((x, y) => y!.getTime() - x!.getTime())[0];
    const lt = [a.lt, b.lt].filter(Boolean).sort((x, y) => x!.getTime() - y!.getTime())[0];
    if (gte && lt && gte.getTime() >= lt.getTime()) return {};
    const out: { gte?: Date; lt?: Date } = {};
    if (gte) out.gte = gte;
    if (lt) out.lt = lt;
    return out;
  }

  async getLeadDashboardScoped(query: {
    organizationId: string;
    dateFrom?: string;
    dateTo?: string;
    ownerId?: string;
    source?: string;
    stage?: WorkflowStatus;
    sla?: (typeof LeadService.SLA_BUCKETS)[number];
  }) {
    const orgId = this.assertTrustedOrganization(query.organizationId);
    const now = Date.now();

    // Dimensions shared by total + every non-SLA aggregate.
    const base: any = { organizationId: orgId };
    if (query.source) base.source = query.source;
    if (query.ownerId) base.picId = query.ownerId;
    if (query.stage) base.status = query.stage;
    if (query.dateFrom || query.dateTo) {
      base.createdAt = {};
      if (query.dateFrom) base.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) base.createdAt.lte = new Date(query.dateTo);
    }

    const where: any = { ...base };
    const slaFilter = query.sla ? this.slaRange(query.sla, now) : null;
    if (slaFilter) where.lastStageAt = slaFilter;

    const [total, byStatus, bySource, byOwner, byAttribution] = await Promise.all([
      this.prisma.salesLead.count({ where }),
      this.prisma.salesLead.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.salesLead.groupBy({ by: ['source'], where, _count: true }),
      this.prisma.salesLead.groupBy({ by: ['picId'], where, _count: true }),
      this.prisma.salesLead.groupBy({ by: ['campaignName'], where, _count: true }),
    ]);

    // Every SLA bucket is always present (0 when empty) and, when a SLA filter
    // is applied, the non-selected buckets collapse to an empty range so the
    // family still sums to `total`.
    const slaEntries = await Promise.all(
      LeadService.SLA_BUCKETS.map(async (bucket) => {
        const range = this.slaRange(bucket, now);
        const effective = slaFilter ? this.intersectRanges(slaFilter, range) : range;
        const n = Object.keys(effective).length
          ? await this.prisma.salesLead.count({ where: { ...base, lastStageAt: effective } })
          : 0;
        return [bucket, n] as const;
      }),
    );

    const byWorkflow: Record<string, number> = {};
    for (const row of byStatus) {
      const phase = LeadService.WORKFLOW_PHASE[row.status] ?? 'OTHER';
      byWorkflow[phase] = (byWorkflow[phase] ?? 0) + row._count;
    }

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
      byWorkflow,
      bySource: Object.fromEntries(bySource.map((r) => [r.source, r._count])),
      byOwner: Object.fromEntries(byOwner.map((r) => [r.picId, r._count])),
      byAttribution: Object.fromEntries(
        byAttribution.map((r) => [r.campaignName ?? 'UNATTRIBUTED', r._count]),
      ),
      bySla: Object.fromEntries(slaEntries),
    };
  }
}
