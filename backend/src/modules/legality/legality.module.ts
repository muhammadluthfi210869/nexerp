import { Module } from '@nestjs/common';
import { LegalityService } from './legality.service';
import { LegalityController } from './legality.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LegalityListener } from './legality.listener';
import { AuditsModule } from './audits/audits.module';

@Module({
  imports: [PrismaModule, AuditsModule],
  providers: [LegalityService, LegalityListener],
  controllers: [LegalityController],
  exports: [LegalityService, AuditsModule],
})
export class LegalityModule {}
