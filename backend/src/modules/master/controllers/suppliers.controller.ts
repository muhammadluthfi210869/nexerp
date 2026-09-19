import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from '../services/suppliers.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  QuerySupplierDto,
} from '../dto/supplier.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

import { ImportExportService } from '../services/import-export.service';

@Controller(['master/suppliers', 'suppliers'])
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly importExportService: ImportExportService
  ) {}

  @Get('export')
  async exportSuppliers(@Query() query?: any) {
    return this.importExportService.exportData('supplier', query);
  }

  @Post('import')
  async importSuppliers(@Body() body: any) {
    const rows = Array.isArray(body) ? body : body?.rows || body?.data || [];
    return this.importExportService.importData('supplier', rows, {
      idempotencyKey: body?.idempotencyKey,
      dryRun: !!body?.dryRun,
    });
  }

  @Get()
  findAll(@Query() query?: QuerySupplierDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}

