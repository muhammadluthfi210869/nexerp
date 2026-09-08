import { Controller, Get, Param } from '@nestjs/common';
import { BillLineItemsService } from './bill-line-items.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/bill-line-items')
export class BillLineItemsController {
  constructor(private service: BillLineItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all bill-line-items' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill-line-items by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
