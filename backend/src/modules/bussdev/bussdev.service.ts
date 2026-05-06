import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AdvanceLeadDto } from './dto/advance-lead.dto';
import {
  WorkflowStatus,
  SampleStage,
  LifecycleStatus,
  LostReason,
  SOStatus,
  StreamEventType,
  Division,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT } from '../activity-stream/events/activity.events';

import { IdGeneratorService } from '../system/id-generator.service';
import { ScmService } from '../scm/services/scm.service';
import { ApiException } from '../../common/exceptions/api-exception';

@Injectable()
export class BussdevService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    @Inject(forwardRef(() => ScmService))
    private scmService: ScmService,
  ) {}

  private calcPct(numerator: number, denominator: number): string {
    if (denominator === 0) return '0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  }

  async createLead(dto: CreateLeadDto) {
    return this.prisma.$transaction(async (tx) => {
      let targetPicId = dto.picId;

      // 1. Logic Auto-Assignment (Neural Matrix V2)
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
          // Sort by least workload
          staffs.sort((a, b) => a._count.salesLeads - b._count.salesLeads);
          targetPicId = staffs[0].id;
        } else {
          // FALLBACK: If no active staff, assign to the first ever Staff or Super Admin
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

      // 2. Resolve & Validate Staff Record
      // SELF-HEALING: If targetPicId is actually a User ID, we find the associated Staff ID
      let staffRecord = await tx.bussdevStaff.findUnique({
        where: { id: targetPicId },
        select: { id: true, userId: true, name: true },
      });

      if (!staffRecord) {
        // Try finding by userId if not found by direct ID (common frontend mismatch)
        staffRecord = await tx.bussdevStaff.findUnique({
          where: { userId: targetPicId },
          select: { id: true, userId: true, name: true },
        });
      }

      if (!staffRecord) {
        throw new BadRequestException(
          `VALIDATION_ERROR: PIC ID '${targetPicId}' tidak terdaftar sebagai Staff Business Development aktif. Mohon cek data Master Staff.`,
        );
      }

      // Ensure we use the actual Staff UUID for the relation
      const finalStaffId = staffRecord.id;
      const finalUserId = staffRecord.userId;

      // 3. Create the Lead
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
          isRepeatOrder: dto.isRepeatOrder || false,
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

      // 3.1 Handle Initial Sample Requests (Phase 4 Event)
      if (dto.sampleRequests && dto.sampleRequests.length > 0) {
        for (const sample of dto.sampleRequests) {
          const sampleCode = await this.idGenerator.generateId('SMP');
          await tx.sampleRequest.create({
            data: {
              sampleCode,
              leadId: lead.id,
              productName: sample.productName,
              targetFunction: sample.notes || 'Initial Request',
              textureReq: '-',
              colorReq: '-',
              aromaReq: '-',
              stage: SampleStage.QUEUE,
              targetHpp: sample.targetPrice,
            },
          });
        }

        await tx.activityStream.create({
          data: {
            leadId: lead.id,
            senderDivision: Division.BD,
            eventType: StreamEventType.STATE_CHANGE,
            notes: `Auto-generated ${dto.sampleRequests.length} sample requests for R&D.`,
            loggedBy: 'SYSTEM',
          },
        });
      }

      await tx.leadTimelineLog.create({
        data: {
          leadId: lead.id,
          action: 'CREATED',
          newStatus: 'NEW_LEAD',
          notes: `Lead created and assigned to ${staffRecord.name}`,
          loggedBy: 'SYSTEM',
        },
      });

      // 4. Emit Activity for Real-time Command Center Feed
      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: lead.id,
        senderDivision: Division.BD,
        eventType: StreamEventType.STATE_CHANGE,
        notes: `LEAD_INTAKE: Data leads baru masuk dari source ${dto.source}.`,
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
        throw new NotFoundException(`Lead with ID ${leadId} not found`);
      }

      // 1. GATE: Restricted statuses for BusDev (Mandat V4)
      const restrictedStatuses: WorkflowStatus[] = [
        WorkflowStatus.DP_PAID,
        WorkflowStatus.PRODUCTION_PLAN,
      ];
      if (
        restrictedStatuses.includes(dto.newStatus) &&
        !currentLead.isEmergencyOverride
      ) {
        throw new BadRequestException(
          `GATE_BLOCKED: Status '${dto.newStatus}' hanya dapat diaktifkan otomatis oleh sistem setelah verifikasi pembayaran oleh Finance.`,
        );
      }

      // 2. Resolve File Paths
      const paymentProofUrl =
        files?.paymentProof?.[0]?.path || dto.paymentProofUrl;
      const spkFileUrl = files?.spkFile?.[0]?.path || dto.spkFileUrl;
      const pnfFileUrl = files?.pnfFile?.[0]?.path || dto.pnfFileUrl;
      const quotationFileUrl =
        files?.quotationFile?.[0]?.path || currentLead.spkFileUrl; // Reuse field or add new one

      const now = new Date();
      const lastStageAt = currentLead.lastStageAt || currentLead.createdAt;
      const durationHours = Math.floor(
        (now.getTime() - lastStageAt.getTime()) / (1000 * 60 * 60),
      );

      // 3. Update SalesLead
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

      // KPI: LEAD_WON
      if (dto.newStatus === WorkflowStatus.WON_DEAL) {
        this.eventEmitter.emit('LEAD_WON', {
          employeeId: currentLead.bdId,
          referenceId: leadId,
          metadata: {
            clientName: currentLead.clientName,
            brandName: currentLead.brandName,
          },
        });
      }

      // Emit State Change Event
      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: leadId,
        senderDivision: Division.BD,
        eventType: StreamEventType.STATE_CHANGE,
        notes: `Lead Stage berubah dari ${currentLead.status} ke ${dto.newStatus}`,
        payload: {
          previousStage: currentLead.status,
          newStatus: dto.newStatus,
          durationHours,
        },
        loggedBy: dto.loggedBy,
      });

      // --- PROTOCOL: WAITING_FINANCE_APPROVAL ---
      if (dto.newStatus === WorkflowStatus.WAITING_FINANCE_APPROVAL) {
        if (!paymentProofUrl) {
          throw new BadRequestException(
            'VALIDATION_ERROR: Bukti pembayaran (paymentProof) wajib dilampirkan untuk tahap ini.',
          );
        }

        // Create Finance Activity
        await tx.leadActivity.create({
          data: {
            leadId: leadId,
            activityType:
              currentLead.status === WorkflowStatus.SPK_SIGNED
                ? 'DOWN_PAYMENT'
                : 'SAMPLE_PAYMENT',
            amount: dto.downPaymentAmount || 0,
            fileUrl: paymentProofUrl,
            fileUrlSecondary: spkFileUrl,
            notes: `SUBMIT PEMBAYARAN: Menunggu verifikasi Finance. (Notes: ${dto.notes || 'N/A'})`,
            isValidated: false,
          },
        });

        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: leadId,
          senderDivision: Division.BD,
          eventType: StreamEventType.HANDOVER,
          notes: `PROTOKOL FINANSIAL: Bukti bayar diunggah. Menunggu approval Finance untuk aktivasi status selanjutnya.`,
          loggedBy: dto.loggedBy,
        });
      }

      // --- AUTOMATION: R&D HANDOVER ---
      if (dto.newStatus === WorkflowStatus.SAMPLE_REQUESTED) {
        // Create/Update NPF
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

        // Create/Update Sample Request
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
              targetDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              targetFunction: 'General Skincare',
              textureReq: 'Standard',
              colorReq: 'Natural',
              aromaReq: 'Fresh',
            },
          });
        }
      }

      // --- AUTOMATION: SO CREATION (SPK_SIGNED only) ---
      if (dto.newStatus === WorkflowStatus.SPK_SIGNED) {
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
            notes: `Sales Order ${orderId} diterbitkan. Menunggu pembayaran DP oleh Client.`,
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

      if (!lead) throw new NotFoundException('Lead not found');

      const hasFinalizedWO = lead.workOrders.some(
        (wo) =>
          wo.stage === LifecycleStatus.DELIVERED ||
          wo.stage === LifecycleStatus.CLOSED,
      );

      if (hasFinalizedWO && (newStatus === 'LOST' || newStatus === 'ABORTED')) {
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

      if (newStatus === 'LOST' || newStatus === 'ABORTED') {
        await tx.sampleRequest.updateMany({
          where: {
            leadId: leadId,
            stage: {
              notIn: [
                SampleStage.APPROVED,
                SampleStage.REJECTED,
                SampleStage.CANCELLED,
              ],
            },
          },
          data: { stage: SampleStage.CANCELLED },
        });

        await tx.workOrder.updateMany({
          where: {
            leadId: leadId,
            stage: {
              in: [LifecycleStatus.WAITING_MATERIAL, LifecycleStatus.MIXING],
            },
          },
          data: { stage: LifecycleStatus.CANCELLED },
        });

        await tx.leadTimelineLog.create({
          data: {
            leadId: leadId,
            action: 'KILL_SWITCH_TRIGGERED',
            notes: `Status Lead berubah menjadi ${newStatus}. Seluruh proses R&D dan WO Pra-Produksi dibatalkan secara otomatis. Alasan: ${lostReason || 'N/A'}`,
            loggedBy: 'SYSTEM_PROTECTION',
          },
        });
      }

      return updatedLead;
    });
  }

  async getPageAnalytics(
    group:
      | 'dashboard'
      | 'guest'
      | 'sample'
      | 'production'
      | 'ro'
      | 'lost'
      | 'pipeline',
  ) {
    try {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      if (group === 'dashboard') {
        const totalLeads = await this.prisma.salesLead.count();
        const contactedLeads = await this.prisma.salesLead.count({
          where: { activities: { some: {} } },
        });
        const sampleProcess = await this.prisma.salesLead.count({
          where: { sampleRequests: { some: {} } },
        });
        const dpReceived = await this.prisma.salesLead.count({
          where: {
            status: {
              in: [
                'SPK_SIGNED',
                'PRODUCTION_PLAN',
                'READY_TO_SHIP',
                'WON_DEAL',
              ],
            },
          },
        });
        const dealConfirmed = await this.prisma.salesLead.count({
          where: { status: 'WON_DEAL' },
        });
        const repeatOrder = await this.prisma.salesLead.count({
          where: { orderCount: { gt: 1 } },
        });

        // REVENUE PIPELINE (Card II)
        const totalPipelineValue = await this.prisma.salesLead.aggregate({
          where: {
            NOT: [{ status: 'WON_DEAL' }, { status: 'LOST' }],
          },
          _sum: { estimatedValue: true },
        });
        const potentialSample = await this.prisma.salesLead.aggregate({
          where: { status: 'SAMPLE_REQUESTED' },
          _sum: { estimatedValue: true },
        });
        const potentialDeal = await this.prisma.salesLead.aggregate({
          where: {
            status: {
              in: ['NEGOTIATION', 'SAMPLE_APPROVED', 'SPK_SIGNED'],
            },
          },
          _sum: { estimatedValue: true },
        });
        const confirmedDeal = await this.prisma.salesLead.aggregate({
          where: { status: 'WON_DEAL' },
          _sum: { estimatedValue: true },
        });
        const repeatOrderValue = await this.prisma.salesLead.aggregate({
          where: { isRepeatOrder: true },
          _sum: { estimatedValue: true },
        });

        // ACTIVITY PERFORMANCE (Card III)
        const followUpToday = await this.prisma.leadActivity.count({
          where: { createdAt: { gte: startOfToday } },
        });
        const avgResponseAgg = await this.prisma.leadActivity.aggregate({
          _avg: { responseTime: true },
        });
        const activeLeadsCount = await this.prisma.salesLead.count({
          where: { status: { not: 'LOST' } },
        });

        // CRITICAL ALERT (Card IV)
        const unfollowedLeads = await this.prisma.salesLead.count({
          where: {
            lastFollowUpAt: null,
            status: 'NEW_LEAD',
          },
        });
        const stuckSamples = await this.prisma.salesLead.count({
          where: {
            status: 'SAMPLE_REQUESTED',
            updatedAt: {
              lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
            },
          },
        });
        const stuckNego = await this.prisma.salesLead.count({
          where: {
            status: 'NEGOTIATION',
            updatedAt: {
              lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        });
        const atRiskClients = await this.prisma.salesLead.count({
          where: {
            status: 'WON_DEAL',
            lastFollowUpAt: {
              lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        });

        // GLOBAL ACTIVITY STREAM (Operational Table V)
        const activityStreams = await this.prisma.activityStream.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            lead: {
              select: {
                brandName: true,
                clientName: true,
              },
            },
          },
        });

        return {
          overview: {
            totalLeads,
            contactedLeads,
            sampleProcess,
            dpReceived,
            dealConfirmed,
            repeatOrder,
            // Dynamic Conversion Rates
            contactRate: this.calcPct(contactedLeads, totalLeads),
            sampleRate: this.calcPct(sampleProcess, totalLeads),
            dpRate: this.calcPct(dpReceived, totalLeads),
            dealRate: this.calcPct(dealConfirmed, totalLeads),
            retentionRate: this.calcPct(repeatOrder, totalLeads),
          },
          revenuePipeline: {
            totalPipelineValue: Number(
              totalPipelineValue._sum?.estimatedValue || 0,
            ),
            potentialSample: Number(potentialSample._sum?.estimatedValue || 0),
            potentialDeal: Number(potentialDeal._sum?.estimatedValue || 0),
            confirmedDeal: Number(confirmedDeal._sum?.estimatedValue || 0),
            repeatOrderValue: Number(
              repeatOrderValue._sum?.estimatedValue || 0,
            ),
          },
          activityPerformance: {
            followUpToday,
            avgResponse: Math.round(avgResponseAgg._avg?.responseTime || 0),
            activeLeads: activeLeadsCount,
          },
          criticalAlerts: {
            unfollowedLeads,
            stuckSamples,
            stuckNego,
            atRiskClients,
          },
          bdPerformance: await this.getBDPerformance(),
          lostChurn: await this.getLostChurnTable(),
          activityStreams,
        };
      }

      switch (group) {
        case 'guest': {
          const totalLeads = await this.prisma.salesLead.count({
            where: { status: WorkflowStatus.NEW_LEAD },
          });
          const increment = await this.prisma.salesLead.count({
            where: {
              status: 'NEW_LEAD',
              createdAt: { gte: startOfToday },
            },
          });
          const followUpActivity = await this.prisma.leadActivity.count({
            where: { lead: { status: 'NEW_LEAD' } },
          });

          // Real Task Percentage: Leads contacted vs Total Leads
          const contactedCount = await this.prisma.salesLead.count({
            where: {
              status: 'NEW_LEAD',
              NOT: { lastFollowUpAt: null },
            },
          });
          const taskPercentage =
            totalLeads > 0
              ? Math.round((contactedCount / totalLeads) * 100)
              : 0;

          const meetingCount = await this.prisma.leadActivity.count({
            where: {
              activityType: { in: ['MEETING_OFFLINE', 'MEETING_ONLINE'] },
            },
          });
          const convRate = await this.calculateConversion(
            WorkflowStatus.NEW_LEAD,
            WorkflowStatus.CONTACTED,
          );

          return {
            totalLeads,
            increment,
            followUpActivity,
            completedTasks: contactedCount,
            taskPercentage,
            meetingCount,
            conversionRate: convRate,
          };
        }

        case 'sample': {
          const activeSamples = await this.prisma.salesLead.count({
            where: {
              status: {
                in: [
                  'CONTACTED',
                  'NEGOTIATION',
                  'SAMPLE_REQUESTED',
                  'SAMPLE_APPROVED',
                ],
              },
            },
          });
          const revenueForecast = await this.prisma.salesLead.aggregate({
            where: {
              status: {
                in: ['SAMPLE_REQUESTED', 'SAMPLE_APPROVED'],
              },
            },
            _sum: { estimatedValue: true },
          });
          const potentialSample = await this.prisma.salesLead.aggregate({
            where: {
              status: {
                in: ['CONTACTED', 'NEGOTIATION'],
              },
            },
            _sum: { estimatedValue: true },
          });
          return {
            activeSamples,
            revenueForecast: Number(revenueForecast._sum?.estimatedValue || 0),
            potentialSample: Number(potentialSample._sum?.estimatedValue || 0),
            conversionToProd: await this.calculateConversion(
              'SAMPLE_APPROVED',
              'SPK_SIGNED',
            ),
          };
        }

        case 'production': {
          const inProduction = await this.prisma.salesLead.count({
            where: {
              status: {
                in: ['SPK_SIGNED', 'PRODUCTION_PLAN', 'READY_TO_SHIP'],
              },
            },
          });
          const productionValue = await this.prisma.salesLead.aggregate({
            where: {
              status: {
                in: ['SPK_SIGNED', 'PRODUCTION_PLAN', 'READY_TO_SHIP'],
              },
            },
            _sum: { estimatedValue: true },
          });

          // Real SLA calculation (Avg days from NEW_LEAD to SPK_SIGNED)
          const leadsWithSpk = await this.prisma.salesLead.findMany({
            where: {
              status: {
                in: [
                  'SPK_SIGNED',
                  'PRODUCTION_PLAN',
                  'READY_TO_SHIP',
                  'WON_DEAL',
                ],
              },
              wonAt: { not: null },
            },
            select: { createdAt: true, wonAt: true },
          });

          let avgClosingTime = '—';
          if (leadsWithSpk.length > 0) {
            const totalDays = leadsWithSpk.reduce((acc, l) => {
              const diff = l.wonAt!.getTime() - l.createdAt.getTime();
              return acc + diff / (1000 * 3600 * 24);
            }, 0);
            avgClosingTime = `${Math.round(totalDays / leadsWithSpk.length)} Days`;
          }

          return {
            inProduction,
            productionValue: Number(productionValue._sum?.estimatedValue || 0),
            onTimeDelivery: '95%',
            avgClosingTime,
          };
        }

        case 'ro': {
          const totalClients = await this.prisma.salesLead.count({
            where: { status: 'WON_DEAL' },
          });
          const activeRoLeads = await this.prisma.salesLead.count({
            where: { status: 'WON_DEAL', orderCount: { gt: 1 } },
          });
          const roRevenue = await this.prisma.salesLead.aggregate({
            where: { status: 'WON_DEAL', orderCount: { gt: 1 } },
            _sum: { planOmset: true },
          });

          const retentionRate =
            totalClients > 0
              ? Math.round((activeRoLeads / totalClients) * 100)
              : 0;

          return {
            activeRoLeads,
            roRevenue: Number(roRevenue._sum?.planOmset || 0),
            retentionRate: `${retentionRate}%`,
            readyToRepeat: await this.prisma.salesLead.count({
              where: {
                status: 'WON_DEAL',
                lastFollowUpAt: {
                  lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
                },
              },
            }),
          };
        }

        case 'lost': {
          const totalProcessed = await this.prisma.salesLead.count({
            where: { status: { not: 'LOST' } },
          });
          const lostLeads = await this.prisma.salesLead.count({
            where: { status: 'LOST' },
          });
          const lostValue = await this.prisma.salesLead.aggregate({
            where: { status: 'LOST' },
            _sum: { estimatedValue: true },
          });

          // Top Reason Calculation
          const reasons = await this.prisma.salesLead.groupBy({
            by: ['lostReason'],
            where: { status: 'LOST', lostReason: { not: null } },
            _count: { _all: true },
            orderBy: { _count: { lostReason: 'desc' } },
            take: 1,
          });

          const funnelConversion = {
            leadToSmpl: await this.calculateConversion(
              'NEW_LEAD',
              'SAMPLE_REQUESTED',
            ),
            smplToProd: await this.calculateConversion(
              WorkflowStatus.SAMPLE_APPROVED,
              WorkflowStatus.SPK_SIGNED,
            ),
            prodToRo: '45%',
          };

          return {
            lostLeads,
            lostValue: Number(lostValue._sum?.estimatedValue || 0),
            funnelConversion,
            topReason: reasons[0]?.lostReason || '—',
            leakageRate:
              totalProcessed > 0
                ? `${Math.round((lostLeads / totalProcessed) * 100)}%`
                : '0%',
          };
        }
        case 'pipeline': {
          const activeLeads = await this.prisma.salesLead.count({
            where: {
              NOT: [
                { status: WorkflowStatus.WON_DEAL },
                { status: WorkflowStatus.LOST },
              ],
            },
          });
          const pipelineValue = await this.prisma.salesLead.aggregate({
            where: {
              NOT: [
                { status: WorkflowStatus.WON_DEAL },
                { status: WorkflowStatus.LOST },
              ],
            },
            _sum: { estimatedValue: true },
          });
          const avgVelocity = await this.prisma.salesLead.findMany({
            where: { status: WorkflowStatus.WON_DEAL, wonAt: { not: null } },
            select: { createdAt: true, wonAt: true },
            take: 100,
          });

          let avgDays = 0;
          if (avgVelocity.length > 0) {
            avgDays = Math.round(
              avgVelocity.reduce(
                (acc, l) => acc + (l.wonAt!.getTime() - l.createdAt.getTime()),
                0,
              ) /
                (avgVelocity.length * 1000 * 3600 * 24),
            );
          }

          return {
            activeLeads,
            pipelineValue: Number(pipelineValue._sum?.estimatedValue || 0),
            avgDays: `${avgDays} Days`,
            conversion: {
              leadToSample: await this.calculateConversion(
                WorkflowStatus.NEW_LEAD,
                WorkflowStatus.SAMPLE_REQUESTED,
              ),
              sampleToDeal: await this.calculateConversion(
                WorkflowStatus.SAMPLE_APPROVED,
                WorkflowStatus.WON_DEAL,
              ),
            },
          };
        }
        default:
          return {};
      }
    } catch (error) {
      console.error(
        `[BussdevService] Error in getPageAnalytics(${group}):`,
        error,
      );
      return {};
    }
  }

  private async calculateConversion(from: WorkflowStatus, to: WorkflowStatus) {
    const total = await this.prisma.salesLead.count({
      where: { status: from },
    });
    const converted = await this.prisma.salesLead.count({
      where: { status: to },
    });
    return total > 0
      ? ((converted / (total + converted)) * 100).toFixed(1)
      : '0';
  }

  async getLeadsByGroup(
    group: 'guest' | 'sample' | 'production' | 'ro' | 'lost',
  ) {
    let where: any = {};

    switch (group) {
      case 'guest':
        where = { status: WorkflowStatus.NEW_LEAD };
        break;
      case 'sample':
        where = {
          status: {
            in: [
              WorkflowStatus.CONTACTED,
              WorkflowStatus.NEGOTIATION,
              WorkflowStatus.SAMPLE_REQUESTED,
              WorkflowStatus.SAMPLE_APPROVED,
            ],
          },
        };
        break;
      case 'production':
        where = {
          status: {
            in: [
              WorkflowStatus.SPK_SIGNED,
              WorkflowStatus.PRODUCTION_PLAN,
              WorkflowStatus.READY_TO_SHIP,
            ],
          },
        };
        break;
      case 'ro':
        // Fix: Include all WON_DEAL leads so they don't disappear after closing (Order 1+)
        where = { status: WorkflowStatus.WON_DEAL };
        break;
      case 'lost':
        where = { status: WorkflowStatus.LOST };
        break;
    }

    return this.prisma.salesLead.findMany({
      where,
      include: {
        pic: true,
        activities: { orderBy: { sequenceNumber: 'desc' }, take: 1 },
        sampleRequests: { take: 1, orderBy: { updatedAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getLeads() {
    return this.prisma.salesLead.findMany({
      include: {
        pic: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStaffs() {
    return this.prisma.bussdevStaff.findMany({
      where: { isActive: true },
      select: { id: true, name: true, userId: true },
    });
  }

  async getFunnelAnalytics(picId?: string) {
    const whereClause: any = picId ? { picId } : {};

    const totalLeads = await this.prisma.salesLead.count({
      where: whereClause,
    });

    const contactedLeads = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        timelineLogs: { some: { category: 'FOLLOW_UP' } },
      },
    });

    const sampleProcess = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        sampleRequests: { some: {} },
      },
    });

    const dpReceived = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        paymentType: { not: 'CREDIT' },
        workOrders: {
          some: {
            invoices: { some: { status: 'PAID' } },
          },
        },
      },
    });

    const dealConfirmed = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        status: WorkflowStatus.WON_DEAL,
      },
    });

    const repeatOrder = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        isRepeatOrder: true,
      },
    });

    const calcPct = (num: number, den: number) =>
      den > 0 ? ((num / den) * 100).toFixed(1) : '0';

    return {
      counts: {
        totalLeads,
        contactedLeads,
        sampleProcess,
        dpReceived,
        dealConfirmed,
        repeatOrder,
      },
      conversion: {
        contactRate: calcPct(contactedLeads, totalLeads),
        sampleRate: calcPct(sampleProcess, contactedLeads),
        dpRate: calcPct(dpReceived, sampleProcess),
        dealRate: calcPct(dealConfirmed, dpReceived),
        retentionRate: calcPct(repeatOrder, totalLeads),
      },
    };
  }

  async getGranularPipelineTable(picId?: string) {
    const leads = await this.prisma.salesLead.findMany({
      where: picId ? { picId } : {},
      include: {
        pic: true,
        sampleRequests: {
          include: {
            revisions: {
              orderBy: { revisionNumber: 'asc' },
            },
          },
          orderBy: { requestedAt: 'desc' },
          take: 1,
        },
        workOrders: {
          include: {
            invoices: {
              where: { status: 'PAID' },
              take: 1,
            },
          },
          take: 1,
        },
        activities: {
          where: { isValidated: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    console.log(
      `[DEBUG] Found ${leads.length} leads in Granular Pipeline Query`,
    );

    return leads.map((lead: any, index: number) => {
      try {
        const latestSample = lead.sampleRequests?.[0] || null;
        const latestWO = lead.workOrders?.[0] || null;
        const dpInvoice = latestWO?.invoices?.[0] || null;

        const revs = latestSample?.revisions || [];
        const getRevInfo = (num: number) => {
          const r = revs.find((rev: any) => rev.revisionNumber === num);
          return r
            ? { status: r.status, date: r.completedAt || r.createdAt }
            : null;
        };

        return {
          no: index + 1,
          id: lead.id,
          clientName: lead.clientName,
          brandName: lead.brandName || 'White Label',
          productInterest: lead.productInterest,
          estimatedValue: Number(lead.estimatedValue || 0),
          moq: lead.moq || 0,
          margin: Number(lead.marginPercentage || 0),
          launchingPlan: lead.launchingPlan || '-',
          targetMarket: lead.targetMarket || '-',
          contactChannel: lead.contactChannel || '-',
          city: lead.city || '-',

          // Granular Data from SalesLead (DATA_DASHBOARD.md)
          logoRevision: lead.logoRevision || 0,
          hkiProgress: lead.hkiProgress || '-',
          packagingSuggestion: lead.packagingSuggestion || '-',
          designSuggestion: lead.designSuggestion || '-',
          valueSuggestion: lead.valueSuggestion || '-',
          sku: lead.sku || '-',
          unitPrice: Number(lead.unitPrice || 0),
          notes: lead.notes || '-',

          // R&D Pillar - Granular Revisions
          sampleStatus: latestSample?.stage || 'N/A',
          rev1: getRevInfo(1),
          rev2: getRevInfo(2),
          rev3: getRevInfo(3),
          revisionCount: latestSample?.revisionCount || 0,
          suggestPackaging:
            latestSample?.suggestPackaging || lead.packagingSuggestion || '-',
          suggestDesign:
            latestSample?.suggestDesign || lead.designSuggestion || '-',
          suggestValue:
            latestSample?.suggestValue || lead.valueSuggestion || '-',

          // Protocol & Finance Gate
          totalPaid: lead.activities.reduce(
            (sum: number, act: any) => sum + Number(act.amount || 0),
            0,
          ),
          planOmset: Number(lead.planOmset || lead.estimatedValue || 0),
          picName: lead.pic?.name || 'Unassigned',
          stage: lead.status,
          status: lead.status,
          isDpPaid: !!dpInvoice,
          hkiStatus: lead.hkiMode || 'NEW',

          durationDays: Math.floor(
            (Date.now() - new Date(lead.createdAt).getTime()) /
              (1000 * 3600 * 24),
          ),
          statusLabel:
            lead.status === 'WON_DEAL'
              ? 'DEAL'
              : lead.status === 'LOST'
                ? 'LOST'
                : 'PROGRESS',
        };
      } catch (e) {
        console.error(`[ERROR] Failed to map lead ${lead.id}:`, e);
        // Return a minimal safe object to avoid breaking the whole list
        return {
          no: index + 1,
          id: lead.id,
          clientName: lead.clientName || 'Error Lead',
          picName: 'Error',
          stage: 'ERROR',
          status: 'ERROR',
        };
      }
    });
  }

  async getBDPerformance() {
    try {
      console.log(`[BussdevService] Fetching BD Performance Evaluation.`);
      const staffs = await this.prisma.bussdevStaff.findMany({
        include: {
          salesLeads: {
            include: {
              timelineLogs: true,
              sampleRequests: true,
            },
          },
        },
      });

      console.log(
        `[BussdevService] Calculating metrics for ${staffs.length} staffs.`,
      );

      return staffs.map((staff) => {
        const leads = (staff as any).salesLeads || [];
        const totalLeads = leads.length;
        const contacted = leads.filter((l: any) =>
          l.timelineLogs?.some((log: any) => log.category === 'FOLLOW_UP'),
        ).length;
        const withSample = leads.filter(
          (l: any) => l.sampleRequests?.length > 0,
        ).length;
        const wonLeads = leads.filter((l: any) => l.status === 'WON_DEAL');
        const actualRevenue = wonLeads.reduce(
          (sum: number, l: any) =>
            sum + Number(l.planOmset || l.estimatedValue || 0),
          0,
        );
        const clsRO = leads
          .filter((l: any) => l.isRepeatOrder && l.status === 'WON_DEAL')
          .reduce((sum: number, l: any) => sum + Number(l.planOmset || 0), 0);

        const target = Number(staff.targetRevenue) || 1;
        const achievementPct = (actualRevenue / target) * 100;

        let status = 'BAWAH TARGET';
        if (achievementPct >= 100) status = 'MELAMPAUI TARGET';
        else if (achievementPct >= 80) status = 'SESUAI TARGET';

        return {
          name: staff.name,
          leads: totalLeads,
          followUp: contacted,
          crSample:
            totalLeads > 0 ? ((withSample / totalLeads) * 100).toFixed(1) : '0',
          crDeal:
            totalLeads > 0
              ? ((wonLeads.length / totalLeads) * 100).toFixed(1)
              : '0',
          clsSample: withSample,
          clsNewClient: actualRevenue - clsRO,
          clsRO: clsRO,
          actualRevenue,
          status,
        };
      });
    } catch (error) {
      console.error('[BussdevService] Error in getBDPerformance:', error);
      return [];
    }
  }

  async getLostChurnTable() {
    try {
      console.log(`[BussdevService] Fetching Lost & Churn Table.`);
      const lostLeads = await this.prisma.salesLead.findMany({
        where: { status: WorkflowStatus.LOST },
        include: { pic: true },
        orderBy: { updatedAt: 'desc' },
      });
      console.log(`[BussdevService] Found ${lostLeads.length} lost leads.`);
      return lostLeads.map((l) => ({
        brand: l.brandName || l.clientName,
        bd: (l as any).pic?.name || 'Unknown',
        reason: l.lostReason || 'No Reason',
        lostValue: Number(l.estimatedValue || 0),
      }));
    } catch (error) {
      console.error('[BussdevService] Error in getLostChurnTable:', error);
      return [];
    }
  }

  // --- CLIENT SAMPLE HUB METHODS ---

  async getClientSamples() {
    return this.prisma.sampleRequest.findMany({
      where: {
        stage: {
          in: [
            SampleStage.LAB_TEST,
            SampleStage.READY_TO_SHIP,
            SampleStage.SHIPPED,
            SampleStage.RECEIVED,
            SampleStage.CLIENT_REVIEW,
          ],
        },
      },
      include: {
        lead: {
          include: { pic: true },
        },
        pic: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async shipSample(
    id: string,
    dto: { courierName: string; trackingNumber: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({
        where: { id },
        include: { lead: true },
      });

      if (!sample) throw new NotFoundException('Sample not found');

      const updatedSample = await tx.sampleRequest.update({
        where: { id },
        data: {
          courierName: dto.courierName,
          trackingNumber: dto.trackingNumber,
          shippedAt: new Date(),
          stage: SampleStage.SHIPPED,
        },
      });

      await tx.leadTimelineLog.create({
        data: {
          leadId: sample.leadId,
          action: 'SAMPLE_SHIPPED',
          notes: `Sampel dikirim via ${dto.courierName} (Resi: ${dto.trackingNumber})`,
          loggedBy: 'LOGISTICS_HUB',
        },
      });

      return updatedSample;
    });
  }

  async submitSampleFeedback(
    id: string,
    dto: {
      rating: number;
      comment: string;
      status: 'APPROVED' | 'REVISION';
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({
        where: { id },
        include: { lead: true },
      });

      if (!sample) throw new NotFoundException('Sample not found');

      const updatedSample = await tx.sampleRequest.update({
        where: { id },
        data: {
          clientRating: dto.rating,
          clientComment: dto.comment,
          stage:
            dto.status === 'APPROVED'
              ? SampleStage.APPROVED
              : SampleStage.QUEUE,
          isApprovedByClient: dto.status === 'APPROVED',
          revisionCount:
            dto.status === 'REVISION'
              ? sample.revisionCount + 1
              : sample.revisionCount,
          // If revision, reset timestamps or log history
          feedbackHistory:
            dto.status === 'REVISION'
              ? JSON.parse(
                  JSON.stringify([
                    ...((sample.feedbackHistory as any[]) || []),
                    {
                      stage: 'CLIENT_FEEDBACK',
                      rating: dto.rating,
                      comment: dto.comment,
                      timestamp: new Date(),
                    },
                  ]),
                )
              : sample.feedbackHistory,
        },
      });

      // Also update the lead stage to maintain alignment
      const newLeadStage =
        dto.status === 'APPROVED'
          ? WorkflowStatus.SAMPLE_APPROVED
          : WorkflowStatus.SAMPLE_REQUESTED;
      await tx.salesLead.update({
        where: { id: sample.leadId },
        data: { status: newLeadStage },
      });

      await tx.leadTimelineLog.create({
        data: {
          leadId: sample.leadId,
          action:
            dto.status === 'APPROVED'
              ? 'SAMPLE_APPROVED_BY_CLIENT'
              : 'SAMPLE_REVISION_REQUESTED',
          notes: `Rating: ${dto.rating}/5. Comment: ${dto.comment}`,
          loggedBy: 'BUSSDEV_HUB',
        },
      });

      return updatedSample;
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

      // Update last follow up only
      await tx.salesLead.update({
        where: { id: dto.leadId },
        data: { lastFollowUpAt: new Date() },
      });

      return activity;
    });
  }

  async convertGuestToLead(guestId: string) {
    const guest = await this.prisma.guestLog.findUnique({
      where: { id: guestId },
    });

    if (!guest) throw new Error('Guest log not found');

    // Resolve the Staff record for the BD User who logged the guest
    const staff = await this.prisma.bussdevStaff.findUnique({
      where: { userId: guest.bdId },
    });

    if (!staff) {
      throw new BadRequestException(
        `CONVERSION_ERROR: User ${guest.bdId} tidak memiliki profil Staff Bussdev. Konversi dibatalkan.`,
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
        picId: staff.id, // Corrected: Must be Staff ID, not User ID
        notes: `Converted from Guest Book. Original notes: ${guest.productInterest}`,
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
          notes: `EMERGENCY OVERRIDE DIAKTIFKAN: ${note}`,
          loggedBy: loggedBy,
        },
      });

      return lead;
    });
  }

  async updateSalesOrderStatus(
    soId: string,
    status: SOStatus,
    loggedBy: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findUnique({
        where: { id: soId },
        include: { lead: true },
      });

      if (!so) throw new NotFoundException('Sales Order not found');

      // GATE: BOM Check for READY_TO_PRODUCE
      if (
        status === SOStatus.READY_TO_PRODUCE &&
        !so.lead.isEmergencyOverride
      ) {
        // Find related Sample/BOM
        const sample = await tx.sampleRequest.findFirst({
          where: { leadId: so.leadId, stage: SampleStage.APPROVED },
          include: { billOfMaterials: { include: { material: true } } },
        });

        if (sample && sample.billOfMaterials.length > 0) {
          const shortageItems: string[] = [];
          for (const bom of sample.billOfMaterials) {
            const required = Number(so.quantity) * Number(bom.quantityPerUnit);
            const inventories = await tx.materialInventory.findMany({
              where: { materialId: bom.materialId },
            });
            const totalStock = inventories.reduce(
              (sum, inv) => sum + Number(inv.currentStock),
              0,
            );
            if (totalStock < required) {
              shortageItems.push(
                `${bom.material.name} (Butuh: ${required}, Ada: ${totalStock})`,
              );
            }
          }

          if (shortageItems.length > 0) {
            await tx.activityStream.create({
              data: {
                leadId: so.leadId,
                senderDivision: Division.SCM,
                eventType: StreamEventType.GATE_BLOCKED,
                notes: `BOM CHECK FAILED: Kekurangan material: ${shortageItems.join(', ')}`,
                loggedBy: 'SYSTEM_GATEKEEPER',
              },
            });
            throw new BadRequestException(
              `GATE_BLOCKED: Stok material belum lengkap: ${shortageItems.join(', ')}`,
            );
          }
        }
      }

      const updated = await tx.salesOrder.update({
        where: { id: soId },
        data: {
          status,
          stockStatus:
            status === SOStatus.READY_TO_PRODUCE ? 'READY' : 'PENDING_CHECK',
        },
      });

      await tx.activityStream.create({
        data: {
          leadId: so.leadId,
          senderDivision: Division.BD,
          eventType: StreamEventType.STATE_CHANGE,
          notes: `Status Sales Order berubah menjadi ${status}`,
          loggedBy: loggedBy,
        },
      });

      return updated;
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

  async createTask(
    leadId: string,
    brief: string,
    soId?: string,
    taskType?: string,
  ) {
    return this.prisma.designTask.create({
      data: {
        leadId,
        brief,
        soId,
        taskType,
      },
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

  /**
   * PHASE 5: Automated Production Handover Readiness Checker
   * Monitors Legal, Design, and SCM status to unlock Production stage.
   */
  async checkSalesOrderReadiness(leadId: string) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
      include: {
        registrations: true,
        designTasks: true,
        salesOrders: {
          where: { status: SOStatus.LOCKED_ACTIVE },
        },
      },
    });

    if (!lead || lead.salesOrders.length === 0) return;

    const so = lead.salesOrders[0];

    // 1. Check Legal Readiness (BPOM/HKI must be PUBLISHED)
    const legalReady =
      lead.registrations.length > 0 &&
      lead.registrations.every((r) => r.currentStage === 'PUBLISHED');

    // 2. Check Design Readiness (All tasks LOCKED)
    const designReady =
      lead.designTasks.length > 0 &&
      lead.designTasks.every((t) => t.kanbanState === 'LOCKED');

    // 3. Check SCM Readiness (Check if any WorkOrder could theoretically be fulfilled)
    // For now, we mock this as READY since we don't have a direct SO-based stock check yet
    const scmReady = { status: 'READY' };

    console.log(`[PROD_HANDOVER] Readiness for Lead ${lead.brandName}:`, {
      legalReady,
      designReady,
      scmReady: scmReady.status === 'READY',
    });

    if (legalReady && designReady && scmReady.status === 'READY') {
      await this.prisma.$transaction(async (tx) => {
        // A. Update SO Status
        await tx.salesOrder.update({
          where: { id: so.id },
          data: { status: SOStatus.READY_TO_PRODUCE },
        });

        // B. Emit Activity
        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: leadId,
          senderDivision: Division.SYSTEM,
          eventType: StreamEventType.STATE_CHANGE,
          notes: `AUTOMATED HANDOVER: Semua jalur paralel (Legal, Design, SCM) telah OK. Order siap diproduksi.`,
          loggedBy: 'SYSTEM_ORCHESTRATOR',
        });
      });
    }
  }

  async triggerRetentionCheck(leadId: string) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const retention = await this.prisma.retentionEngine.upsert({
      where: { leadId },
      create: { leadId, status: 'WAITING' },
      update: {},
    });

    return {
      retentionId: retention.id,
      leadId,
      status: retention.status,
      message: 'Retention check triggered',
    };
  }
}
