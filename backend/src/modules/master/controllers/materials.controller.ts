import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { MaterialsService } from '../services/materials.service';
import { CreateMaterialDto, UpdateMaterialDto } from '../dto/material.dto';

@ApiTags('Master Data - Materials / Barang')
@ApiBearerAuth()
@Controller('v1/master/materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'List materials with search, category filter, and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.materialsService.findAll({ search, categoryId, type, page, limit });
  }

  @Get('active')
  @ApiOperation({ summary: 'List active materials for quick dropdown/searchable select' })
  @ApiQuery({ name: 'search', required: false })
  findActive(@Query('search') search?: string) {
    return this.materialsService.findActive(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material detail by ID' })
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new material / goods item' })
  create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing material / goods item' })
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft delete) a material / goods item' })
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }

  // Item 39: Get supplier history for a product
  @Get(':id/supplier-history')
  @ApiOperation({ summary: 'Get supplier purchase history for a product' })
  async getSupplierHistory(@Param('id') id: string) {
    return this.materialsService.getSupplierHistory(id);
  }

  // Item 72: Get HPP breakdown for a product
  @Get(':id/hpp-breakdown')
  @ApiOperation({ summary: 'Get HPP calculation breakdown for a product' })
  async getHppBreakdown(@Param('id') id: string) {
    return this.materialsService.getHppBreakdown(id);
  }}
