import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { BillMatchResultsService } from './bill-match-results.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateBillMatchResultDto } from './dto/bill-match-results.dto';

@ApiTags('finance/bill-match-results')
@ApiBearerAuth()
@Controller('finance/bill-match-results')
export class BillMatchResultsController {
  constructor(private service: BillMatchResultsService) {}

  @Get()
  @ApiOperation({ summary: 'List 4-way matching results (filter by bill, status)' })
  findAll(@Query('billId') billId?: string, @Query('matchStatus') matchStatus?: string) {
    return this.service.findAll({ billId, matchStatus: matchStatus as any });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get matching summary (count by status + avg variance)' })
  summary() {
    return this.service.getSummary();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill match result by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a 4-way matching result (PO ↔ GR ↔ QC ↔ Invoice)' })
  create(@Req() req: any, @Body() dto: CreateBillMatchResultDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }
}
