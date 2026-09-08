import { Controller, Get, Param } from '@nestjs/common';
import { AssetDisposalsService } from './asset-disposals.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/asset-disposals')
export class AssetDisposalsController {
  constructor(private service: AssetDisposalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all asset-disposals' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset-disposals by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
