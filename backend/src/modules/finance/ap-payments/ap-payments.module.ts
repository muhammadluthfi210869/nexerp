import { Module } from '@nestjs/common';
import { APPaymentsService } from './ap-payments.service';
import { APPaymentsController } from './ap-payments.controller';

@Module({
  controllers: [APPaymentsController],
  providers: [APPaymentsService],
  exports: [APPaymentsService],
})
export class APPaymentsModule {}
