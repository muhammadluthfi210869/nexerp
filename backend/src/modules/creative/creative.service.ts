import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

const VALID_TRANSITIONS: Record<DesignState, DesignState[]> = {
  [DesignState.INBOX]: [DesignState.IN_PROGRESS],
  [DesignState.IN_PROGRESS]: [DesignState.WAITING_APJ],
  [DesignState.WAITING_APJ]: [DesignState.WAITING_CLIENT, DesignState.REVISION],
  [DesignState.WAITING_CLIENT]: [DesignState.LOCKED, DesignState.REVISION],
  [DesignState.REVISION]: [DesignState.IN_PROGRESS],
  [DesignState.LOCKED]: [],
};

@Injectable()
export class CreativeService {
  private readonly REVISION_LIMIT = 3;
  private readonly DEFAULT_SLA_DAYS = 14;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => BussdevService))
    private bussdevService: BussdevService,
  ) {}

  private assertTransition(from: DesignState, to: DesignState, action: string) {
    const allowed = VALID_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid state transition: Cannot move from ${from} to ${to} (${action})`,
      );
    }
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
      if (task.revisionCount >= this.REVISION_LIMIT && task.isLocked) {
        throw new BadRequestException(
          'REVISION OVERLIMIT: Task is locked. BusDev must unlock this task to continue.',
        );
      }

      const nextVersionNumber = task.versions.length + 1;

      const newRevisionCount =
        nextVersionNumber > 1 ? nextVersionNumber - 1 : 0;

      const nextState =
        task.kanbanState === DesignState.INBOX ||
        task.kanbanState === DesignState.REVISION
          ? DesignState.IN_PROGRESS
          : task.kanbanState;

      // Lock the task when revision limit is hit by the upload itself
      const shouldLock = newRevisionCount >= this.REVISION_LIMIT;

      await tx.designTask.update({
        where: { id: data.taskId },
        data: {
          kanbanState: nextState,
          revisionCount: newRevisionCount,
          isLocked: shouldLock,
        },
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
      });
      if (!task) throw new NotFoundException('Task not found');

      this.assertTransition(
        task.kanbanState,
        data.status === ApprovalStatus.APPROVED
          ? DesignState.WAITING_CLIENT
          : DesignState.REVISION,
        'apjReview',
      );

      await tx.designFeedback.create({
        data: {
          taskId: data.taskId,
          fromDivision: Division.LEGAL,
          authorId: data.authorId,
          content: data.notes,
          approvalStatus: data.status,
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
          isLocked:
            nextState === DesignState.REVISION &&
            task.revisionCount >= this.REVISION_LIMIT,
        },
      });

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

  async clientReview(taskId: string, status: ApprovalStatus, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.designTask.findUnique({
        where: { id: taskId },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });

      if (!task) throw new NotFoundException('Task not found');

      this.assertTransition(
        task.kanbanState,
        status === ApprovalStatus.APPROVED
          ? DesignState.LOCKED
          : DesignState.REVISION,
        'clientReview',
      );

      const latestVersion = task.versions[0];

      if (status === ApprovalStatus.APPROVED) {
        const updated = await tx.designTask.update({
          where: { id: taskId },
          data: {
            kanbanState: DesignState.LOCKED,
            isFinal: true,
            finalArtworkUrl: latestVersion?.artworkUrl,
            finalMockupUrl: latestVersion?.mockupUrl,
          },
        });

        await tx.purchaseOrder.create({
          data: {
            poNumber: `PO-DESIGN-${task.id.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`,
            notes: `AUTO-GEN FROM DESIGN TASK: ${task.id} | Lead: ${task.leadId} | Artwork: ${latestVersion?.artworkUrl || 'N/A'}`,
            lead: task.leadId ? { connect: { id: task.leadId } } : undefined,
            status: POStatus.ORDERED,
          },
        });

        this.eventEmitter.emit('creative.update', {
          taskId,
          state: DesignState.LOCKED,
        });
        this.eventEmitter.emit('creative.task.locked', {
          taskId,
          finalArtworkUrl: latestVersion?.artworkUrl,
          finalMockupUrl: latestVersion?.mockupUrl,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'CREATIVE',
          notes: `Design task ${taskId.slice(0, 8)} LOCKED — Client approved. Auto-generated PO.`,
          loggedBy: 'SYSTEM:CREATIVE',
        });

        if (task.leadId) {
          await this.bussdevService.checkSalesOrderReadiness(task.leadId);
        }

        return updated;
      } else {
        const updated = await tx.designTask.update({
          where: { id: taskId },
          data: {
            kanbanState: DesignState.REVISION,
            isLocked: task.revisionCount >= this.REVISION_LIMIT,
          },
        });

        this.eventEmitter.emit('creative.update', {
          taskId,
          state: DesignState.REVISION,
        });
        this.eventEmitter.emit('creative.task.rejected', { taskId, notes });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'CREATIVE',
          notes: `Client rejected design task ${taskId.slice(0, 8)} → REVISION`,
          loggedBy: 'SYSTEM:CREATIVE',
        });
        return updated;
      }
    });
  }

  async unlockTask(data: {
    taskId: string;
    action: 'CHARGE' | 'WAIVE';
    managerPin?: string;
    userId: string;
  }) {
    const task = await this.prisma.designTask.findUnique({
      where: { id: data.taskId },
      include: { salesOrder: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (!task.isLocked) {
      throw new BadRequestException('Task is not locked.');
    }

    if (data.action === 'WAIVE') {
      if (!data.managerPin) {
        throw new BadRequestException('Manager PIN required for WAIVE action.');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });
      if (!user?.managerPin) {
        throw new BadRequestException(
          'Manager PIN not set. Please set it in your profile.',
        );
      }
      const isValid = await bcrypt.compare(data.managerPin, user.managerPin);
      if (!isValid) {
        throw new BadRequestException('INVALID MANAGER PIN: Unlock denied.');
      }
    }

    const result = await this.prisma.designTask.update({
      where: { id: data.taskId },
      data: { isLocked: false },
    });

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
      notes: `Design task ${data.taskId.slice(0, 8)} unlocked (${data.action}) by BusDev override`,
      loggedBy: data.userId,
    });

    return result;
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
