import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, ActivityLogModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
