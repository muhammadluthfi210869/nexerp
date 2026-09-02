import { Module } from '@nestjs/common';
import { ExecutiveService } from './executive.service';
import { ExecutiveController } from './executive.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ExecutiveService],
  controllers: [ExecutiveController],
})
export class ExecutiveModule {}
