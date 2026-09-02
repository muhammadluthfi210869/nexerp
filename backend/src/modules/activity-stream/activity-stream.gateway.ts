import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ActivityStreamGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger: Logger = new Logger('ActivityStreamGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinLeadStream')
  handleJoinLeadStream(client: Socket, leadId: string) {
    client.join(`lead_${leadId}`);
    this.logger.log(`Client ${client.id} joined stream for lead: ${leadId}`);
    return { event: 'joined', data: leadId };
  }

  broadcastLog(log: any) {
    // Broadcast to the specific lead room
    this.server.to(`lead_${log.leadId}`).emit('newActivity', log);

    // Also broadcast to a general global stream for managers/admin
    this.server.emit('globalActivity', log);
  }
}
