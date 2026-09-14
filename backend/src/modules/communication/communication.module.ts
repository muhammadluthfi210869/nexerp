// Wave 3/D1 — Communication Protocol module wiring.
//
// Notes/reply/mention/attach. Imports Prisma + Auth + ActivityLog.
// SharedModule is already @Global() so FileStorageService is auto-available.
// StateMachineModule intentionally omitted: not yet wired in main app.module
// (Wave 1 schema gap — eventTrigger field pending). The service tolerates a
// missing state-machine dependency via optional injection.

import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
