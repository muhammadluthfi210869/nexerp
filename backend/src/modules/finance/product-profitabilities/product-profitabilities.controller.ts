import { Controller, Get, Param } from '@nestjs/common';
import { ProductProfitabilitiesService } from './product-profitabilities.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/product-profitabilities')
export class ProductProfitabilitiesController {
  constructor(private service: ProductProfitabilitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all product-profitabilities' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product-profitabilities by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
