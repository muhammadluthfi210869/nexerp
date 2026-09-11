import { Controller, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { FixedAssetsService } from './fixed-assets.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateFixedAssetDto, UpdateFixedAssetDto } from './dto/fixed-assets.dto';

@ApiTags('finance/fixed-assets')
@ApiBearerAuth()
@Controller('finance/fixed-assets')
export class FixedAssetsController {
  constructor(private service: FixedAssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List fixed assets (filter by status, category)' })
  findAll(@Query('status') status?: string, @Query('category') category?: string) {
    return this.service.findAll({ status, category });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fixed asset by ID (with schedules, transfers, disposals)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/book-value')
  @ApiOperation({ summary: 'Get current accumulated depreciation + book value' })
  bookValue(@Param('id') id: string) {
    return this.service.getBookValue(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new fixed asset' })
  create(@Req() req: any, @Body() dto: CreateFixedAssetDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update fixed asset metadata (not cost — use reversal)' })
  update(@Param('id') id: string, @Body() dto: UpdateFixedAssetDto) {
    return this.service.update(id, dto);
  }
}
