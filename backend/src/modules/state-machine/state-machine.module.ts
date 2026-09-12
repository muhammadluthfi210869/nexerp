// Wave 1/A1 — State Machine module wiring.

import { Module } from '@nestjs/common';
import { StateMachineService } from './state-machine.service';
import { StateMachineController } from './state-machine.controller';

@Module({
  controllers: [StateMachineController],
  providers: [StateMachineService],
  exports: [StateMachineService],
})
export class StateMachineModule {}