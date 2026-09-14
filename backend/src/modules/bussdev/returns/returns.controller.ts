import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('bussdev/returns')
@ApiBearerAuth()
@Controller(['bussdev/returns', 'v1/bussdev/returns'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly service: ReturnsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'List all sales returns' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get sales return by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  @ApiOperation({ summary: 'Create a sales return record' })
  create(@Body() dto: CreateReturnDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  @ApiOperation({ summary: 'Update return status/notes' })
  update(
    @Param('id') id: string,
    @Body() dto: { returnStatus?: string; notes?: string },
  ) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  @ApiOperation({ summary: 'Soft-delete a sales return' })
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
