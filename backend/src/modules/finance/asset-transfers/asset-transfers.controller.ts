import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { AssetTransfersService } from './asset-transfers.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAssetTransferDto } from './dto/asset-transfers.dto';

@ApiTags('finance/asset-transfers')
@ApiBearerAuth()
@Controller('finance/asset-transfers')
export class AssetTransfersController {
  constructor(private service: AssetTransfersService) {}

  @Get()
  @ApiOperation({ summary: 'List asset transfers (filter by asset)' })
  findAll(@Query('assetId') assetId?: string) {
    return this.service.findAll({ assetId });
  }

  @Get('history/:assetId')
  @ApiOperation({ summary: 'Get full transfer history for an asset' })
  history(@Param('assetId') assetId: string) {
    return this.service.getHistory(assetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset transfer by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a new asset transfer (updates asset location/person)' })
  create(@Req() req: any, @Body() dto: CreateAssetTransferDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }
}
