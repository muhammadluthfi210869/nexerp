import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class AssetTransfersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.assetTransfer.findMany();
  }

  async findOne(id: string) {
    return this.prisma.assetTransfer.findUnique({ where: { id } });
  }

  // TODO: Sprint 3A/B/C will implement create, update, delete, post logic
}
