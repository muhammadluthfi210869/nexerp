import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class RouteAliasController {
  constructor(private prisma: PrismaService) {}

  @Get('master/materials')
  async getMasterMaterials() {
    return this.prisma.materialItem.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('warehouse/warehouses')
  async getWarehouseWarehouses() {
    return this.prisma.warehouse.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }
}
