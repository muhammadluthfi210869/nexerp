// Wave 3/D1 — Notification module + WebSocket gateway.
//
// Adds the NotificationGateway (real-time push) as a provider. Subscribes
// to EventEmitter2 events from CommunicationService (mentions, thread
// replies) and the existing approval-granted listener.

import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'ERP_SECRET',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
