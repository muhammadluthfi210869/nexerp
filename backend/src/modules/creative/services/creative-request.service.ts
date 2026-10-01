import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { ApprovalStatus, DesignState } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DESIGN_REVISION_BOUND,
  DESIGN_REVISION_BOUND_REACHED,
} from './creative-workflow.service';

@Injectable()
export class CreativeRequestService {
  private readonly DEFAULT_SLA_DAYS = 14;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private badRequest(reasonCode: string, message: string) {
    return new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message,
      reason_code: reasonCode,
    });
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
