import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class SampleFeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { customerId?: string }) {
    const where: any = {};
    if (filter?.customerId) where.customerId = filter.customerId;
    return this.prisma.sampleFee.findMany({
      where,
      orderBy: { feeDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const fee = await this.prisma.sampleFee.findUnique({ where: { id } });
    if (!fee) throw new NotFoundException(`Sample fee ${id} not found`);
    return fee;
  }

  /**
   * Record a sample-related fee (e.g., sample production cost billed to customer).
   * Auto-generates feeNumber SF-YYMM-XXXXX.
   */
  async create(
    _userId: string,
    dto: {
      customerId: string;
      amount: number;
      feeDate?: string;
      notes?: string;
    },
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('amount must be > 0');
    }

    const now = new Date(dto.feeDate || Date.now());
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.sampleFee.count({
      where: { feeNumber: { startsWith: `SF-${yymm}-` } },
    });
    const feeNumber = `SF-${yymm}-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.sampleFee.create({
      data: {
        feeNumber,
        customerId: dto.customerId,
        amount: dto.amount,
        feeDate: now,
        notes: dto.notes,
      },
    });
  }

  /**
   * Link a sample fee to a DownPayment (offset against advance).
   */
  async linkToDownPayment(_userId: string, id: string, dpId: string) {
    const fee = await this.prisma.sampleFee.findUnique({ where: { id } });
    if (!fee) throw new NotFoundException(`Sample fee ${id} not found`);
    if (fee.offsetToDPId) {
      throw new BadRequestException(`Fee already linked to DP ${fee.offsetToDPId}`);
    }
    return this.prisma.sampleFee.update({
      where: { id },
      data: { offsetToDPId: dpId },
    });
  }

  async unlinkFromDownPayment(_userId: string, id: string) {
    const fee = await this.prisma.sampleFee.findUnique({ where: { id } });
    if (!fee) throw new NotFoundException(`Sample fee ${id} not found`);
    return this.prisma.sampleFee.update({
      where: { id },
      data: { offsetToDPId: null },
    });
  }
}
