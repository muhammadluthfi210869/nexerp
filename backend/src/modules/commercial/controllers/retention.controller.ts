import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commercial/retention')
export class RetentionController {
  constructor(private prisma: PrismaService) {}

  @Get('radar')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.DIGIMAR)
  async getRadar() {
    const today = new Date();
    const fourteenDaysLater = new Date();
    fourteenDaysLater.setDate(today.getDate() + 14);

    return this.prisma.retentionEngine.findMany({
      where: {
        estDepletionDate: {
          lte: fourteenDaysLater,
        },
        status: 'WAITING',
      },
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            contactInfo: true,
            status: true,
          },
        },
      },
      orderBy: { estDepletionDate: 'asc' },
    });
  }
}
