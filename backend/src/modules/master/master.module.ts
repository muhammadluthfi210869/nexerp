import { Module } from '@nestjs/common';
import { CategoriesController } from './controllers/categories.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { SuppliersController } from './controllers/suppliers.controller';
import { CategoriesService } from './services/categories.service';
import { WarehousesService } from './services/warehouses.service';
import { SuppliersService } from './services/suppliers.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    CategoriesController,
    WarehousesController,
    SuppliersController,
  ],
  providers: [CategoriesService, WarehousesService, SuppliersService],
  exports: [CategoriesService, WarehousesService, SuppliersService],
})
export class MasterModule {}
