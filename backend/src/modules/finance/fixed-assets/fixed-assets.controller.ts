import { Controller, Get, Param } from '@nestjs/common';
import { FixedAssetsService } from './fixed-assets.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/fixed-assets')
export class FixedAssetsController {
  constructor(private service: FixedAssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all fixed-assets' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fixed-assets by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
