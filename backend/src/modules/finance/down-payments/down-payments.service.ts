import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class DownPaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.downPayment.findMany();
  }

  async findOne(id: string) {
    return this.prisma.downPayment.findUnique({ where: { id } });
  }

  // TODO: Sprint 3A/B/C will implement create, update, delete, post logic
}
