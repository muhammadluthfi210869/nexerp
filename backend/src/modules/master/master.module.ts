import { Module } from '@nestjs/common';
import { MaterialsController } from './controllers/materials.controller';
import { CategoriesController } from './controllers/categories.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { SuppliersController } from './controllers/suppliers.controller';
import { CustomersController } from './controllers/customers.controller';
import { TaxRatesController } from './controllers/tax-rates.controller';
import { MaterialsService } from './services/materials.service';
import { CategoriesService } from './services/categories.service';
import { WarehousesService } from './services/warehouses.service';
import { SuppliersService } from './services/suppliers.service';
import { CustomersService } from './services/customers.service';
import { TaxRatesService } from './services/tax-rates.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    MaterialsController,
    CategoriesController,
    WarehousesController,
    SuppliersController,
    CustomersController,
    TaxRatesController,
  ],
  providers: [
    MaterialsService,
    CategoriesService,
    WarehousesService,
    SuppliersService,
    CustomersService,
    TaxRatesService,
  ],
  exports: [
    MaterialsService,
    CategoriesService,
    WarehousesService,
    SuppliersService,
    CustomersService,
    TaxRatesService,
  ],
})
export class MasterModule {}
