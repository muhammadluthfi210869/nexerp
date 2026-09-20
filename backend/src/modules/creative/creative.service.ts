import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import {
  ApprovalStatus,
  DesignState,
  Division,
  POStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BussdevService } from '../bussdev/bussdev.service';
import { Inject, forwardRef } from '@nestjs/common';
import { AuditService } from '../../platform/audit/audit.service';
import { OutboxService } from '../../platform/outbox/outbox.service';

/** BUS-RULE-110 reason code. */
export const DESIGN_VERSION_REQUIRED = 'DESIGN_VERSION_REQUIRED';
/** BUS-RULE-111 reason code. */
export const DESIGN_REVISION_BOUND_REACHED = 'DESIGN_REVISION_BOUND_REACHED';
/** BUS-RULE-111 reason codes for the supervisor reopen path. */
export const DESIGN_REOPEN_UNAUTHORIZED = 'DESIGN_REOPEN_UNAUTHORIZED';
export const DESIGN_NOT_LOCKED = 'DESIGN_NOT_LOCKED';
export const REOPEN_REASON_REQUIRED = 'REOPEN_REASON_REQUIRED';
export const DESIGN_INVALID_TRANSITION = 'DESIGN_INVALID_TRANSITION';

/** BUS-RULE-111 / DEC-2026-09-20-055: the revision bound. */
export const DESIGN_REVISION_BOUND = 3;
/** Roles allowed to reopen a design whose allowance is exhausted. */
export const DESIGN_REOPEN_ROLES = ['SUPER_ADMIN', 'DIRECTOR'];

const VALID_TRANSITIONS: Record<DesignState, DesignState[]> = {
  [DesignState.INBOX]: [DesignState.IN_PROGRESS],
  [DesignState.IN_PROGRESS]: [DesignState.WAITING_APJ],
  [DesignState.WAITING_APJ]: [DesignState.WAITING_CLIENT, DesignState.REVISION],
  [DesignState.WAITING_CLIENT]: [DesignState.LOCKED, DesignState.REVISION],
  [DesignState.REVISION]: [DesignState.IN_PROGRESS],
  // DEC-2026-09-20-052: a client-approved artwork is NOT hard-locked. It can still
  // be revised while the hard lock (`isLocked`) is off. `LOCKED` is the finalized
  // state — what puts a design on the finalized-designs page — not a revision wall.
  [DesignState.LOCKED]: [DesignState.REVISION],
};

