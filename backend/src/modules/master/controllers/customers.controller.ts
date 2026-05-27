import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CustomersService } from '../services/customers.service';

@ApiTags('Master Data')
@ApiBearerAuth()
@Controller('master/customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

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
}
