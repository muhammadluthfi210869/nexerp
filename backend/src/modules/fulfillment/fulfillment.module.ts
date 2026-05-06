import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ShipmentsService } from './services/shipments.service';
import { ShipmentsController } from './controllers/shipments.controller';

@Module({
  imports: [PrismaModule],
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
  exports: [ShipmentsService],
})
export class FulfillmentModule {}
