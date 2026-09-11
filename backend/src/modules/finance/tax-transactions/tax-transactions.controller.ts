import { Controller, Get, Post, Param, Body, Query, Req, BadRequestException } from '@nestjs/common';
import { TaxTransactionsService } from './tax-transactions.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateTaxTransactionDto,
  ReportTaxDto,
  PayTaxDto,
} from './dto/tax-transactions.dto';

@ApiTags('finance/tax-transactions')
@ApiBearerAuth()
@Controller('finance/tax-transactions')
export class TaxTransactionsController {
  constructor(private service: TaxTransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List tax transactions (PPN/PPh)' })
  findAll(
    @Query('taxTypeId') taxTypeId?: string,
    @Query('status') status?: string,
    @Query('sourceType') sourceType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({
      taxTypeId,
      status: status as any,
      sourceType: sourceType as any,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Tax summary for a date range (per tax type)' })
  summary(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) throw new BadRequestException('from and to required');
    return this.service.getSummary(new Date(from), new Date(to));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax transaction by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record new tax transaction (accrued)' })
  create(@Req() req: any, @Body() dto: CreateTaxTransactionDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Mark as REPORTED (filed to tax authority)' })
  report(@Param('id') id: string, @Body() dto: ReportTaxDto) {
    return this.service.markReported(id, dto);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Mark as PAID (tax settled)' })
  pay(@Param('id') id: string, @Body() dto: PayTaxDto) {
    return this.service.markPaid(id, dto);
  }
}
