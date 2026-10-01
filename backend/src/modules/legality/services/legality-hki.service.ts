import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { LegalStatus } from '@prisma/client';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions/api-exception';
import {
  injectTimeMetrics,
  permitAuditRisk,
} from './legality-common';

@Injectable()
export class LegalityHkiService {
  constructor(private readonly prisma: PrismaService) {}

  async getHkiRecords() {
    const records = await this.prisma.hkiRecord.findMany({
      include: { pic: true },
      orderBy: { applicationDate: 'desc' },
    });
    return records.map((r) => injectTimeMetrics(r));
  }

  async createHki(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const { picId, ...rest } = data;
      const record = await tx.hkiRecord.create({
        data: {
          ...rest,
          pic: picId ? { connect: { id: picId } } : undefined,
          status: rest.status ?? LegalStatus.IN_PROGRESS,
          stage: rest.stage ?? 'DRAFT',
          auditRisk: permitAuditRisk(rest.expiryDate),
        },
      });

      await tx.legalTimelineLog.create({
        data: {
          recordId: record.id,
          recordType: 'HKI',
          action: 'CREATED',
          newStage: 'DRAFT',
          notes: 'Record initialized in auditory log.',
          staffName: 'System',
        },
      });

      return record;
    });
  }

  async advanceHkiStage(id: string) {
    const record = await this.prisma.hkiRecord.findUnique({ where: { id } });
    if (!record) throw new ResourceNotFoundException('HKI Record', id);
    if (record.status === LegalStatus.DONE)
      throw new BusinessRuleViolationException(
        'legality-already-completed',
        'Record HKI sudah selesai dan tidak bisa dilanjutkan.',
        { entity: 'HkiRecord', id, status: record.status },
      );

    const stageOrder = [
      'DRAFT',
      'SUBMITTED',
      'EVALUATION',
      'REVISION',
      'PUBLISHED',
    ];
    const currentIdx = stageOrder.indexOf(record.stage);
    if (currentIdx === -1 || currentIdx >= stageOrder.length - 1) {
      throw new BusinessRuleViolationException(
        'legality-no-next-stage',
        `Stage HKI tidak bisa dilanjutkan dari "${record.stage}": sudah di stage terakhir.`,
        { entity: 'HkiRecord', id, stage: record.stage, stageOrder },
      );
    }

    const nextStage = stageOrder[currentIdx + 1] as any;
    const nextStatus =
      nextStage === 'PUBLISHED' ? LegalStatus.DONE : LegalStatus.IN_PROGRESS;

    return this.prisma.$transaction(async (tx) => {
      await tx.hkiRecord.update({
        where: { id },
        data: { stage: nextStage, status: nextStatus },
      });

      return tx.legalTimelineLog.create({
        data: {
          recordId: id,
          recordType: 'HKI',
          action: 'STAGE_UPDATED',
          previousStage: record.stage,
          newStage: nextStage,
          notes: `Automated advance from ${record.stage} to ${nextStage}`,
          staffName: 'System',
        },
      });
    });
  }
}
