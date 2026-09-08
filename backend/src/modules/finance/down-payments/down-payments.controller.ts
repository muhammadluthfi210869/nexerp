import { Controller, Get, Param } from '@nestjs/common';
import { DownPaymentsService } from './down-payments.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/down-payments')
export class DownPaymentsController {
  constructor(private service: DownPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all down-payments' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get down-payments by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
