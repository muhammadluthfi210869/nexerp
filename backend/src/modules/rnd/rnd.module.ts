import { Module } from '@nestjs/common';
import { RndTasksController } from './tasks/rnd-tasks.controller';
import { RndTasksService } from './tasks/rnd-tasks.service';

// ⚠️ PRODUCTION-LIGHT: Hanya menyisakan tasks controller + service
// untuk 3 halaman: Analytics Trend, Daily Tracking, Project Monitoring.
// Formulas, Samples, NPF, Listener di-archive.
// Lihat PRODUCTION_LIGHT.md untuk cara mengembalikan.

@Module({
  controllers: [RndTasksController],
  providers: [RndTasksService],
  exports: [RndTasksService],
})
export class RndModule {}
