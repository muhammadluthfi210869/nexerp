import { Module } from '@nestjs/common';
import { InventoryOwnershipsService } from './inventory-ownerships.service';
import { InventoryOwnershipsController } from './inventory-ownerships.controller';

@Module({
  controllers: [InventoryOwnershipsController],
  providers: [InventoryOwnershipsService],
  exports: [InventoryOwnershipsService],
})
export class InventoryOwnershipsModule {}
