import { Module, forwardRef } from '@nestjs/common';
import { LegalityService } from './legality.service';
import { LegalityController } from './legality.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LegalityListener } from './legality.listener';

import { BussdevModule } from '../bussdev/bussdev.module';
import { AuditsModule } from './audits/audits.module';

@Module({
  imports: [PrismaModule, forwardRef(() => BussdevModule), AuditsModule],
  providers: [LegalityService, LegalityListener],
  controllers: [LegalityController],
  exports: [LegalityService],
})
export class LegalityModule {}
