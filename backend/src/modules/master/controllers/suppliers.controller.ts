import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from '../services/suppliers.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  QuerySupplierDto,
} from '../dto/supplier.dto';
import { ExportQueryDto, ImportDataDto } from '../dto/import-export.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

import { ImportExportService } from '../services/import-export.service';

function extractActor(req: any) {
  const user = req?.user;
  return {
    id: user?.id || 'anonymous',
    roles: Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []),
    organizationId: user?.organizationId || user?.tenantId || undefined,
    divisionId: user?.divisionId || undefined,
  };
}

@Controller(['master/suppliers', 'suppliers'])
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly importExportService: ImportExportService
  ) {}

  @Get('export')
  async exportSuppliers(@Query() query: ExportQueryDto, @Req() req: any) {
    const actor = extractActor(req);
    return this.importExportService.exportData('supplier', query, {
      actor,
      tenantId: actor.organizationId,
      format: query?.format,
    });
  }

  @Post('import')
  async importSuppliers(@Body() body: ImportDataDto, @Req() req: any) {
    const actor = extractActor(req);
    const rowsOrCsv = body.csvContent || body.rows || [];
    return this.importExportService.importData('supplier', rowsOrCsv, {
      actor,
      tenantId: actor.organizationId,
      idempotencyKey: body.idempotencyKey,
      dryRun: !!body.dryRun,
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

