import { Controller, Get, Param } from '@nestjs/common';
import { IntangibleAssetsService } from './intangible-assets.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/intangible-assets')
export class IntangibleAssetsController {
  constructor(private service: IntangibleAssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all intangible-assets' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get intangible-assets by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
