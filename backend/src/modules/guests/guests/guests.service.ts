import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateGuestDto } from '../dto/create-guest.dto';
import { UserRole, User } from '@prisma/client';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createGuestDto: CreateGuestDto) {
    return this.prisma.guestLog.create({
      data: {
        ...createGuestDto,
        visitDate: createGuestDto.visitDate
          ? new Date(createGuestDto.visitDate)
          : new Date(),
        bdId: userId,
      },
    });
  }

  async findAll(user: User) {
    const where = user.roles.includes(UserRole.SUPER_ADMIN)
      ? {}
      : { bdId: user.id };
    return this.prisma.guestLog.findMany({
      where,
      orderBy: { visitDate: 'desc' },
      include: { bd: { select: { fullName: true } } },
    });
  }

  async findOne(id: string, user: User) {
    const log = await this.prisma.guestLog.findUnique({
      where: { id },
    });
    if (!log) return null;

    if (!user.roles.includes(UserRole.SUPER_ADMIN) && log.bdId !== user.id) {
      throw new ForbiddenException('No access to this guest log');
    }
    return log;
  }
}