@Injectable()
export class CreativeService {
  private readonly DEFAULT_SLA_DAYS = 14;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => BussdevService))
    private bussdevService: BussdevService,
    private audit: AuditService,
    private outbox: OutboxService,
  ) {}

  private badRequest(reasonCode: string, message: string) {
    return new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message,
      reason_code: reasonCode,
    });
  }

  private assertTransition(from: DesignState, to: DesignState, action: string) {
    const allowed = VALID_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw this.badRequest(
        DESIGN_INVALID_TRANSITION,
        `Invalid state transition: Cannot move from ${from} to ${to} (${action})`,
      );
    }
  }

  /**
   * BUS-RULE-110: an approval decision must name the artwork version it decided on,
   * and it must be the current one. Inferring the version from timestamps — or from
   * "whichever row happened to be latest" — is exactly what let an old artwork be
   * approved while a newer one was already on the table.
   */
  private assertDecisionVersion(
    versionId: string | undefined,
    latest: { id: string; versionNumber: number } | undefined,
  ) {
    if (!latest) {
      throw this.badRequest(
        DESIGN_VERSION_REQUIRED,
        'Belum ada artwork yang bisa diputuskan untuk task ini.',
      );
    }
    if (!versionId) {
      throw this.badRequest(
        DESIGN_VERSION_REQUIRED,
        'Keputusan desain harus menunjuk versi artwork (version_id).',
      );
    }
    if (versionId !== latest.id) {
      throw this.badRequest(
        DESIGN_VERSION_REQUIRED,
        `Keputusan harus menunjuk versi terbaru (V${latest.versionNumber}). Versi lain sudah tidak berlaku.`,
      );
    }
  }

  private latestVersionOf<T extends { versionNumber: number }>(
    versions: T[],
  ): T | undefined {
    return [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
  }

  async getAvailableSalesOrders() {
    return this.prisma.salesOrder.findMany({
      where: {
        status: { in: ['PENDING_DP', 'ACTIVE'] },
        deletedAt: null,
      },
      include: {
        lead: {
          select: {
            clientName: true,
            brandName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(data: {
    leadId: string;
    brief: string;
    soId?: string;
    taskType?: string;
    createdBy?: string;
  }) {
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + this.DEFAULT_SLA_DAYS);

    const task = await this.prisma.designTask.create({
      data: {
        leadId: data.leadId,
        brief: data.brief,
        soId: data.soId,
        taskType: data.taskType,
        slaDeadline,
      },
    });

    this.eventEmitter.emit('creative.task.created', {
      taskId: task.id,
      leadId: data.leadId,
      soId: data.soId,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'CREATIVE',
      notes: `Design task created for lead ${data.leadId}: ${data.brief.slice(0, 60)}`,
      loggedBy: data.createdBy || 'SYSTEM:CREATIVE',
    });

    return task;
  }

  async uploadVersion(data: {
    taskId: string;
    artworkUrl: string | null;
    mockupUrl?: string | null;
    printSpecs?: any;
    uploadedBy?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.designTask.findUnique({
        where: { id: data.taskId },
        include: { versions: true },
      });

      if (!task) throw new NotFoundException('Design Task not found');

      // State Machine: only INBOX, IN_PROGRESS, or REVISION can upload
      if (
        task.kanbanState !== DesignState.INBOX &&
        task.kanbanState !== DesignState.IN_PROGRESS &&
        task.kanbanState !== DesignState.REVISION
      ) {
        throw new BadRequestException(
          `Cannot upload version in state ${task.kanbanState}. Task is with Legal or Client.`,
        );
      }

      // Constraint: Revision Cap Limit
      if (task.revisionCount >= DESIGN_REVISION_BOUND && task.isLocked) {
        throw this.badRequest(
          DESIGN_REVISION_BOUND_REACHED,
          'REVISION OVERLIMIT: Batas revisi sudah tercapai. Supervisor harus membuka task ini.',
        );
      }

      const nextVersionNumber = task.versions.length + 1;

      const nextState =
        task.kanbanState === DesignState.INBOX ||
        task.kanbanState === DesignState.REVISION
          ? DesignState.IN_PROGRESS
          : task.kanbanState;

      // BUS-RULE-111: `revisionCount` is owned by the revision transitions
      // (apjReview / clientReview) and by the supervisor reopen — NOT by the upload.
      // Deriving it from `versions.length` here is what made the supervisor reopen
      // useless: it reset the counter to 0 and the next upload immediately wrote it
      // back to `versions.length - 1`, re-locking the task.
      await tx.designTask.update({
        where: { id: data.taskId },
        data: { kanbanState: nextState },
      });

      this.eventEmitter.emit('creative.update', {
        taskId: data.taskId,
        state: nextState,
      });
      this.eventEmitter.emit('creative.version.uploaded', {
        taskId: data.taskId,
        versionNumber: nextVersionNumber,
        artworkUrl: data.artworkUrl,
      });
      this.eventEmitter.emit('activity.logged', {
        senderDivision: 'CREATIVE',
        notes: `Version V${nextVersionNumber} uploaded for design task ${data.taskId.slice(0, 8)}`,
        loggedBy: data.uploadedBy || 'SYSTEM:CREATIVE',
      });

      return tx.designVersion.create({
        data: {
          taskId: data.taskId,
          versionNumber: nextVersionNumber,
          artworkUrl: data.artworkUrl,
          mockupUrl: data.mockupUrl,
          printSpecs: data.printSpecs,
          uploadedBy: data.uploadedBy,
        },
      });
    });
  }

  async submitToApj(taskId: string) {
    const task = await this.prisma.designTask.findUnique({
      where: { id: taskId },
      include: { versions: true },
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.versions.length === 0) {
      throw new BadRequestException('Cannot submit: No artwork uploaded yet.');
    }

    this.assertTransition(
      task.kanbanState,
      DesignState.WAITING_APJ,
      'submitToApj',
    );

    const result = await this.prisma.designTask.update({
      where: { id: taskId },
      data: { kanbanState: DesignState.WAITING_APJ },
    });

    this.eventEmitter.emit('creative.update', {
      taskId,
      state: DesignState.WAITING_APJ,
    });
    this.eventEmitter.emit('creative.task.submitted', { taskId });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'CREATIVE',
      notes: `Design task ${taskId.slice(0, 8)} submitted to Legal (APJ)`,
      loggedBy: 'SYSTEM:CREATIVE',
    });
    return result;
  }

  async apjReview(data: {
    taskId: string;
    status: ApprovalStatus;
    notes?: string;
    authorId: string;
    pin: string;
    ipAddress: string | null;
    versionId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: data.authorId } });
      if (!user) throw new NotFoundException('User not found');
      if (!user.approvalPin) {
        throw new BadRequestException(
          'PIN not set. Please set your Approval PIN in profile.',
        );
      }

      const isPinValid = await bcrypt.compare(data.pin, user.approvalPin);
      if (!isPinValid)
        throw new BadRequestException('INVALID PIN: E-Signature failed.');

      const task = await tx.designTask.findUnique({
        where: { id: data.taskId },
        include: { versions: true },
      });
      if (!task) throw new NotFoundException('Task not found');

      this.assertTransition(
        task.kanbanState,
        data.status === ApprovalStatus.APPROVED
          ? DesignState.WAITING_CLIENT
          : DesignState.REVISION,
        'apjReview',
      );

      const latestVersion = this.latestVersionOf(task.versions);
      this.assertDecisionVersion(data.versionId, latestVersion);

      const isRevision = data.status !== ApprovalStatus.APPROVED;
      if (isRevision && task.isLocked) {
        throw this.badRequest(
          DESIGN_REVISION_BOUND_REACHED,
          'Batas revisi sudah tercapai. Supervisor harus membuka task ini sebelum revisi berikutnya.',
        );
      }
      const revisionCount = isRevision
        ? task.revisionCount + 1
        : task.revisionCount;
      const isLocked = revisionCount >= DESIGN_REVISION_BOUND;

      await tx.designFeedback.create({
        data: {
          taskId: data.taskId,
          fromDivision: Division.LEGAL,
          authorId: data.authorId,
          content: data.notes,
          approvalStatus: data.status,
          versionId: latestVersion!.id,
          ipAddress: data.ipAddress,
          signatureHash: await bcrypt.hash(
            `${data.authorId}-${Date.now()}`,
            10,
          ),
        },
      });

      const nextState =
        data.status === ApprovalStatus.APPROVED
          ? DesignState.WAITING_CLIENT
          : DesignState.REVISION;

      const result = await tx.designTask.update({
        where: { id: data.taskId },
        data: {
          kanbanState: nextState,
          // BUS-RULE-111: a revision request consumes the allowance and the bound
          // hard-locks the task. Previously the APJ path never incremented the
          // counter, so an APJ could demand revisions forever.
          revisionCount,
          isLocked: isRevision ? isLocked : task.isLocked,
        },
      });

      // BUS-RULE-113: the decision and its audit row commit in this transaction.
      await this.audit.withAudit<any>(
        tx,
        {
          actorUserId: data.authorId,
          source: 'creative',
          entityType: 'DesignTask',
          entityId: data.taskId,
          action: isRevision ? 'APJ_REQUEST_REVISION' : 'APJ_APPROVE_DESIGN',
          beforeSnapshot: { kanbanState: task.kanbanState, revisionCount: task.revisionCount, isLocked: task.isLocked },
          afterSnapshot: { kanbanState: nextState, revisionCount, isLocked: result.isLocked, version_id: latestVersion!.id },
        },
        async () => result,
      );

      await this.outbox.enqueue(
        tx,
        {
          eventType: isRevision
            ? 'design.revision_requested'
            : 'design.apj_approved',
          aggregateType: 'DesignTask',
          aggregateId: data.taskId,
          payload: isRevision
            ? {
                design_task_id: data.taskId,
                version_id: latestVersion!.id,
                revision_count: revisionCount,
                is_locked: result.isLocked,
                reason: data.notes ?? null,
                requested_at: new Date().toISOString(),
              }
            : {
                design_task_id: data.taskId,
                version_id: latestVersion!.id,
                approved_by: data.authorId,
                approved_at: new Date().toISOString(),
              },
          correlationId: data.taskId,
        },
        { requireExternalTransaction: true },
      );

      this.eventEmitter.emit('creative.update', {
        taskId: data.taskId,
        state: nextState,
      });
      this.eventEmitter.emit('creative.task.apj_reviewed', {
        taskId: data.taskId,
        status: data.status,
        nextState,
      });
      this.eventEmitter.emit('activity.logged', {
        senderDivision: 'LEGAL',
        notes: `APJ ${data.status} design task ${data.taskId.slice(0, 8)} → ${nextState}`,
        loggedBy: data.authorId,
      });
      return result;
    });
  }

  /**
   * BUS-RULE-110 / BUS-RULE-111. The decision names the version it decided on, and
   * the revision allowance is enforced here rather than only in the UI.
   *
   * DEC-2026-09-20-052: approval sets `isFinal` (so the design appears on the
   * finalized-designs page) and locks the task ONLY if the allowance is exhausted.
   * An approval is not a revision wall.
   */
  async clientReview(
    taskId: string,
    status: ApprovalStatus,
    options: {
      versionId?: string;
      authorId: string;
      notes?: string;
      reason?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.designTask.findUnique({
        where: { id: taskId },
        include: { versions: true },
      });

      if (!task) throw new NotFoundException('Task not found');

      const isApproval = status === ApprovalStatus.APPROVED;

      this.assertTransition(
        task.kanbanState,
        isApproval ? DesignState.LOCKED : DesignState.REVISION,
        'clientReview',
      );

      const latestVersion = this.latestVersionOf(task.versions);
      this.assertDecisionVersion(options.versionId, latestVersion);

      if (isApproval) {
        const isLocked = task.revisionCount >= DESIGN_REVISION_BOUND;

        const updated = await tx.designTask.update({
          where: { id: taskId },
          data: {
            kanbanState: DesignState.LOCKED,
            isFinal: true,
            isLocked,
            finalArtworkUrl: latestVersion!.artworkUrl,
            finalMockupUrl: latestVersion!.mockupUrl,
          },
        });

        await tx.designFeedback.create({
          data: {
            taskId,
            fromDivision: Division.BD,
            authorId: options.authorId,
            content: options.notes,
            approvalStatus: ApprovalStatus.APPROVED,
            versionId: latestVersion!.id,
          },
        });

        await tx.purchaseOrder.create({
          data: {
            poNumber: `PO-DESIGN-${task.id.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`,
            notes: `AUTO-GEN FROM DESIGN TASK: ${task.id} | Lead: ${task.leadId} | Artwork: ${latestVersion!.artworkUrl || 'N/A'}`,
            lead: task.leadId ? { connect: { id: task.leadId } } : undefined,
            status: POStatus.ORDERED,
          },
        });

        await this.audit.withAudit<any>(
          tx,
          {
            actorUserId: options.authorId,
            source: 'creative',
            entityType: 'DesignTask',
            entityId: taskId,
            action: 'CLIENT_APPROVE_DESIGN',
            beforeSnapshot: { kanbanState: task.kanbanState, revisionCount: task.revisionCount },
            afterSnapshot: {
              kanbanState: DesignState.LOCKED,
              isFinal: true,
              isLocked,
              version_id: latestVersion!.id,
            },
          },
          async () => updated,
        );

        await this.outbox.enqueue(
          tx,
          {
            eventType: 'design.finalized',
            aggregateType: 'DesignTask',
            aggregateId: taskId,
            payload: {
              design_task_id: taskId,
              version_id: latestVersion!.id,
              revision_count: task.revisionCount,
              is_locked: isLocked,
              finalized_at: new Date().toISOString(),
            },
            correlationId: taskId,
          },
          { requireExternalTransaction: true },
        );

        this.eventEmitter.emit('creative.update', {
          taskId,
          state: DesignState.LOCKED,
        });
        this.eventEmitter.emit('creative.task.locked', {
          taskId,
          finalArtworkUrl: latestVersion!.artworkUrl,
          finalMockupUrl: latestVersion!.mockupUrl,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'CREATIVE',
          notes: `Design task ${taskId.slice(0, 8)} LOCKED — Client approved V${latestVersion!.versionNumber}. Auto-generated PO.`,
          loggedBy: 'SYSTEM:CREATIVE',
        });

        if (task.leadId) {
          await this.bussdevService.checkSalesOrderReadiness(task.leadId);
        }

        return updated;
      }

      // Revision request — in-bound only. Past the bound the task is hard-locked and
      // only the supervisor reopen path (unlockTask) may move it.
      if (task.isLocked) {
        throw this.badRequest(
          DESIGN_REVISION_BOUND_REACHED,
          'Batas revisi sudah tercapai. Revisi berikutnya memerlukan pembukaan oleh supervisor.',
        );
      }
      const revisionCount = task.revisionCount + 1;
      const isLocked = revisionCount >= DESIGN_REVISION_BOUND;

      const updated = await tx.designTask.update({
        where: { id: taskId },
        data: {
          kanbanState: DesignState.REVISION,
          revisionCount,
          isLocked,
          isFinal: false,
        },
      });

      await tx.designFeedback.create({
        data: {
          taskId,
          fromDivision: Division.BD,
          authorId: options.authorId,
          content: options.reason ?? options.notes,
          approvalStatus: ApprovalStatus.REJECTED,
          versionId: latestVersion!.id,
        },
      });

      await this.audit.withAudit<any>(
        tx,
        {
          actorUserId: options.authorId,
          source: 'creative',
          entityType: 'DesignTask',
          entityId: taskId,
          action: 'CLIENT_REQUEST_REVISION',
          beforeSnapshot: { kanbanState: task.kanbanState, revisionCount: task.revisionCount },
          afterSnapshot: { kanbanState: DesignState.REVISION, revisionCount, isLocked, version_id: latestVersion!.id },
        },
        async () => updated,
      );

      await this.outbox.enqueue(
        tx,
        {
          eventType: 'design.revision_requested',
          aggregateType: 'DesignTask',
          aggregateId: taskId,
          payload: {
            design_task_id: taskId,
            version_id: latestVersion!.id,
            revision_count: revisionCount,
            is_locked: isLocked,
            reason: options.reason ?? options.notes ?? null,
            requested_at: new Date().toISOString(),
          },
          correlationId: taskId,
        },
        { requireExternalTransaction: true },
      );

      this.eventEmitter.emit('creative.update', {
        taskId,
        state: DesignState.REVISION,
      });
      this.eventEmitter.emit('creative.task.rejected', {
        taskId,
        notes: options.reason ?? options.notes,
      });
      this.eventEmitter.emit('activity.logged', {
        senderDivision: 'CREATIVE',
        notes: `Client rejected design task ${taskId.slice(0, 8)} → REVISION (${revisionCount}/${DESIGN_REVISION_BOUND})`,
        loggedBy: 'SYSTEM:CREATIVE',
      });
      return updated;
    });
  }

  /**
   * BUS-RULE-111 supervisor reopen (DEC-2026-09-20-056).
   *
   * Past the bound the design is hard-locked; a supervisor may reopen it and the
   * revision allowance is RECOUNTED FROM ZERO. Three things were missing before:
   * the allowance was never reset (so the next upload re-locked the task
   * immediately), the reopen left no record in the design history, and any caller
   * could unlock regardless of role.
   */
  async unlockTask(data: {
    taskId: string;
    action: 'CHARGE' | 'WAIVE';
    managerPin?: string;
    userId: string;
    reason?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.designTask.findUnique({
        where: { id: data.taskId },
        include: { salesOrder: true, versions: true },
      });
      if (!task) throw new NotFoundException('Task not found');

      const user = await tx.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new NotFoundException('User not found');

      const authorised = (user.roles ?? []).some((r) =>
        DESIGN_REOPEN_ROLES.includes(r),
      );
      if (!authorised) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: `Hanya ${DESIGN_REOPEN_ROLES.join(' / ')} yang boleh membuka kembali desain yang terkunci.`,
          reason_code: DESIGN_REOPEN_UNAUTHORIZED,
        });
      }

      if (!task.isLocked) {
        throw this.badRequest(
          DESIGN_NOT_LOCKED,
          'Task tidak dalam keadaan terkunci, jadi tidak ada yang perlu dibuka.',
        );
      }
      if (!data.reason) {
        throw this.badRequest(
          REOPEN_REASON_REQUIRED,
          'Alasan pembukaan kembali wajib diisi.',
        );
      }

      if (data.action === 'WAIVE') {
        if (!data.managerPin) {
          throw new BadRequestException(
            'Manager PIN required for WAIVE action.',
          );
        }
        if (!user.managerPin) {
          throw new BadRequestException(
            'Manager PIN not set. Please set it in your profile.',
          );
        }
        const isValid = await bcrypt.compare(data.managerPin, user.managerPin);
        if (!isValid) {
          throw new BadRequestException('INVALID MANAGER PIN: Unlock denied.');
        }
      }

      // The reopen is recorded in the design history so the override is auditable.
      const latestVersion = this.latestVersionOf(task.versions);
      await tx.designFeedback.create({
        data: {
          taskId: data.taskId,
          fromDivision: Division.MANAGEMENT,
          authorId: data.userId,
          content: data.reason,
          versionId: latestVersion?.id,
        },
      });

      const result = await tx.designTask.update({
        where: { id: data.taskId },
        data: {
          isLocked: false,
          revisionCount: 0, // allowance restarts from zero
          isFinal: false,
          kanbanState:
            task.kanbanState === DesignState.LOCKED
              ? DesignState.REVISION
              : task.kanbanState,
        },
      });

      await this.audit.withAudit<any>(
        tx,
        {
          actorUserId: data.userId,
          source: 'creative',
          entityType: 'DesignTask',
          entityId: data.taskId,
          action: 'SUPERVISOR_REOPEN_DESIGN',
          beforeSnapshot: {
            kanbanState: task.kanbanState,
            revisionCount: task.revisionCount,
            isLocked: task.isLocked,
            isFinal: task.isFinal,
          },
          afterSnapshot: {
            kanbanState: result.kanbanState,
            revisionCount: result.revisionCount,
            isLocked: result.isLocked,
            reason: data.reason,
            action: data.action,
          },
        },
        async () => result,
      );

      await this.outbox.enqueue(
        tx,
        {
          eventType: 'design.reopened',
          aggregateType: 'DesignTask',
          aggregateId: data.taskId,
          payload: {
            design_task_id: data.taskId,
            reopened_by: data.userId,
            reason: data.reason,
            revision_count_before: task.revisionCount,
            reopened_at: new Date().toISOString(),
          },
          correlationId: data.taskId,
        },
        { requireExternalTransaction: true },
      );

      this.eventEmitter.emit('creative.update', {
        taskId: data.taskId,
        state: result.kanbanState,
      });
      this.eventEmitter.emit('creative.task.unlocked', {
        taskId: data.taskId,
        action: data.action,
      });
      this.eventEmitter.emit('activity.logged', {
        senderDivision: 'MANAGEMENT',
        notes: `Design task ${data.taskId.slice(0, 8)} reopened (${data.action}) — allowance reset. Reason: ${data.reason}`,
        loggedBy: data.userId,
      });

      return result;
    });
  }

  /**
   * The finalized-designs read (owner decision 2026-09-20, DEC-2026-09-20-054/057).
   * Only designs whose artwork was approved by the client, with the version that was
   * approved and the full decision history. Broad internal read: every PIC who
   * appears on the milestone checklist progress/tracking may read it.
   */
  async getFinalizedDesigns(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = { isFinal: true };
    const [designs, total] = await Promise.all([
      this.prisma.designTask.findMany({
        where,
        skip,
        take: limit,
        include: {
          lead: {
            select: { id: true, clientName: true, brandName: true },
          },
          versions: { orderBy: { versionNumber: 'desc' } },
          feedbacks: {
            orderBy: { createdAt: 'desc' },
            include: {
              version: { select: { id: true, versionNumber: true } },
              author: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.designTask.count({ where }),
    ]);

    return {
      data: designs.map((d) => ({
        ...d,
        approvedVersion:
          d.feedbacks.find((f) => f.approvalStatus === ApprovalStatus.APPROVED)
            ?.version ?? null,
      })),
      total,
      page,
      limit,
    };
  }

  /** The revision + decision history for one design task. */
  async getTaskHistory(taskId: string) {
    const task = await this.prisma.designTask.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        brief: true,
        kanbanState: true,
        revisionCount: true,
        isLocked: true,
        isFinal: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    const feedbacks = await this.prisma.designFeedback.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        version: { select: { id: true, versionNumber: true } },
        author: { select: { id: true, fullName: true } },
      },
    });

    return {
      task,
      revisionBound: DESIGN_REVISION_BOUND,
      allowanceLeft: Math.max(0, DESIGN_REVISION_BOUND - task.revisionCount),
      history: feedbacks,
    };
  }

  async getAllTasks(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      this.prisma.designTask.findMany({
        skip,
        take: limit,
        include: {
          lead: {
            select: {
              id: true,
              clientName: true,
              brandName: true,
              productInterest: true,
            },
          },
          versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.designTask.count(),
    ]);
    return { data: tasks, total, page, limit };
  }

  async getBoard(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      this.prisma.designTask.findMany({
        skip,
        take: limit,
        include: {
          lead: {
            select: {
              clientName: true,
              brandName: true,
              productInterest: true,
            },
          },
          versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.designTask.count(),
    ]);
    return { data: tasks, total, page, limit };
  }
}
