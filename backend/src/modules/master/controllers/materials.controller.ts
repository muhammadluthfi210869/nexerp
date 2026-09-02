import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('master/materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.materialItem.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }
}
