import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DigimarService } from './digimar.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/digimar',
  cors: { origin: '*', credentials: true },
})
export class DigimarGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(DigimarGateway.name);
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(private readonly digimarService: DigimarService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Start auto-refresh if not started
    if (!this.refreshInterval) {
      this.startAutoRefresh();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    try {
      const sockets = this.server?.sockets?.adapter
        ? await this.server.sockets.adapter.fetchSockets()
        : [];
      if (sockets.length === 0 && this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
        this.logger.log('Auto-refresh stopped (no clients)');
      }
    } catch (err) {
      this.logger.warn(`Error checking remaining sockets: ${err.message}`);
    }
  }

  private startAutoRefresh() {
    const interval = Number(process.env.TORIBIO_REFRESH_INTERVAL_MS) || 60_000;
    this.refreshInterval = setInterval(async () => {
      try {
        this.digimarService.invalidateCache();
        const data = await this.digimarService.getAll();
        this.server.emit('digimar:update', data);
        this.logger.debug('Auto-refresh: pushed update to clients');
      } catch (err) {
        this.logger.error('Auto-refresh error', err);
      }
    }, interval);
    this.logger.log(`Auto-refresh started (interval: ${interval}ms)`);
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(client: Socket) {
    try {
      const data = await this.digimarService.getAll();
      client.emit('digimar:update', data);
      this.logger.log(`Sent initial data to client ${client.id}`);
    } catch (err) {
      this.logger.error('Failed to send initial data', err);
      client.emit('digimar:error', { message: 'Failed to load data' });
    }
  }

  @SubscribeMessage('subscribe:summary')
  async handleSummarySubscribe(client: Socket) {
    const data = await this.digimarService.getSummary();
    client.emit('digimar:summary', data);
  }

  @SubscribeMessage('subscribe:weekly')
  async handleWeeklySubscribe(client: Socket, payload: { month?: string; platform?: string }) {
    const data = await this.digimarService.getWeekly(payload?.month, payload?.platform);
    client.emit('digimar:weekly', data);
  }

  @SubscribeMessage('subscribe:paidAds')
  async handlePaidAdsSubscribe(client: Socket, payload: { month?: string }) {
    const data = await this.digimarService.getPaidAds(payload?.month);
    client.emit('digimar:paidAds', data);
  }

  @SubscribeMessage('subscribe:content')
  async handleContentSubscribe(client: Socket, payload: { month?: string }) {
    const data = await this.digimarService.getContent(payload?.month);
    client.emit('digimar:content', data);
  }
}
