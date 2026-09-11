import { Module } from '@nestjs/common';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { HrListener } from './hr.listener';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [TicketsModule],
  controllers: [HrController],
  providers: [HrService, HrListener],
})
export class HrModule {}
