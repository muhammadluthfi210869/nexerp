import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
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
  async exportCustomers(@Query() query: ExportQueryDto, @Req() req: any) {
    const actor = extractActor(req);
    return this.importExportService.exportData('customer', query, {
      actor,
      tenantId: actor.organizationId,
      format: query?.format,
    });
  }

  @Post('import')
  @ApiOperation({ summary: 'Import customers' })
  async importCustomers(@Body() body: ImportDataDto, @Req() req: any) {
    const actor = extractActor(req);
    const rowsOrCsv = body.csvContent || body.rows || [];
    return this.importExportService.importData('customer', rowsOrCsv, {
      actor,
      tenantId: actor.organizationId,
      idempotencyKey: body.idempotencyKey,
      dryRun: !!body.dryRun,
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
