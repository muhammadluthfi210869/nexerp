import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { TaxRatesService } from '../services/tax-rates.service';
import { CreateTaxRateDto, UpdateTaxRateDto } from '../dto/tax-rate.dto';

@ApiTags('Master Data')
@Controller('master/tax-rates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxRatesController {
  constructor(private readonly service: TaxRatesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  create(@Body() dto: CreateTaxRateDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  update(@Param('id') id: string, @Body() dto: UpdateTaxRateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}