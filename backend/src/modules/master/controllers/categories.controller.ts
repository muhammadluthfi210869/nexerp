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
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { ExportQueryDto, ImportDataDto } from '../dto/import-export.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiQuery, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

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
@ApiBearerAuth()
@Controller('master/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly importExportService: ImportExportService
  ) {}

  @Get('export')
  async exportCategories(@Query() query: ExportQueryDto, @Req() req: any) {
    const actor = extractActor(req);
    return this.importExportService.exportData('category', query, {
      actor,
      tenantId: actor.organizationId,
      format: query?.format,
    });
  }

  @Post('import')
  async importCategories(@Body() body: ImportDataDto, @Req() req: any) {
    const actor = extractActor(req);
    const rowsOrCsv = body.csvContent || body.rows || [];
    return this.importExportService.importData('category', rowsOrCsv, {
      actor,
      tenantId: actor.organizationId,
      idempotencyKey: body.idempotencyKey,
      dryRun: !!body.dryRun,
    });
  }

  @Get()
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['GOODS', 'SUPPLIER', 'CUSTOMER'],
  })
  findAll(@Query('type') type?: string) {
    return this.categoriesService.findAll(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
