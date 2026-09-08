import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class PeriodLocksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.periodLock.findMany();
  }

  async findOne(id: string) {
    return this.prisma.periodLock.findUnique({ where: { id } });
  }

  // TODO: Sprint 3A/B/C will implement create, update, delete, post logic
}
