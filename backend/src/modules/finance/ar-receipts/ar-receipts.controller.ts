import { Controller, Get, Param } from '@nestjs/common';
import { ARReceiptsService } from './ar-receipts.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/ar-receipts')
export class ARReceiptsController {
  constructor(private service: ARReceiptsService) {}

  @Get()
  @ApiOperation({ summary: 'List all ar-receipts' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ar-receipts by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
