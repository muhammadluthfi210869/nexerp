import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class IntangibleAssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.intangibleAsset.findMany();
  }

  async findOne(id: string) {
    return this.prisma.intangibleAsset.findUnique({ where: { id } });
  }

  // TODO: Sprint 3A/B/C will implement create, update, delete, post logic
}
