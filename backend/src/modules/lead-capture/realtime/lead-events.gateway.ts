// lead-events.gateway.ts — Real-time lead event broadcaster via Socket.IO.
//
// Subscribes to existing NestJS EventEmitter2 events (lead.created,
// lead.attributed, lead.assigned) and broadcasts them to authenticated
// clients in the room `sales:{userId}` so the /sales/live dashboard can
// update without polling.
//
// Auth: client must pass JWT in handshake.auth.token; only DIGIMAR /
// MARKETING / SUPER_ADMIN roles are allowed to join.
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@WebSocketGateway({
  cors: { origin: '*', credentials: false },
  namespace: '/lead-events',
})
export class LeadEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(LeadEventsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private jwt: JwtService) {}

  onModuleInit() {
    this.logger.log('LeadEventsGateway listening on /lead-events');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const allowed = (payload.roles ?? []).some((r) =>
        ['SUPER_ADMIN', 'DIGIMAR', 'MARKETING', 'SALES'].includes(r),
      );
      if (!allowed) {
        client.disconnect(true);
        return;
      }
      // Store identity on socket for later use
      (client.data as any).userId = payload.sub;
      (client.data as any).email = payload.email;
      (client.data as any).roles = payload.roles;
      // Auto-join personal room
      void client.join(`sales:${payload.sub}`);
      // And broadcast room for managers (so /sales/live can subscribe)
      void client.join('sales:managers');
      this.logger.log(`socket ${client.id} connected as ${payload.email}`);
      client.emit('connected', { ok: true });
    } catch (err) {
      this.logger.warn(`auth failed for ${client.id}: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const email = (client.data as any).email ?? client.id;
    this.logger.log(`socket ${client.id} (${email}) disconnected`);
  }

  /**
   * Allow dashboard to explicitly subscribe to a channel (e.g. only
   * leads from a specific QR or campaign).
   */
  @SubscribeMessage('subscribe')
  async subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channel?: string; campaign?: string },
  ) {
    if (body?.channel) {
      void client.join(`channel:${body.channel}`);
    }
    if (body?.campaign) {
      void client.join(`campaign:${body.campaign}`);
    }
    return { ok: true };
  }

  // ── EventEmitter2 listeners ────────────────────────────────────

  @OnEvent('lead.created', { async: false })
  onLeadCreated(payload: any) {
    this.broadcast('lead.created', payload);
  }

  @OnEvent('lead.attributed', { async: false })
  onLeadAttributed(payload: any) {
    this.broadcast('lead.attributed', payload);
  }

  @OnEvent('lead.assigned', { async: false })
  onLeadAssigned(payload: any) {
    const salesUserId = payload?.assignedTo;
    if (salesUserId) {
      this.server.to(`sales:${salesUserId}`).emit('lead.assigned', payload);
    }
    this.broadcast('lead.assigned', payload);
  }

  @OnEvent('qr.scanned', { async: false })
  onQrScanned(payload: any) {
    this.broadcast('qr.scanned', payload);
  }

  @OnEvent('qr.attributed', { async: false })
  onQrAttributed(payload: any) {
    const salesUserId = payload?.assignedSalesId;
    if (salesUserId) {
      this.server.to(`sales:${salesUserId}`).emit('qr.attributed', payload);
    }
    this.broadcast('qr.attributed', payload);
  }

  private broadcast(event: string, payload: unknown) {
    this.server.to('sales:managers').emit(event, payload);
  }
}