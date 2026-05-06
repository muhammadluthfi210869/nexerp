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

@Injectable()
export class CreativeService {
  private readonly REVISION_LIMIT = 3;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => BussdevService))
    private bussdevService: BussdevService,
  ) {}

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

  async createTask(
    leadId: string,
    brief: string,
    soId?: string,
    taskType?: string,
  ) {
    const task = await this.prisma.designTask.create({
      data: {
        leadId,
        brief,
        soId,
      },
    });

    this.eventEmitter.emit('creative.task.created', {
      taskId: task.id,
      leadId,
      soId,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'CREATIVE',
      notes: `Design task created for lead ${leadId}: ${brief.slice(0, 60)}`,
      loggedBy: 'SYSTEM:CREATIVE',
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

      // Constraint: Revision Cap Limit
      if (task.revisionCount >= this.REVISION_LIMIT && task.isLocked) {
        throw new BadRequestException(
          'REVISION OVERLIMIT: Task is locked. BusDev must unlock this task to continue.',
        );
      }

      const nextVersionNumber = task.versions.length + 1;

      // Update task state & revision count
      // Revision count starts after the first version (V1) is uploaded.
      // So V1 -> 0 revisions, V2 -> 1 revision, V3 -> 2 revisions, V4 -> 3 revisions (MAX).
      const newRevisionCount =
        nextVersionNumber > 1 ? nextVersionNumber - 1 : 0;

      const result = await tx.designTask.update({
        where: { id: data.taskId },
        data: {
          kanbanState: DesignState.IN_PROGRESS,
          revisionCount: newRevisionCount,
        },
      });

      this.eventEmitter.emit('creative.update', {
        taskId: data.taskId,
        state: DesignState.IN_PROGRESS,
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

      // Create version record (Immutable history)
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

    if (!task || task.versions.length === 0) {
      throw new BadRequestException('Cannot submit: No artwork uploaded yet.');
    }

    const result = await this.prisma.designTask.update({
      where: { id: taskId },
      data: { kanbanState: DesignState.WAITING_APJ },
    });

    this.eventEmitter.emit('creative.update', {
      taskId,
      state: DesignState.WAITING_APJ,
    });
    this.eventEmitter.emit('creative.task.submitted', {
      taskId,
    });
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
    notes: string;
    authorId: string;
    pin: string;
    ipAddress: string | null;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. PIN Verification (Internal E-Signature)
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

      // 2. Create Feedback Log (Audit Trail)
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

      // 3. Update State
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

        // INTERLOCK: Auto-generate Printing PO in SCM
        await tx.purchaseOrder.create({
          data: {
            poNumber: `PO-DESIGN-${task.id.slice(0, 8)}`,
            notes: `AUTO-GEN FROM DESIGN TASK: ${task.id}`,
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

        // TRIGGER READINESS CHECK
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
        this.eventEmitter.emit('creative.task.rejected', {
          taskId,
          notes,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'CREATIVE',
          notes: `Client rejected design task ${taskId.slice(0, 8)} → REVISION`,
          loggedBy: 'SYSTEM:CREATIVE',
        });
        return updated;
      }
    });
  }

  async unlockTask(
    taskId: string,
    action: 'CHARGE' | 'WAIVE',
    managerPin?: string,
  ) {
    const task = await this.prisma.designTask.findUnique({
      where: { id: taskId },
      include: { salesOrder: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    // If WAIVE, we might want to check managerPin here (similar to apjReview)
    // For now, we unlock.

    const result = await this.prisma.designTask.update({
      where: { id: taskId },
      data: { isLocked: false },
    });

    this.eventEmitter.emit('creative.update', {
      taskId,
      state: result.kanbanState,
    });
    this.eventEmitter.emit('creative.task.unlocked', {
      taskId,
      action,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MANAGEMENT',
      notes: `Design task ${taskId.slice(0, 8)} unlocked (${action}) by BusDev override`,
      loggedBy: 'SYSTEM:MANAGEMENT',
    });

    return result;
  }

  async getAllTasks() {
    return this.prisma.designTask.findMany({
      include: {
        lead: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getBoard() {
    return this.prisma.designTask.findMany({
      include: {
        lead: {
          select: { clientName: true, brandName: true, productInterest: true },
        },
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });
  }
}
