import { Module } from '@nestjs/common';
import { ProductProfitabilitiesService } from './product-profitabilities.service';
import { ProductProfitabilitiesController } from './product-profitabilities.controller';

@Module({
  controllers: [ProductProfitabilitiesController],
  providers: [ProductProfitabilitiesService],
  exports: [ProductProfitabilitiesService],
})
export class ProductProfitabilitiesModule {}
