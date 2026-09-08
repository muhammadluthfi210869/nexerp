import { Controller, Get, Param } from '@nestjs/common';
import { APPaymentsService } from './ap-payments.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/ap-payments')
export class APPaymentsController {
  constructor(private service: APPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all ap-payments' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ap-payments by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
