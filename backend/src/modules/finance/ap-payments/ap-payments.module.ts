import { Module } from '@nestjs/common';
import { APPaymentsService } from './ap-payments.service';
import { APPaymentsController } from './ap-payments.controller';
import { StateMachineModule } from '../../state-machine/state-machine.module';

@Module({
  imports: [StateMachineModule],
  controllers: [APPaymentsController],
  providers: [APPaymentsService],
  exports: [APPaymentsService],
})
export class APPaymentsModule {}
