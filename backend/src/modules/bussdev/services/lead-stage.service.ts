import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../system/id-generator.service';
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
export class LeadStageService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    private auditService: AuditService,
    private outboxService: OutboxService,
  ) {}

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
    const allowed = LeadStageService.WORKFLOW_TRANSITIONS[from];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  private isUuid(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    );
  }

  private assertTrustedOrganization(orgId: unknown): string {
    if (!this.isUuid(orgId)) {
      throw new BadRequestException({
        code: 'TENANT_UNRESOLVED',
        message: 'Tenant wajib diisi dari konteks server.',
      });
    }
    return orgId;
  }

  async ensureConsentNotWithdrawn(tx: any, leadId: string): Promise<void> {
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

  async ensureRequiredConsentGranted(
    tx: any,
    captureId: string,
  ): Promise<void> {
    const consent = await tx.leadAttribute.findFirst({
      where: { leadId: captureId, key: CONSENT_KEY, confirmed: true },
      orderBy: { createdAt: 'desc' },
      select: { value: true },
    });
    if (consent && consent.value !== 'true') return;
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

  private computeAdvancePayloadDigest(payload: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');
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

      if (
        currentLead.status !== dto.newStatus &&
        !LeadStageService.isLegalTransition(currentLead.status, dto.newStatus)
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
            ' ke SAMPLE_APPROVED → SPK_SIGNED (AUTO HANDOVER ke PRODUCTION)'
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
              sampleCode: sampleCode,
              leadId: leadId,
              productName:
                currentLead.brandName ||
                currentLead.productInterest ||
                'Sample Product',
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

      return updatedLead;
    });
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
    if (!actor.roles.some((r) => ['COMMERCIAL', 'SUPER_ADMIN', 'DIRECTOR'].includes(r))) {
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
    const payloadDigest = this.computeAdvancePayloadDigest({
      leadId,
      newStatus: dto.newStatus,
      action: dto.action,
      loggedBy: dto.loggedBy,
    });

    return this.prisma.$transaction(async (tx) => {
      const lockKey = `nex_p07_advance:${orgId}:${leadId}:${idemKey}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;

      const currentLead = await tx.salesLead.findUnique({
        where: { id: leadId },
      });
      if (!currentLead || currentLead.organizationId !== orgId) {
        throw new NotFoundException('Lead tidak ditemukan');
      }

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

      if (currentLead.leadCaptureId) {
        await this.ensureRequiredConsentGranted(tx, currentLead.leadCaptureId);
      }

      if (
        currentLead.status !== dto.newStatus &&
        !LeadStageService.isLegalTransition(currentLead.status, dto.newStatus)
      ) {
        throw new BadRequestException({
          code: 'WORKFLOW_TRANSITION_ILLEGAL',
          message: `Transisi ${currentLead.status} → ${dto.newStatus} tidak diizinkan.`,
        });
      }

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
              valueSuggestion:
                dto.valueSuggestion || currentLead.valueSuggestion,
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
                  productName:
                    currentLead.brandName || currentLead.productInterest,
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
                  productName:
                    currentLead.brandName ||
                    currentLead.productInterest ||
                    'Sample Product',
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
              notes:
                dto.notes ||
                `Lead Stage berubah dari ${currentLead.status} ke ${dto.newStatus}`,
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
            notes:
              dto.notes ||
              `Lead Stage berubah dari ${currentLead.status} ke ${dto.newStatus}`,
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

      this.eventEmitter.emit('lead.status.changed', {
        leadId,
        previousStatus: lead.status,
        newStatus: newStatus,
      });

      return updatedLead;
    });
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

  async removeLead(id: string) {
    const lead = await this.prisma.salesLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.prisma.salesLead.delete({ where: { id } });
    return { deleted: true };
  }

  @OnEvent('finance.payment_verified_sales')
  async handlePaymentVerifiedSales(payload: { leadId: string }) {
    await this.advanceLeadStage(payload.leadId, {
      action: 'STAGE_UPDATED',
      newStatus: WorkflowStatus.SPK_SIGNED,
      loggedBy: 'SYSTEM_FINANCE_AUTO',
      notes: 'Otomatis masuk ke Production Pipeline setelah DP Terverifikasi.',
    });
  }

  @OnEvent('sample.feedback_recorded')
  async handleSampleFeedbackRecorded(payload: {
    leadId: string;
    isApproved: boolean;
    feedback: string;
    loggedBy: string;
  }) {
    if (payload.isApproved) {
      await this.advanceLeadStage(payload.leadId, {
        action: 'STAGE_UPDATED',
        newStatus: WorkflowStatus.SAMPLE_APPROVED,
        notes: `Sample ACC oleh client. Feedback: ${payload.feedback}`,
        loggedBy: payload.loggedBy,
      });
    }
  }
}
