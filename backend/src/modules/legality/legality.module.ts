import { Module, forwardRef } from '@nestjs/common';
import { LegalityService } from './legality.service';
import { LegalityController } from './legality.controller';
import { LegalityBatch3Service } from './legality-batch3.service';
import { LegalityBatch3Controller } from './legality-batch3.controller';
import { LegalityBatch3Listener } from './legality-batch3.listener';
import { PrismaModule } from '../../prisma/prisma.module';
import { LegalityListener } from './legality.listener';

import { BussdevModule } from '../bussdev/bussdev.module';

@Module({
  imports: [PrismaModule, forwardRef(() => BussdevModule)],
  providers: [
    LegalityService,
    LegalityListener,
    LegalityBatch3Service,
    LegalityBatch3Listener,
  ],
  controllers: [LegalityController, LegalityBatch3Controller],
  exports: [LegalityService, LegalityBatch3Service],
})
export class LegalityModule {}
