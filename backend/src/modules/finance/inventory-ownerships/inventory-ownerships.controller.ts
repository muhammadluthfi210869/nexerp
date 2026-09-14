import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { InventoryOwnershipsService } from './inventory-ownerships.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateInventoryOwnershipDto,
  AdjustInventoryOwnershipDto,
  TransferInventoryOwnershipDto,
} from './dto/inventory-ownerships.dto';

@ApiTags('finance/inventory-ownerships')
@ApiBearerAuth()
@Controller('finance/inventory-ownerships')
export class InventoryOwnershipsController {
  constructor(private service: InventoryOwnershipsService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory ownerships (filter by material, warehouse, owner type)' })
  findAll(
    @Query('materialId') materialId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('ownerType') ownerType?: string,
  ) {
    return this.service.findAll({ materialId, warehouseId, ownerType: ownerType as any });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory ownership by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register new ownership (idempotent per (material, warehouse, owner))' })
  create(@Req() req: any, @Body() dto: CreateInventoryOwnershipDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Adjust quantity (delta, for corrections/returns)' })
  adjust(@Req() req: any, @Param('id') id: string, @Body() dto: AdjustInventoryOwnershipDto) {
    const userId = req.user?.id;
    return this.service.adjustQuantity(userId, id, dto);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer ownership (e.g., consign → COMPANY after customer buys)' })
  transfer(@Req() req: any, @Param('id') id: string, @Body() dto: TransferInventoryOwnershipDto) {
    const userId = req.user?.id;
    return this.service.transferOwnership(userId, id, dto);
  }
}
