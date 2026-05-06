import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QCAuditsService } from './services/qc-audits.service';
import { QCAuditsController } from './controllers/qc-audits.controller';
import { QcController } from './controllers/qc.controller';

@Module({
  imports: [PrismaModule],
  providers: [QCAuditsService],
  controllers: [QCAuditsController, QcController],
})
export class QcModule {}
