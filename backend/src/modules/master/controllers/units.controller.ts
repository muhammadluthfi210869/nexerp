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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { UnitsService } from '../services/units.service';
import { CreateUnitDto, UpdateUnitDto } from '../dto/unit.dto';
import { ExportQueryDto, ImportDataDto } from '../dto/import-export.dto';

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

@ApiTags('Master Data')
@Controller('master/units')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
  constructor(
    private readonly service: UnitsService,
    private readonly importExportService: ImportExportService
  ) {}

  @Get('export')
  async exportUnits(@Query() query: ExportQueryDto, @Req() req: any) {
    const actor = extractActor(req);
    return this.importExportService.exportData('unit', query, {
      actor,
      tenantId: actor.organizationId,
      format: query?.format,
    });
  }

  @Post('import')
  async importUnits(@Body() body: ImportDataDto, @Req() req: any) {
    const actor = extractActor(req);
    const rowsOrCsv = body.csvContent || body.rows || [];
    return this.importExportService.importData('unit', rowsOrCsv, {
      actor,
      tenantId: actor.organizationId,
      idempotencyKey: body.idempotencyKey,
      dryRun: !!body.dryRun,
    });
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.PRODUCTION)
  create(@Body() dto: CreateUnitDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.PRODUCTION)
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.PRODUCTION)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
