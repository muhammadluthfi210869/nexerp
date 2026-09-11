import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

/**
 * AdjustmentJournal = Manual Jurnal Penyesuaian (accruals, deferrals, corrections).
 * Workflow: PREPARED → REVIEWED → APPROVED (with 2-person rule).
 */
@Injectable()
export class AdjustmentJournalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { period?: string; approvedBy?: string }) {
    const where: any = {};
    if (filter?.period) {
      const periodStart = new Date(filter.period);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      where.period = { gte: periodStart, lt: periodEnd };
    }
    if (filter?.approvedBy) {
      // implies fully approved
      where.approvedBy = { not: null };
    }

    return this.prisma.adjustmentJournal.findMany({
      where,
      orderBy: { period: 'desc' },
    });
  }

  async findOne(id: string) {
    const journal = await this.prisma.adjustmentJournal.findUnique({ where: { id } });
    if (!journal) throw new NotFoundException(`Adjustment journal ${id} not found`);
    return journal;
  }

  /**
   * Draft a new adjustment journal. Auto-generates journalNumber.
   */
  async create(
    userId: string,
    dto: {
      period: string;
      description: string;
      totalAmount: number;
      attachmentUrls?: string[];
    },
  ) {
    if (dto.totalAmount <= 0) {
      throw new BadRequestException('totalAmount must be > 0');
    }
    if (!dto.description || dto.description.length < 5) {
      throw new BadRequestException('description must be at least 5 characters');
    }

    const period = new Date(dto.period);
    if (isNaN(period.getTime())) {
      throw new BadRequestException('Invalid period (YYYY-MM-DD)');
    }

    const yymm = `${String(period.getFullYear()).slice(-2)}${String(period.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.adjustmentJournal.count({
      where: { journalNumber: { startsWith: `ADJ-${yymm}-` } },
    });
    const journalNumber = `ADJ-${yymm}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.adjustmentJournal.create({
      data: {
        journalNumber,
        period,
        description: dto.description,
        totalAmount: dto.totalAmount,
        attachmentUrls: dto.attachmentUrls || [],
        preparedBy: userId,
      },
    });
  }

  /**
   * Review the draft (different person from preparer — SoD).
   */
  async review(userId: string, id: string) {
    const journal = await this.prisma.adjustmentJournal.findUnique({ where: { id } });
    if (!journal) throw new NotFoundException(`Adjustment journal ${id} not found`);
    if (!journal.preparedBy) {
      throw new BadRequestException('Not yet prepared');
    }
    if (journal.reviewedBy) {
      throw new BadRequestException('Already reviewed');
    }
    if (journal.reviewedBy === userId || journal.preparedBy === userId) {
      throw new BadRequestException('Reviewer must be different from preparer (SoD rule)');
    }
    if (journal.approvedBy) {
      throw new BadRequestException('Already approved, cannot review');
    }

    return this.prisma.adjustmentJournal.update({
      where: { id },
      data: { reviewedBy: userId },
    });
  }

  /**
   * Approve the reviewed journal (3rd person — full SoD chain).
   */
  async approve(userId: string, id: string) {
    const journal = await this.prisma.adjustmentJournal.findUnique({ where: { id } });
    if (!journal) throw new NotFoundException(`Adjustment journal ${id} not found`);
    if (!journal.reviewedBy) {
      throw new BadRequestException('Not yet reviewed');
    }
    if (journal.approvedBy) {
      throw new BadRequestException('Already approved');
    }
    if (
      journal.approvedBy === userId ||
      journal.reviewedBy === userId ||
      journal.preparedBy === userId
    ) {
      throw new BadRequestException(
        'Approver must be different from preparer AND reviewer (full SoD)',
      );
    }

    return this.prisma.adjustmentJournal.update({
      where: { id },
      data: { approvedBy: userId },
    });
  }

  /**
   * Get approval progress for a single journal.
   */
  async getProgress(id: string) {
    const journal = await this.findOne(id);
    return {
      id: journal.id,
      journalNumber: journal.journalNumber,
      totalAmount: journal.totalAmount,
      prepared: Boolean(journal.preparedBy),
      reviewed: Boolean(journal.reviewedBy),
      approved: Boolean(journal.approvedBy),
      fullyApproved:
        Boolean(journal.preparedBy && journal.reviewedBy && journal.approvedBy),
      preparedBy: journal.preparedBy,
      reviewedBy: journal.reviewedBy,
      approvedBy: journal.approvedBy,
    };
  }
}
