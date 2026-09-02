import { Module } from '@nestjs/common';
import { ActivityStreamService } from './activity-stream.service';
import { ActivityStreamGateway } from './activity-stream.gateway';
import { ActivityStreamListener } from './activity-stream.listener';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    ActivityStreamService,
    ActivityStreamGateway,
    ActivityStreamListener,
  ],
  exports: [ActivityStreamService],
})
export class ActivityStreamModule {}
