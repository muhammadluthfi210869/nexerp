import { Module } from '@nestjs/common';
import { ARReceiptsService } from './ar-receipts.service';
import { ARReceiptsController } from './ar-receipts.controller';
import { StateMachineModule } from '../../state-machine/state-machine.module';

@Module({
  imports: [StateMachineModule],
  controllers: [ARReceiptsController],
  providers: [ARReceiptsService],
  exports: [ARReceiptsService],
})
export class ARReceiptsModule {}
