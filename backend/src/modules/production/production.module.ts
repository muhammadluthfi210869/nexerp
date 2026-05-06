import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { LegalityModule } from '../legality/legality.module';

@Module({
  imports: [PrismaModule, LegalityModule],
  providers: [ProductionService],
  controllers: [ProductionController],
})
export class ProductionModule {}
