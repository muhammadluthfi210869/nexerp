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
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { ImportExportService } from '../services/import-export.service';

@ApiTags('Master Data')
@Controller('master/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly importExportService: ImportExportService
  ) {}

  @Get('export')
  async exportCategories(@Query() query?: any) {
    return this.importExportService.exportData('category', query);
  }

  @Post('import')
  async importCategories(@Body() body: any) {
    const rows = Array.isArray(body) ? body : body?.rows || body?.data || [];
    return this.importExportService.importData('category', rows, {
      idempotencyKey: body?.idempotencyKey,
      dryRun: !!body?.dryRun,
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
