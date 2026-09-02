import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class OmniCrmStateService {
  constructor(private prisma: PrismaService) {}

  async getOrNull(ownerId: string) {
    return this.prisma.omniCrmState.findUnique({ where: { ownerId } });
  }

  async upsert(ownerId: string, state: unknown, expectedVersion?: number) {
    const existing = await this.prisma.omniCrmState.findUnique({ where: { ownerId } });
    if (!existing) {
      return this.prisma.omniCrmState.create({
        data: { ownerId, state: state as any, version: 1 },
      });
    }
    if (expectedVersion !== undefined && expectedVersion !== existing.version) {
      throw new Error('VERSION_CONFLICT');
    }
    return this.prisma.omniCrmState.update({
      where: { ownerId },
      data: { state: state as any, version: existing.version + 1 },
    });
  }
}
