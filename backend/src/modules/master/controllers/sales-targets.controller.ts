import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SalesTargetsService } from '../services/sales-targets.service';
import {
  CreateSalesTargetDto,
  UpdateSalesTargetDto,
  CreateSalesCategoryDto,
  UpdateSalesCategoryDto,
} from '../dto/sales-target.dto';

@ApiTags('Master Sales Targets & Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('master')
export class SalesTargetsController {
  constructor(private readonly salesTargetsService: SalesTargetsService) {}

  // ==========================================
  // SALES TARGETS
  // ==========================================

  @Get('sales-targets')
  @ApiOperation({ summary: 'List all sales targets with real revenue realization' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async findAllTargets(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.salesTargetsService.findAllTargets(month, year);
  }

  @Get('sales-targets/users')
  @ApiOperation({ summary: 'Get list of users available for sales target assignment' })
  async getMarketingUsers() {
    return this.salesTargetsService.getMarketingUsers();
  }

  @Get('sales-targets/:id')
  @ApiOperation({ summary: 'Get a sales target by ID' })
  async findTargetById(@Param('id') id: string) {
    return this.salesTargetsService.findTargetById(id);
  }

  @Post('sales-targets')
  @ApiOperation({ summary: 'Create or update a sales target' })
  async createTarget(@Body() dto: CreateSalesTargetDto) {
    return this.salesTargetsService.createTarget(dto);
  }

  @Put('sales-targets/:id')
  @ApiOperation({ summary: 'Update a sales target' })
  async updateTarget(
    @Param('id') id: string,
    @Body() dto: UpdateSalesTargetDto,
  ) {
    return this.salesTargetsService.updateTarget(id, dto);
  }

  @Delete('sales-targets/:id')
  @ApiOperation({ summary: 'Delete a sales target' })
  async deleteTarget(@Param('id') id: string) {
    return this.salesTargetsService.deleteTarget(id);
  }

  // ==========================================
  // SALES CATEGORIES
  // ==========================================

  @Get('sales-categories')
  @ApiOperation({ summary: 'List all sales categories' })
  async findAllCategories() {
    return this.salesTargetsService.findAllCategories();
  }

  @Post('sales-categories')
  @ApiOperation({ summary: 'Create a sales category' })
  async createCategory(@Body() dto: CreateSalesCategoryDto) {
    return this.salesTargetsService.createCategory(dto);
  }

  @Post('sales-categories/seed')
  @ApiOperation({ summary: 'Seed 5 default standard G-SERP sales categories' })
  async seedCategories() {
    return this.salesTargetsService.seedDefaultCategories();
  }

  @Put('sales-categories/:id')
  @ApiOperation({ summary: 'Update a sales category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateSalesCategoryDto,
  ) {
    return this.salesTargetsService.updateCategory(id, dto);
  }

  @Delete('sales-categories/:id')
  @ApiOperation({ summary: 'Delete a sales category' })
  async deleteCategory(@Param('id') id: string) {
    return this.salesTargetsService.deleteCategory(id);
  }
}
