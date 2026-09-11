import { Controller, Get, Post, Param, Body, Query, Req, BadRequestException } from '@nestjs/common';
import { AssetDisposalsService } from './asset-disposals.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAssetDisposalDto } from './dto/asset-disposals.dto';

@ApiTags('finance/asset-disposals')
@ApiBearerAuth()
@Controller('finance/asset-disposals')
export class AssetDisposalsController {
  constructor(private service: AssetDisposalsService) {}

  @Get()
  @ApiOperation({ summary: 'List asset disposals (filter by asset, type)' })
  findAll(
    @Query('assetId') assetId?: string,
    @Query('disposalType') disposalType?: string,
  ) {
    return this.service.findAll({ assetId, disposalType: disposalType as any });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Disposal summary for a date range' })
  summary(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) throw new BadRequestException('from and to required');
    return this.service.getSummary(new Date(from), new Date(to));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset disposal by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Dispose an asset (auto-computes gain/loss, flips status to DISPOSED)' })
  create(@Req() req: any, @Body() dto: CreateAssetDisposalDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Reverse a disposal (return asset to ACTIVE)' })
  reverse(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.reverse(userId, id);
  }
}
