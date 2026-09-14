import { Module } from '@nestjs/common';
import { ClosingChecklistsService } from './closing-checklists.service';
import { ClosingChecklistsController } from './closing-checklists.controller';

@Module({
  controllers: [ClosingChecklistsController],
  providers: [ClosingChecklistsService],
  exports: [ClosingChecklistsService],
})
export class ClosingChecklistsModule {}
