import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { IntangibleAssetsService } from './intangible-assets.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateIntangibleAssetDto } from './dto/intangible-assets.dto';

@ApiTags('finance/intangible-assets')
@ApiBearerAuth()
@Controller('finance/intangible-assets')
export class IntangibleAssetsController {
  constructor(private service: IntangibleAssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List intangible assets (filter by status)' })
  findAll(@Query('status') status?: string) {
    return this.service.findAll({ status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get intangible asset by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/amortization')
  @ApiOperation({ summary: 'Calculate full amortization schedule for an intangible asset' })
  amortization(@Param('id') id: string) {
    return this.service.getAmortizationSchedule(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new intangible asset (software/license/patent)' })
  create(@Req() req: any, @Body() dto: CreateIntangibleAssetDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/retire')
  @ApiOperation({ summary: 'Retire an intangible asset (mark fully amortized)' })
  retire(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.retire(userId, id);
  }
}
