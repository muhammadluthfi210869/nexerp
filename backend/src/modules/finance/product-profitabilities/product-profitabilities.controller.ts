import { Controller, Get, Post, Param, Body, Query, Req, BadRequestException } from '@nestjs/common';
import { ProductProfitabilitiesService } from './product-profitabilities.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpsertProductProfitabilityDto } from './dto/product-profitabilities.dto';

@ApiTags('finance/product-profitabilities')
@ApiBearerAuth()
@Controller('finance/product-profitabilities')
export class ProductProfitabilitiesController {
  constructor(private service: ProductProfitabilitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List product profitabilities (filter by period, product)' })
  findAll(@Query('period') period?: string, @Query('productId') productId?: string) {
    return this.service.findAll({ period, productId });
  }

  @Get('top-performers')
  @ApiOperation({ summary: 'Top N most profitable products for a period (default 10)' })
  top(@Query('period') period: string, @Query('limit') limit?: string) {
    if (!period) throw new BadRequestException('period required');
    return this.service.getTopPerformers(period, limit ? parseInt(limit) : 10);
  }

  @Get('worst-performers')
  @ApiOperation({ summary: 'Bottom N least profitable / loss-making products' })
  worst(@Query('period') period: string, @Query('limit') limit?: string) {
    if (!period) throw new BadRequestException('period required');
    return this.service.getWorstPerformers(period, limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product profitability by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Upsert profitability for a product in a period' })
  upsert(@Req() req: any, @Body() dto: UpsertProductProfitabilityDto) {
    const userId = req.user?.id;
    return this.service.upsert(userId, dto);
  }
}
