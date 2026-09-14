import { Controller, Get, Post, Patch, Delete, Param, Body, Req } from '@nestjs/common';
import { SalesInvoiceLineItemsService } from './sales-invoice-line-items.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AddSalesInvoiceLineItemDto, UpdateSalesInvoiceLineItemDto } from './dto/sales-invoice-line-items.dto';

@ApiTags('finance/sales-invoice-line-items')
@ApiBearerAuth()
@Controller('finance/sales-invoice-line-items')
export class SalesInvoiceLineItemsController {
  constructor(private service: SalesInvoiceLineItemsService) {}

  @Get('by-invoice/:invoiceId')
  @ApiOperation({ summary: 'List all line items for a sales invoice' })
  findAllByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.service.findAllByInvoice(invoiceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales invoice line item by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('by-invoice/:invoiceId')
  @ApiOperation({ summary: 'Add line item to sales invoice (recomputes totals)' })
  addItem(@Req() req: any, @Param('invoiceId') invoiceId: string, @Body() dto: AddSalesInvoiceLineItemDto) {
    const userId = req.user?.id;
    return this.service.addItem(userId, invoiceId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sales invoice line item (recomputes totals)' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSalesInvoiceLineItemDto) {
    const userId = req.user?.id;
    return this.service.updateItem(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove sales invoice line item (recomputes totals)' })
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.removeItem(userId, id);
  }
}
