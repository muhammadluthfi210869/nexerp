import { Controller, Get, Param } from '@nestjs/common';
import { InventoryOwnershipsService } from './inventory-ownerships.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/inventory-ownerships')
export class InventoryOwnershipsController {
  constructor(private service: InventoryOwnershipsService) {}

  @Get()
  @ApiOperation({ summary: 'List all inventory-ownerships' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory-ownerships by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
