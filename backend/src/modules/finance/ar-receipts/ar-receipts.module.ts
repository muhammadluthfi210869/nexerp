import { Module } from '@nestjs/common';
import { ARReceiptsService } from './ar-receipts.service';
import { ARReceiptsController } from './ar-receipts.controller';

@Module({
  controllers: [ARReceiptsController],
  providers: [ARReceiptsService],
  exports: [ARReceiptsService],
})
export class ARReceiptsModule {}
