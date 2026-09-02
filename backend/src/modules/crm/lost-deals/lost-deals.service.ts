import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateLostDealDto } from '../dto/create-lost-deal.dto';
import { UserRole, Prisma, User } from '@prisma/client';

@Injectable()
export class LostDealsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createLostDealDto: CreateLostDealDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create Lost Deal Record
      const lost = await tx.lostDeal.create({
        data: {
          leadId: createLostDealDto.leadId,
          stageLost: createLostDealDto.stageLost,
          reasonType: createLostDealDto.reasonType,
          notes: createLostDealDto.notes,
          bdId: userId,
        },
      });

      // 2. Update Lead Status automatically
      await tx.salesLead.update({
        where: { id: createLostDealDto.leadId },
        data: { status: 'LOST' },
      });

      return lost;
    });
  }

  async findAll(user: User) {
    const where = user.roles.includes(UserRole.SUPER_ADMIN)
      ? {}
      : { lead: { bdId: user.id } };
    return this.prisma.lostDeal.findMany({
      where,
      include: { lead: { select: { clientName: true } } },
    });
  }
}
