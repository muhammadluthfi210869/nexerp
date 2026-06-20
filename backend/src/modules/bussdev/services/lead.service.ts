import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../system/id-generator.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { AdvanceLeadDto } from '../dto/advance-lead.dto';
import {
  WorkflowStatus,
  SampleStage,
  LifecycleStatus,
  LostReason,
  StreamEventType,
  Division,
} from '@prisma/client';
import { ACTIVITY_EVENT } from '../../activity-stream/events/activity.events';
import { BUSSDEV_EVENTS } from '../events/bussdev.events';

@Injectable()
export class LeadService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
  ) {}

  async createLead(dto: CreateLeadDto) {
    return this.prisma.$transaction(async (tx) => {
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

      const paymentProofUrl =
        files?.paymentProof?.[0]?.path || dto.paymentProofUrl;
      const spkFileUrl = files?.spkFile?.[0]?.path || dto.spkFileUrl;
      const pnfFileUrl = files?.pnfFile?.[0]?.path || dto.pnfFileUrl;
      const quotationFileUrl =
        files?.quotationFile?.[0]?.path || currentLead.spkFileUrl;

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
}
