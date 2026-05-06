import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PurchaseReturnsService } from '../services/purchase-returns.service';
import {
  CreatePurchaseReturnDto,
  UpdatePurchaseReturnStatusDto,
} from '../dto/purchase-return.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('scm/purchase-returns')
@UseGuards(JwtAuthGuard)
export class PurchaseReturnsController {
  constructor(private readonly service: PurchaseReturnsService) {}

  @Post()
  async create(@Body() dto: CreatePurchaseReturnDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseReturnStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
