import { Module } from '@nestjs/common';
import { MaterialsController } from './controllers/materials.controller';
import { CategoriesController } from './controllers/categories.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { SuppliersController } from './controllers/suppliers.controller';
import { CustomersController } from './controllers/customers.controller';
import { TaxRatesController } from './controllers/tax-rates.controller';
import { UnitsController } from './controllers/units.controller';
import { DivisionsController } from './controllers/divisions.controller';
import { SystemConfigController } from './controllers/system-config.controller';
import { PersonnelController } from './controllers/personnel.controller';

import { MaterialsService } from './services/materials.service';
import { CategoriesService } from './services/categories.service';
import { WarehousesService } from './services/warehouses.service';
import { SuppliersService } from './services/suppliers.service';
import { CustomersService } from './services/customers.service';
import { TaxRatesService } from './services/tax-rates.service';
import { UnitsService } from './services/units.service';
import { ImportExportService } from './services/import-export.service';
import { DivisionsService } from './services/divisions.service';
import { SystemConfigService } from './services/system-config.service';
import { PersonnelService } from './services/personnel.service';

import { PrismaModule } from '../../prisma/prisma.module';
import { PlatformModule } from '../../platform/platform.module';

@Module({
  imports: [PrismaModule, PlatformModule],
  controllers: [
    MaterialsController,
    CategoriesController,
    WarehousesController,
    SuppliersController,
    CustomersController,
    TaxRatesController,
    UnitsController,
    DivisionsController,
    SystemConfigController,
    PersonnelController,
  ],
  providers: [
    MaterialsService,
    CategoriesService,
    WarehousesService,
    SuppliersService,
    CustomersService,
    TaxRatesService,
    UnitsService,
    ImportExportService,
    DivisionsService,
    SystemConfigService,
    PersonnelService,
  ],
  exports: [
    MaterialsService,
    CategoriesService,
    WarehousesService,
    SuppliersService,
    CustomersService,
    TaxRatesService,
    UnitsService,
    ImportExportService,
    DivisionsService,
    SystemConfigService,
    PersonnelService,
  ],
})
export class MasterModule {}

