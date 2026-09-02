import { Module } from '@nestjs/common';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { HrListener } from './hr.listener';

@Module({
  controllers: [HrController],
  providers: [HrService, HrListener],
})
export class HrModule {}
