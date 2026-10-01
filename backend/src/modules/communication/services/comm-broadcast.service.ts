import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { LogActivityType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { ActivityLogService } from '../../activity-log/activity-log.service';
import { CommChannelService } from './comm-channel.service';

export interface BroadcastAnnouncementInput {
  title: string;
  body: string;
  channel?: string;
  targetUserIds?: string[];
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface PushNotificationInput {
  userId: string;
  title: string;
  body: string;
  type?: string;
  referenceType?: string;
  referenceId?: string;
  link?: string;
}

export interface QueueBroadcastInput {
  eventType: string;
  aggregateType?: string;
  aggregateId?: string;
  payload: Record<string, any>;
  recipientIds?: string[];
}

@Injectable()
export class CommBroadcastService {
  private readonly logger = new Logger(CommBroadcastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly activityLog: ActivityLogService,
    private readonly channelService?: CommChannelService,
  ) {}

  // ----- STATE TRANSITIONS -----

  async listStatusTransitions(entityType: string, entityId: string) {
    return this.prisma.stateTransitionLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        changedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  // ----- TAGS -----

  async listTags(contextType: string, contextId: string) {
    const thread = await this.prisma.communicationThread.findFirst({
      where: { contextType, contextId },
      include: {
        replies: {
          include: {
            mentions: {
              include: {
                mentionedUser: {
                  select: { id: true, fullName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!thread) return [];

    const tags: {
      id: string;
      type: string;
      user?: any;
      tag?: string;
      replyId: string;
    }[] = [];

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
    dto: {
      tag?: string;
      type?: string;
      target_id?: string;
      context_type?: string;
      context_id?: string;
    },
    authorId: string,
  ) {
    let thread = await this.prisma.communicationThread.findFirst({
      where: { contextType, contextId },
    });
    if (!thread) {
      thread = await this.prisma.communicationThread.create({
        data: {
          contextType,
          contextId,
          title: `${contextType} Comms Thread`,
          createdById: authorId,
        },
      });
    }
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

  // ----- BROADCASTS, ANNOUNCEMENTS & DISPATCH QUEUES -----

  async broadcastAnnouncement(input: BroadcastAnnouncementInput) {
    const { title, body, channel = 'ALL', targetUserIds, referenceType, referenceId, metadata } = input;
    this.logger.log(`Broadcasting announcement: "${title}" across channel ${channel}`);

    let recipients = targetUserIds;
    if (!recipients || recipients.length === 0) {
      const activeUsers = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      recipients = activeUsers.map((u) => u.id);
    }

    const createdNotifications = [];
    for (const userId of recipients) {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          title,
          body,
          type: 'ANNOUNCEMENT',
          referenceType: referenceType ?? null,
          referenceId: referenceId ?? null,
          link: metadata?.link ?? null,
        },
      });
      createdNotifications.push(notification);
    }

    this.eventEmitter.emit('comm.announcement.broadcasted', {
      title,
      body,
      channel,
      recipientCount: recipients.length,
      referenceType,
      referenceId,
      metadata,
    });

    return {
      success: true,
      recipientCount: recipients.length,
      notifications: createdNotifications,
    };
  }

  async dispatchPushNotification(input: PushNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type || 'PUSH',
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        link: input.link ?? null,
      },
    });

    this.eventEmitter.emit('notification.push.dispatched', {
      notificationId: notification.id,
      userId: input.userId,
      title: input.title,
      type: input.type || 'PUSH',
      createdAt: notification.createdAt,
    });

    return notification;
  }

  async queueBroadcast(input: QueueBroadcastInput) {
    const correlationId = randomUUID();
    const event = await this.prisma.outboxEvent.create({
      data: {
        eventType: input.eventType,
        aggregateType: input.aggregateType ?? 'BROADCAST',
        aggregateId: input.aggregateId ?? correlationId,
        idempotencyKey: `broadcast-${correlationId}`,
        payload: {
          ...input.payload,
          recipientIds: input.recipientIds ?? [],
        },
        correlationId,
        status: 'PENDING',
      },
    });

    this.eventEmitter.emit('comm.broadcast.queued', {
      eventId: event.id,
      eventType: input.eventType,
      correlationId,
    });

    return event;
  }
}
