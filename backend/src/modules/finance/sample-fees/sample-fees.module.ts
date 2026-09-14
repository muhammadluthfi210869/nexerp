import { Module } from '@nestjs/common';
import { SampleFeesService } from './sample-fees.service';
import { SampleFeesController } from './sample-fees.controller';

@Module({
  controllers: [SampleFeesController],
  providers: [SampleFeesService],
  exports: [SampleFeesService],
})
export class SampleFeesModule {}
