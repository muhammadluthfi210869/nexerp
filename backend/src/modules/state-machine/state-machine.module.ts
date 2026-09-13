// Wave 1/A1 + Wave 2/A5 — State Machine module wiring.
//
// Listeners are co-located in this module so they participate in the
// global state-machine lifecycle. EventEmitter2's @OnEvent decorator
// wires each listener automatically once it is registered as a provider.

import { Global, Module } from '@nestjs/common';
import { StateMachineService } from './state-machine.service';
import { StateMachineController } from './state-machine.controller';
import { PeriodLockedListener } from './listeners/period-locked.listener';
import { ApprovalGrantedListener } from './listeners/approval-granted.listener';
import { JournalPostedListener } from './listeners/journal-posted.listener';

@Global()
@Module({
  controllers: [StateMachineController],
  providers: [
    StateMachineService,
    PeriodLockedListener,
  ],
  exports: [StateMachineService],
})
export class StateMachineModule {}
