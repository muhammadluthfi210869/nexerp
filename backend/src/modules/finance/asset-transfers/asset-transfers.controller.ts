import { Controller, Get, Param } from '@nestjs/common';
import { AssetTransfersService } from './asset-transfers.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/asset-transfers')
export class AssetTransfersController {
  constructor(private service: AssetTransfersService) {}

  @Get()
  @ApiOperation({ summary: 'List all asset-transfers' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset-transfers by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
