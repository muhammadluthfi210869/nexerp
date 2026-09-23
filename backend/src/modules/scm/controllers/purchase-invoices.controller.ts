import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PurchaseInvoicesService } from '../services/purchase-invoices.service';
import { CreatePurchaseInvoiceDto } from '../dto/purchase-invoice.dto';

@ApiTags('purchase')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['purchase/invoices', 'scm/purchase-invoices'])
export class PurchaseInvoicesController {
  constructor(private readonly service: PurchaseInvoicesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE)
  @ApiOperation({ summary: 'Create a Purchase Invoice (Bill) with 4-leg match' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  create(@Body() dto: CreatePurchaseInvoiceDto) {
    return this.service.create(dto);
  }

  @Post('import')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE)
  @ApiOperation({ summary: 'Import Purchase Invoices from Excel/CSV' })
  importExcel(@Body('rows') rows: any[]) {
    return this.service.importExcel(rows);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get all Purchase Invoices' })
  findAll(
    @Query('status') status?: any,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ status, search });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get a single Purchase Invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
