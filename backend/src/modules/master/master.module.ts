import { Module } from '@nestjs/common';
import { MaterialsController } from './controllers/materials.controller';
import { CategoriesController } from './controllers/categories.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { SuppliersController } from './controllers/suppliers.controller';
import { CustomersController } from './controllers/customers.controller';
import { CategoriesService } from './services/categories.service';
import { WarehousesService } from './services/warehouses.service';
import { SuppliersService } from './services/suppliers.service';
import { CustomersService } from './services/customers.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    MaterialsController,
    CategoriesController,
    WarehousesController,
    SuppliersController,
    CustomersController,
  ],
  providers: [
    CategoriesService,
    WarehousesService,
    SuppliersService,
    CustomersService,
  ],
  exports: [
    CategoriesService,
    WarehousesService,
    SuppliersService,
    CustomersService,
  ],
})
export class MasterModule {}
