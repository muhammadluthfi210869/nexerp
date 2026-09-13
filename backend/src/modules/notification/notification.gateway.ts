// Wave 3/D1 — Notification WebSocket Gateway.
//
// Real-time push for notifications. Subscribes to EventEmitter2 events
// already emitted by other modules:
//   - notification.mention     (CommunicationService.addMention + replyToThread)
//   - thread.reply.created     (CommunicationService.replyToThread)
//   - notification.approval_granted (ApprovalGrantedListener — already wired)
//
// Handshake auth: JWT in `auth.token` (or `Authorization: Bearer ...`
// header on the polling fallback). Verified using the same JWT secret
// as the REST JwtStrategy. Failed handshake = disconnect.
//
// Per-user room: user.{userId}. Emit to that room only — never broadcast
// notification payloads to other users.
//
// Heartbeat: 30s server-side ping + disconnect on timeout.
// Reconnect: client sends last event id, server replays from in-memory ring.

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma/prisma.service';

const HEARTBEAT_INTERVAL_MS = 30_000;
const RING_BUFFER_SIZE = 200; // last N events per user (reconnect replay window)

interface MentionEvent {
  replyId: string;
  threadId: string;
  authorId: string;
  mentionedUserId: string;
  mentionId?: string;
  createdAt?: string | Date;
  addedBy?: string;
}

interface ThreadReplyEvent {
  replyId: string;
  threadId: string;
  authorId: string;
  parentReplyId: string | null;
  mentions: string[];
  createdAt: string | Date;
}

interface ApprovalGrantedEvent {
  entityType: string;
  entityId: string;
  approverId?: string | null;
  reason?: string | null;
  emittedAt: string;
}

interface NotificationEnvelope {
  id: string;
  type: 'mention' | 'thread_reply' | 'approval';
  ts: number;
  payload: unknown;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/v1/ws',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private heartbeatTimer: NodeJS.Timeout | null = null;

  // Per-user ring buffer for reconnect replay. Bounded to RING_BUFFER_SIZE.
  private readonly ringByUser = new Map<string, NotificationEnvelope[]>();

  // Track connected sockets per user for heartbeat disconnects.
  private readonly socketsByUser = new Map<string, Set<Socket>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit() {
    // Server-side heartbeat — drop dead sockets every 30s.
    this.heartbeatTimer = setInterval(() => {
      if (!this.server) return;
      for (const set of this.socketsByUser.values()) {
        for (const sock of set) {
          // socket.io ping is implicit on heartbeat; if the client misses
          // 2 pings in a row (60s) the engine drops it. We just nudge here.
          if (typeof sock.emit === 'function') {
            sock.emit('heartbeat', { ts: Date.now() });
          }
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      this.bearerFromHeader(client.handshake.headers.authorization);

    if (!token) {
      this.logger.warn(`WS ${client.id} rejected: missing token`);
      client.emit('error', { code: 'UNAUTHENTICATED', message: 'JWT token required' });
      client.disconnect(true);
      return;
    }

    let userId: string;
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'ERP_SECRET',
      });
      // payload.sub is the user id (matches JwtStrategy).
      userId = payload.sub;
    } catch (err) {
      this.logger.warn(
        `WS ${client.id} rejected: invalid token (${(err as Error).message})`,
      );
      client.emit('error', { code: 'INVALID_TOKEN', message: 'JWT invalid' });
      client.disconnect(true);
      return;
    }

    // Verify user is active (same rule as JwtStrategy).
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user || user.status === 'INACTIVE') {
      client.emit('error', { code: 'USER_INACTIVE', message: 'User inactive' });
      client.disconnect(true);
      return;
    }

    // Attach userId to socket for later emit routing.
    (client.data as { userId: string }).userId = userId;
    client.join(this.roomFor(userId));

    let set = this.socketsByUser.get(userId);
    if (!set) {
      set = new Set();
      this.socketsByUser.set(userId, set);
    }
    set.add(client);

    this.logger.log(`WS ${client.id} connected user=${userId}`);

    // Replay ring buffer if client sent lastEventId on handshake.
    const lastEventId = client.handshake.auth?.lastEventId as string | undefined;
    const ring = this.ringByUser.get(userId) ?? [];
    if (lastEventId && ring.length) {
      const idx = ring.findIndex((e) => e.id === lastEventId);
      const replay = idx >= 0 ? ring.slice(idx + 1) : ring;
      for (const env of replay) client.emit('notification', env);
    }

    client.emit('connected', { userId, ts: Date.now() });
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId) return;
    const set = this.socketsByUser.get(userId);
    if (set) {
      set.delete(client);
      if (set.size === 0) this.socketsByUser.delete(userId);
    }
    this.logger.log(`WS ${client.id} disconnected user=${userId}`);
  }

  // ---- EVENT SUBSCRIPTIONS ----

  @OnEvent('notification.mention')
  onMention(event: MentionEvent) {
    const envelope: NotificationEnvelope = {
      id: `m_${event.mentionId ?? event.replyId}_${Date.now()}`,
      type: 'mention',
      ts: Date.now(),
      payload: event,
    };
    this.emitToUser(event.mentionedUserId, envelope);
  }

  @OnEvent('thread.reply.created')
  onThreadReply(event: ThreadReplyEvent) {
    // Notify thread creator + previous reply authors + mentioned users.
    // We don't have direct access to "thread participants" here — the
    // service emits per-recipient events separately for mentions. For the
    // broader thread reply, the client subscribes via REST polling on
    // /threads/:id and refreshes. We DO emit to the author themselves
    // (so their own client updates the UI without a roundtrip).
    const envelope: NotificationEnvelope = {
      id: `r_${event.replyId}_${Date.now()}`,
      type: 'thread_reply',
      ts: Date.now(),
      payload: event,
    };
    this.emitToUser(event.authorId, envelope);
  }

  @OnEvent('notification.approval_granted')
  onApprovalGranted(event: ApprovalGrantedEvent) {
    // approval_granted already routes to the approver's own client.
    // In v1 we just hand the envelope to the approver; downstream modules
    // can fan out to roles via the existing NotificationService.
    if (!event.approverId) return;
    const envelope: NotificationEnvelope = {
      id: `a_${event.entityId}_${event.emittedAt}`,
      type: 'approval',
      ts: Date.now(),
      payload: event,
    };
    this.emitToUser(event.approverId, envelope);
  }

  // ---- INTERNAL ----

  private emitToUser(userId: string, envelope: NotificationEnvelope) {
    if (!this.server) return;
    this.server.to(this.roomFor(userId)).emit('notification', envelope);
    this.appendToRing(userId, envelope);
  }

  private appendToRing(userId: string, envelope: NotificationEnvelope) {
    let ring = this.ringByUser.get(userId);
    if (!ring) {
      ring = [];
      this.ringByUser.set(userId, ring);
    }
    ring.push(envelope);
    if (ring.length > RING_BUFFER_SIZE) {
      ring.splice(0, ring.length - RING_BUFFER_SIZE);
    }
  }

  private roomFor(userId: string): string {
    return `user.${userId}`;
  }

  private bearerFromHeader(h: string | undefined): string | undefined {
    if (!h) return undefined;
    const m = /^Bearer\s+(.+)$/i.exec(h);
    return m?.[1];
  }
}
