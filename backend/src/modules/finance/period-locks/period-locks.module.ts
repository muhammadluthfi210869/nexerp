import { Module } from '@nestjs/common';
import { PeriodLocksService } from './period-locks.service';
import { PeriodLocksController } from './period-locks.controller';
import { StateMachineModule } from '../../state-machine/state-machine.module';

@Module({
  imports: [StateMachineModule],
  controllers: [PeriodLocksController],
  providers: [PeriodLocksService],
  exports: [PeriodLocksService],
})
export class PeriodLocksModule {}
