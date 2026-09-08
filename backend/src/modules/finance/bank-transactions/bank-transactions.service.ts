import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class BankTransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bankTransaction.findMany();
  }

  async findOne(id: string) {
    return this.prisma.bankTransaction.findUnique({ where: { id } });
  }

  // TODO: Sprint 3A/B/C will implement create, update, delete, post logic
}
