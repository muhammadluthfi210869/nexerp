import { Module } from '@nestjs/common';
import { DownPaymentsService } from './down-payments.service';
import { DownPaymentsController } from './down-payments.controller';

@Module({
  controllers: [DownPaymentsController],
  providers: [DownPaymentsService],
  exports: [DownPaymentsService],
})
export class DownPaymentsModule {}
