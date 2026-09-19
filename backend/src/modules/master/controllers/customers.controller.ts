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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto/customer.dto';

import { ImportExportService } from '../services/import-export.service';

@ApiTags('Master Data')
@ApiBearerAuth()
@Controller(['master/customers', 'customers'])
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly importExportService: ImportExportService
  ) {}

  @Get('export')
  @ApiOperation({ summary: 'Export customers' })
  async exportCustomers(@Query() query?: any) {
    return this.importExportService.exportData('customer', query);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import customers' })
  async importCustomers(@Body() body: any) {
    const rows = Array.isArray(body) ? body : body?.rows || body?.data || [];
    return this.importExportService.importData('customer', rows, {
      idempotencyKey: body?.idempotencyKey,
      dryRun: !!body?.dryRun,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all customers (for dropdown)' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer detail' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
