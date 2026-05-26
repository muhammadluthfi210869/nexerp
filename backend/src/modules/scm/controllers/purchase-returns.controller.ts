import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PurchaseReturnsService } from '../services/purchase-returns.service';
import {
  CreatePurchaseReturnDto,
  UpdatePurchaseReturnStatusDto,
} from '../dto/purchase-return.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('scm/purchase-returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseReturnsController {
  constructor(private readonly service: PurchaseReturnsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  async create(
    @Body() dto: CreatePurchaseReturnDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE, UserRole.FINANCE)
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE, UserRole.FINANCE)
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseReturnStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
