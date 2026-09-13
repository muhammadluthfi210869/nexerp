// Wave 3/D1 — Communication Protocol module wiring.
//
// Notes/reply/mention/attach. Imports Prisma + Auth + StateMachine + ActivityLog.
// SharedModule is already @Global() so FileStorageService is auto-available.

import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { AuthModule } from '../auth/auth.module';
import { StateMachineModule } from '../state-machine/state-machine.module';

@Module({
  imports: [AuthModule, StateMachineModule],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
