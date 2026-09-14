import { Controller, Get, Post, Patch, Delete, Param, Body, Req } from '@nestjs/common';
import { BillLineItemsService } from './bill-line-items.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AddBillLineItemDto, UpdateBillLineItemDto } from './dto/bill-line-items.dto';

@ApiTags('finance/bill-line-items')
@ApiBearerAuth()
@Controller('finance/bill-line-items')
export class BillLineItemsController {
  constructor(private service: BillLineItemsService) {}

  @Get('by-bill/:billId')
  @ApiOperation({ summary: 'List all line items for a bill' })
  findAllByBill(@Param('billId') billId: string) {
    return this.service.findAllByBill(billId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill line item by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('by-bill/:billId')
  @ApiOperation({ summary: 'Add line item to bill (recomputes totals)' })
  addItem(@Req() req: any, @Param('billId') billId: string, @Body() dto: AddBillLineItemDto) {
    const userId = req.user?.id;
    return this.service.addItem(userId, billId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bill line item (recomputes totals)' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBillLineItemDto) {
    const userId = req.user?.id;
    return this.service.updateItem(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove bill line item (recomputes totals)' })
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.removeItem(userId, id);
  }
}
