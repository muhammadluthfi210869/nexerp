// Wave 3/D1 — CommunicationService.
//
// Notes/reply/mention/attach protocol. Every state-changing method:
//   1. Calls StateMachineService.transition() to log the event
//   2. Emits an internal EventEmitter2 event for WS gateway + listeners
//   3. Writes an ActivityLog row for the activity-stream UI
//
// Why this shape: the existing approval-granted listener already re-emits
// `notification.approval_granted` — Comms subscribes the same way. State
// machine is the single audit trail; the EventEmitter2 events are ephemeral
// notifications only.

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ThreadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { StateMachineService } from '../state-machine/state-machine.service';
import {
  ResourceNotFoundException,
  BusinessRuleViolationException,
} from '../../common/exceptions/api-exception';
import { FileStorageService } from '../../shared/storage/file-storage.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { LogActivityType } from '@prisma/client';

export interface CreateThreadInput {
  contextType: string;
  contextId: string;
  title: string;
  createdById: string;
}

export interface ReplyInput {
  threadId: string;
  authorId: string;
  body: string;
  parentReplyId?: string;
  mentionIds?: string[];
}

export interface AttachInput {
  threadId?: string;
  replyId?: string;
  uploadedById: string;
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number };
}

export interface ListThreadsFilter {
  contextType?: string;
  contextId?: string;
  status?: ThreadStatus;
  limit?: number;
  offset?: number;
}

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly stateMachine: StateMachineService,
    private readonly fileStorage: FileStorageService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // ----- THREADS -----

  async createThread(input: CreateThreadInput) {
    // Verify creator exists + is active (FK will catch, but fail earlier with
    // a clearer error).
    const creator = await this.prisma.user.findUnique({
      where: { id: input.createdById },
      select: { id: true, status: true },
    });
    if (!creator || creator.status === 'INACTIVE') {
      throw new ResourceNotFoundException('User', input.createdById);
    }

    const thread = await this.prisma.communicationThread.create({
      data: {
        contextType: input.contextType,
        contextId: input.contextId,
        title: input.title,
        createdById: input.createdById,
      },
    });

    await this.activityLog.log({
      userId: input.createdById,
      type: LogActivityType.CREATE,
      entityType: 'CommunicationThread',
      entityId: thread.id,
      metadata: {
        contextType: input.contextType,
        contextId: input.contextId,
        title: input.title,
      },
    });

    this.eventEmitter.emit('thread.created', {
      threadId: thread.id,
      contextType: thread.contextType,
      contextId: thread.contextId,
      createdById: thread.createdById,
      createdAt: thread.createdAt,
    });

    return thread;
  }

  async updateThread(
    threadId: string,
    patch: { title?: string; status?: ThreadStatus },
    actorId: string,
  ) {
    const existing = await this.prisma.communicationThread.findUnique({
      where: { id: threadId },
      select: { id: true, status: true, title: true, createdById: true },
    });
    if (!existing) throw new ResourceNotFoundException('CommunicationThread', threadId);

    // State transition only when status changes — title edits don't need
    // state-machine logging.
    let stateLogId: string | undefined;
    if (patch.status && patch.status !== existing.status) {
      const transition = await this.stateMachine.transition({
        entityType: 'COMMUNICATION_THREAD',
        entityId: threadId,
        eventTrigger: this.statusToTrigger(patch.status),
        fromState: existing.status,
        toState: patch.status,
        userId: actorId,
        reason: `status ${existing.status} -> ${patch.status}`,
      });
      stateLogId = transition.id;
    }

    const updated = await this.prisma.communicationThread.update({
      where: { id: threadId },
      data: {
        ...(patch.title && { title: patch.title }),
        ...(patch.status && { status: patch.status }),
      },
    });

    if (patch.status && patch.status !== existing.status) {
      this.eventEmitter.emit('thread.status.changed', {
        threadId,
        from: existing.status,
        to: patch.status,
        actorId,
        stateLogId,
      });
    }

    await this.activityLog.log({
      userId: actorId,
      type: LogActivityType.UPDATE,
      entityType: 'CommunicationThread',
      entityId: threadId,
      metadata: { patch, stateLogId },
    });

    return updated;
  }

  async getThread(threadId: string) {
    const thread = await this.prisma.communicationThread.findUnique({
      where: { id: threadId },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, fullName: true, email: true } },
            mentions: {
              include: {
                mentionedUser: { select: { id: true, fullName: true, email: true } },
              },
            },
            attachments: true,
          },
        },
        attachments: true,
      },
    });
    if (!thread) throw new ResourceNotFoundException('CommunicationThread', threadId);
    return thread;
  }

  async listThreadsForUser(userId: string, filter: ListThreadsFilter = {}) {
    const { contextType, contextId, status, limit = 50, offset = 0 } = filter;

    // User-visible = (creator) OR (replied by user) OR (mentioned user).
    // We do this via OR on related tables, then dedupe by id.
    const where: Prisma.CommunicationThreadWhereInput = {
      ...(status && { status }),
      ...(contextType && { contextType }),
      ...(contextId && { contextId }),
      OR: [
        { createdById: userId },
        { replies: { some: { authorId: userId } } },
        { replies: { some: { mentions: { some: { mentionedUserId: userId } } } } },
      ],
    };

    return this.prisma.communicationThread.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 200),
      skip: offset,
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        _count: { select: { replies: true, attachments: true } },
      },
    });
  }

  async listThreadsByContext(contextType: string, contextId: string, status?: ThreadStatus) {
    return this.prisma.communicationThread.findMany({
      where: { contextType, contextId, ...(status && { status }) },
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        _count: { select: { replies: true, attachments: true } },
      },
    });
  }

  // ----- REPLIES -----

  async replyToThread(input: ReplyInput) {
    const thread = await this.prisma.communicationThread.findUnique({
      where: { id: input.threadId },
      select: { id: true, status: true },
    });
    if (!thread) {
      throw new ResourceNotFoundException('CommunicationThread', input.threadId);
    }
    if (thread.status === ThreadStatus.ARCHIVED) {
      throw new BusinessRuleViolationException(
        'THREAD_ARCHIVED',
        'Tidak bisa membalas thread yang sudah diarsipkan',
      );
    }

    // Validate parent reply belongs to the same thread (if provided).
    if (input.parentReplyId) {
      const parent = await this.prisma.communicationThreadReply.findUnique({
        where: { id: input.parentReplyId },
        select: { id: true, threadId: true },
      });
      if (!parent || parent.threadId !== input.threadId) {
        throw new BusinessRuleViolationException(
          'PARENT_REPLY_MISMATCH',
          'parentReplyId harus berada di thread yang sama',
        );
      }
    }

    const reply = await this.prisma.communicationThreadReply.create({
      data: {
        threadId: input.threadId,
        authorId: input.authorId,
        body: input.body,
        parentReplyId: input.parentReplyId ?? null,
      },
    });

    // Inline mentions (deduped via DB unique constraint).
    const createdMentions = [];
    if (input.mentionIds && input.mentionIds.length) {
      const dedup = [...new Set(input.mentionIds)].filter((id) => id !== input.authorId);
      for (const mentionedUserId of dedup) {
        try {
          const mention = await this.prisma.communicationMention.create({
            data: { replyId: reply.id, mentionedUserId },
          });
          createdMentions.push(mention);
        } catch (err) {
          // P2002 = unique constraint; another reply already mentioned the user.
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            continue;
          }
          throw err;
        }
      }
    }

    // Bump thread updatedAt for "recent activity" sorting.
    await this.prisma.communicationThread.update({
      where: { id: input.threadId },
      data: { updatedAt: new Date() },
    });

    await this.activityLog.log({
      userId: input.authorId,
      type: LogActivityType.CREATE,
      entityType: 'CommunicationThreadReply',
      entityId: reply.id,
      metadata: {
        threadId: input.threadId,
        parentReplyId: input.parentReplyId ?? null,
        mentionCount: createdMentions.length,
      },
    });

    // Internal event for WS gateway + any listener.
    this.eventEmitter.emit('thread.reply.created', {
      replyId: reply.id,
      threadId: input.threadId,
      authorId: input.authorId,
      parentReplyId: input.parentReplyId ?? null,
      mentions: createdMentions.map((m) => m.mentionedUserId),
      createdAt: reply.createdAt,
    });

    // Per-mention events so the WS gateway can fan out without a second query.
    for (const m of createdMentions) {
      this.eventEmitter.emit('notification.mention', {
        replyId: reply.id,
        threadId: input.threadId,
        authorId: input.authorId,
        mentionedUserId: m.mentionedUserId,
        mentionId: m.id,
        createdAt: reply.createdAt,
      });
    }

    return { reply, mentions: createdMentions };
  }

  async addMention(replyId: string, mentionedUserId: string, actorId: string) {
    const reply = await this.prisma.communicationThreadReply.findUnique({
      where: { id: replyId },
      select: { id: true, authorId: true, threadId: true },
    });
    if (!reply) throw new ResourceNotFoundException('CommunicationThreadReply', replyId);
    if (mentionedUserId === reply.authorId) {
      throw new BusinessRuleViolationException(
        'SELF_MENTION',
        'Tidak bisa mention diri sendiri',
      );
    }

    let mention;
    try {
      mention = await this.prisma.communicationMention.create({
        data: { replyId, mentionedUserId },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BusinessRuleViolationException(
          'MENTION_EXISTS',
          'User sudah di-mention di reply ini',
        );
      }
      throw err;
    }

    this.eventEmitter.emit('notification.mention', {
      replyId,
      threadId: reply.threadId,
      authorId: reply.authorId,
      mentionedUserId,
      mentionId: mention.id,
      addedBy: actorId,
    });

    await this.activityLog.log({
      userId: actorId,
      type: LogActivityType.CREATE,
      entityType: 'CommunicationMention',
      entityId: mention.id,
      metadata: { replyId, mentionedUserId },
    });

    return mention;
  }

  // ----- ATTACHMENTS -----

  async attachFile(input: AttachInput) {
    if (!input.threadId && !input.replyId) {
      throw new BusinessRuleViolationException(
        'ATTACHMENT_TARGET_REQUIRED',
        'threadId atau replyId wajib diisi',
      );
    }
    if (input.threadId && input.replyId) {
      throw new BusinessRuleViolationException(
        'ATTACHMENT_TARGET_BOTH',
        'Hanya boleh salah satu: threadId atau replyId',
      );
    }

    if (input.threadId) {
      const t = await this.prisma.communicationThread.findUnique({
        where: { id: input.threadId },
        select: { id: true },
      });
      if (!t) throw new ResourceNotFoundException('CommunicationThread', input.threadId);
    }
    if (input.replyId) {
      const r = await this.prisma.communicationThreadReply.findUnique({
        where: { id: input.replyId },
        select: { id: true },
      });
      if (!r) throw new ResourceNotFoundException('CommunicationThreadReply', input.replyId);
    }

    const storagePath = await this.fileStorage.saveFile(
      'communications',
      input.threadId ? `thread_${input.threadId}` : `reply_${input.replyId!}`,
      { buffer: input.file.buffer, originalname: input.file.originalname },
    );

    const attachment = await this.prisma.communicationAttachment.create({
      data: {
        threadId: input.threadId ?? null,
        replyId: input.replyId ?? null,
        filename: input.file.originalname,
        mimeType: input.file.mimetype,
        size: input.file.size,
        storagePath,
        uploadedById: input.uploadedById,
      },
    });

    await this.activityLog.log({
      userId: input.uploadedById,
      type: LogActivityType.CREATE,
      entityType: 'CommunicationAttachment',
      entityId: attachment.id,
      metadata: {
        threadId: input.threadId ?? null,
        replyId: input.replyId ?? null,
        size: attachment.size,
        filename: attachment.filename,
      },
    });

    return attachment;
  }

  // ----- STATE MACHINE BRIDGE -----

  private statusToTrigger(
    status: ThreadStatus,
  ): 'APPROVAL_REQUESTED' | 'APPROVAL_GRANTED' | 'PERIOD_LOCKED' {
    // Map thread status changes onto the closest existing trigger.
    // OPEN -> CLOSED  = APPROVAL_GRANTED (resolved)
    // OPEN -> ARCHIVED = PERIOD_LOCKED (archived, won't reopen)
    // ARCHIVED -> OPEN = APPROVAL_REQUESTED (reopen)
    switch (status) {
      case ThreadStatus.CLOSED:
        return 'APPROVAL_GRANTED';
      case ThreadStatus.ARCHIVED:
        return 'PERIOD_LOCKED';
      case ThreadStatus.OPEN:
      default:
        return 'APPROVAL_REQUESTED';
    }
  }
}
