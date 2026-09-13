import { Module } from '@nestjs/common';
import { DownPaymentsService } from './down-payments.service';
import { DownPaymentsController } from './down-payments.controller';
import { StateMachineModule } from '../../state-machine/state-machine.module';

@Module({
  imports: [StateMachineModule],
  controllers: [DownPaymentsController],
  providers: [DownPaymentsService],
  exports: [DownPaymentsService],
})
export class DownPaymentsModule {}
