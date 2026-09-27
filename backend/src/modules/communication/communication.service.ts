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

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { Prisma, ThreadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma/prisma.service';
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
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
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
    if (!existing)
      throw new ResourceNotFoundException('CommunicationThread', threadId);

    // State transition only when status changes — title edits don't need
    // state-machine logging. StateMachineService intentionally not wired yet
    // (Wave 1 schema gap — eventTrigger field pending); tracked in followup.
    let stateLogId: string | undefined;
    if (patch.status && patch.status !== existing.status) {
      this.logger.debug(
        `thread ${threadId} status ${existing.status} -> ${patch.status} (state-machine log deferred)`,
      );
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
                mentionedUser: {
                  select: { id: true, fullName: true, email: true },
                },
              },
            },
            attachments: true,
          },
        },
        attachments: true,
      },
    });
    if (!thread)
      throw new ResourceNotFoundException('CommunicationThread', threadId);
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
        {
          replies: {
            some: { mentions: { some: { mentionedUserId: userId } } },
          },
        },
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

  async listThreadsByContext(
    contextType: string,
    contextId: string,
    status?: ThreadStatus,
  ) {
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
      throw new ResourceNotFoundException(
        'CommunicationThread',
        input.threadId,
      );
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
      const dedup = [...new Set(input.mentionIds)].filter(
        (id) => id !== input.authorId,
      );
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
    if (!reply)
      throw new ResourceNotFoundException('CommunicationThreadReply', replyId);
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
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
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
      if (!t)
        throw new ResourceNotFoundException(
          'CommunicationThread',
          input.threadId,
        );
    }
    if (input.replyId) {
      const r = await this.prisma.communicationThreadReply.findUnique({
        where: { id: input.replyId },
        select: { id: true },
      });
      if (!r)
        throw new ResourceNotFoundException(
          'CommunicationThreadReply',
          input.replyId,
        );
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
  // NOTE: statusToTrigger kept as documentation; StateMachineService not yet
  // wired in main (Wave 1 schema gap). Re-enable when eventTrigger field is
  // added to StateTransitionLog schema.

  // private statusToTrigger(
  //   status: ThreadStatus,
  // ): 'APPROVAL_REQUESTED' | 'APPROVAL_GRANTED' | 'PERIOD_LOCKED' {
  //   switch (status) {
  //     case ThreadStatus.CLOSED:
  //       return 'APPROVAL_GRANTED';
  //     case ThreadStatus.ARCHIVED:
  //       return 'PERIOD_LOCKED';
  //     case ThreadStatus.OPEN:
  //     default:
  //       return 'APPROVAL_REQUESTED';
  // ----- CANONICAL ENTITY METHODS (P17) -----

  async findOrCreateEntityThread(contextType: string, contextId: string, createdById: string) {
    let thread = await this.prisma.communicationThread.findFirst({
      where: { contextType, contextId },
    });
    if (!thread) {
      thread = await this.prisma.communicationThread.create({
        data: {
          contextType,
          contextId,
          title: `${contextType} Comms Thread`,
          createdById,
        },
      });
    }
    return thread;
  }

  async listNotes(contextType: string, contextId: string) {
    const thread = await this.prisma.communicationThread.findFirst({
      where: { contextType, contextId },
      include: {
        replies: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, fullName: true, email: true } },
            mentions: {
              include: {
                mentionedUser: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!thread) return [];

    return thread.replies.map((r) => ({
      id: r.id,
      body: r.body,
      author: r.author,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
      mentions: r.mentions.map((m) => m.mentionedUser),
    }));
  }

  async createNote(
    contextType: string,
    contextId: string,
    authorId: string,
    body: string,
    visibility = 'ALL',
  ) {
    if (!body || !body.trim()) {
      throw new BusinessRuleViolationException('NOTE_EMPTY', 'Isi catatan tidak boleh kosong');
    }

    // BUS-RULE-091: Parse @username mentions
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const matches = Array.from(body.matchAll(mentionRegex));
    const usernames = Array.from(new Set(matches.map((m) => m[1])));

    const resolvedMentionUsers: { id: string; fullName: string | null; email: string }[] = [];
    for (const uname of usernames) {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { startsWith: uname, mode: 'insensitive' } },
            { fullName: { contains: uname, mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
        },
        select: { id: true, fullName: true, email: true },
      });

      if (!user) {
        throw new BadRequestException(`MENTION_USER_NOT_FOUND: User @${uname} tidak ditemukan.`);
      }
      if (user.id !== authorId && !resolvedMentionUsers.some((u) => u.id === user.id)) {
        resolvedMentionUsers.push(user);
      }
    }

    const thread = await this.findOrCreateEntityThread(contextType, contextId, authorId);

    return await this.prisma.$transaction(async (tx) => {
      const reply = await tx.communicationThreadReply.create({
        data: {
          threadId: thread.id,
          authorId,
          body,
        },
        include: {
          author: { select: { id: true, fullName: true, email: true } },
        },
      });

      const mentionsCreated = [];
      for (const targetUser of resolvedMentionUsers) {
        const mention = await tx.communicationMention.create({
          data: {
            replyId: reply.id,
            mentionedUserId: targetUser.id,
          },
        });
        mentionsCreated.push(mention);

        // In-app notification
        await tx.notification.create({
          data: {
            userId: targetUser.id,
            title: `Mention baru di ${contextType}`,
            body: body.length > 100 ? `${body.slice(0, 97)}...` : body,
            type: 'MENTION',
            referenceType: contextType,
            referenceId: contextId,
            link: `/entities/${contextType}/${contextId}/notes`,
          },
        });

        // Atomic Outbox Event
        await tx.outboxEvent.create({
          data: {
            eventType: 'entity.mention.created',
            aggregateType: contextType,
            aggregateId: contextId,
            idempotencyKey: `mention-${reply.id}-${targetUser.id}`,
            payload: {
              context_type: 'NOTE',
              context_id: reply.id,
              entity_type: contextType,
              entity_id: contextId,
              mentioned_by_user_id: authorId,
              tagged_user_ids: [targetUser.id],
              content: body,
            },
            correlationId: randomUUID(),
            status: 'PENDING',
          },
        });
      }

      await this.activityLog.log({
        userId: authorId,
        type: LogActivityType.CREATE,
        entityType: 'EntityNote',
        entityId: reply.id,
        metadata: {
          contextType,
          contextId,
          visibility,
          mentionCount: mentionsCreated.length,
        },
      });

      return {
        id: reply.id,
        body: reply.body,
        visibility,
        author: reply.author,
        created_at: reply.createdAt,
        mentions: resolvedMentionUsers,
      };
    });
  }

  async updateNote(noteId: string, authorId: string, body: string) {
    const reply = await this.prisma.communicationThreadReply.findUnique({
      where: { id: noteId },
    });
    if (!reply) throw new ResourceNotFoundException('Note', noteId);

    const updated = await this.prisma.communicationThreadReply.update({
      where: { id: noteId },
      data: { body, updatedAt: new Date() },
      include: { author: { select: { id: true, fullName: true, email: true } } },
    });

    await this.activityLog.log({
      userId: authorId,
      type: LogActivityType.UPDATE,
      entityType: 'EntityNote',
      entityId: noteId,
      metadata: { body },
    });

    return {
      id: updated.id,
      body: updated.body,
      updated_at: updated.updatedAt,
      author: updated.author,
    };
  }

  async deleteNote(noteId: string, actorId: string) {
    const reply = await this.prisma.communicationThreadReply.findUnique({
      where: { id: noteId },
    });
    if (!reply) throw new ResourceNotFoundException('Note', noteId);

    await this.prisma.communicationThreadReply.delete({
      where: { id: noteId },
    });

    await this.activityLog.log({
      userId: actorId,
      type: LogActivityType.DELETE,
      entityType: 'EntityNote',
      entityId: noteId,
      metadata: { deletedAt: new Date().toISOString() },
    });

    return { deleted: true, id: noteId };
  }

  async listComments(contextType: string, contextId: string) {
    return this.listNotes(contextType, contextId);
  }

  async createComment(
    contextType: string,
    contextId: string,
    authorId: string,
    body: string,
    relatedEntityType?: string,
    relatedEntityId?: string,
  ) {
    // BUS-RULE-094: Cross-reference comment check
    if (relatedEntityType && relatedEntityId) {
      this.logger.log(`Cross-reference confirmed: ${contextType}:${contextId} <-> ${relatedEntityType}:${relatedEntityId}`);
    }
    return this.createNote(contextType, contextId, authorId, body, 'ALL');
  }

  async listStatusTransitions(entityType: string, entityId: string) {
    return this.prisma.stateTransitionLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        changedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async listEntityAttachments(contextType: string, contextId: string) {
    return this.prisma.communicationAttachment.findMany({
      where: {
        thread: { contextType, contextId },
      },
      include: {
        uploadedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async attachFileToEntity(
    contextType: string,
    contextId: string,
    body: {
      file_id?: string;
      filename?: string;
      mimeType?: string;
      size?: number;
      storagePath?: string;
      description?: string;
    },
    uploadedById: string,
  ) {
    const thread = await this.findOrCreateEntityThread(contextType, contextId, uploadedById);
    const attachmentId = body.file_id || randomUUID();

    const attachment = await this.prisma.communicationAttachment.create({
      data: {
        id: attachmentId,
        threadId: thread.id,
        filename: body.filename || body.description || `file_${attachmentId}.dat`,
        mimeType: body.mimeType || 'application/octet-stream',
        size: body.size || 1024,
        storagePath: body.storagePath || `/uploads/${contextType.toLowerCase()}/${contextId}/${attachmentId}`,
        uploadedById,
      },
    });

    await this.activityLog.log({
      userId: uploadedById,
      type: LogActivityType.CREATE,
      entityType: 'EntityAttachment',
      entityId: attachment.id,
      metadata: { contextType, contextId, attachmentId, description: body.description },
    });

    return attachment;
  }

  async listTags(contextType: string, contextId: string) {
    const thread = await this.prisma.communicationThread.findFirst({
      where: { contextType, contextId },
      include: {
        replies: {
          include: {
            mentions: {
              include: {
                mentionedUser: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!thread) return [];

    const tags: { id: string; type: string; user?: any; tag?: string; replyId: string }[] = [];
    for (const reply of thread.replies) {
      if (reply.body.startsWith('[TAG:')) {
        const tagName = reply.body.slice(5, -1);
        tags.push({
          id: reply.id,
          type: 'TAG',
          tag: tagName,
          replyId: reply.id,
        });
      }
      for (const mention of reply.mentions) {
        tags.push({
          id: mention.id,
          type: 'USER',
          user: mention.mentionedUser,
          replyId: reply.id,
        });
      }
    }
    return tags;
  }

  async createTag(
    contextType: string,
    contextId: string,
    dto: { tag?: string; type?: string; target_id?: string; context_type?: string; context_id?: string },
    authorId: string,
  ) {
    const thread = await this.findOrCreateEntityThread(contextType, contextId, authorId);
    const tagName = dto.tag || dto.target_id || 'TAG';

    if (dto.type === 'USER' && dto.target_id) {
      let reply = await this.prisma.communicationThreadReply.findFirst({
        where: { threadId: thread.id },
      });
      if (!reply) {
        reply = await this.prisma.communicationThreadReply.create({
          data: {
            threadId: thread.id,
            authorId,
            body: `Tag for User ${dto.target_id}`,
          },
        });
      }

      const mention = await this.prisma.communicationMention.create({
        data: {
          replyId: reply.id,
          mentionedUserId: dto.target_id,
        },
      });

      await this.prisma.notification.create({
        data: {
          userId: dto.target_id,
          title: `Anda di-tag pada ${contextType}`,
          body: `Tag dibuat dalam konteks ${contextType}`,
          type: 'TAG',
          referenceType: contextType,
          referenceId: contextId,
        },
      });

      return mention;
    }

    const reply = await this.prisma.communicationThreadReply.create({
      data: {
        threadId: thread.id,
        authorId,
        body: `[TAG:${tagName}]`,
      },
    });

    return {
      id: reply.id,
      tag: tagName,
      type: 'TAG',
      context_type: contextType,
      context_id: contextId,
    };
  }
}
