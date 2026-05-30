import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../system/id-generator.service';

@Injectable()
export class JournalEngineService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async generateJournal(params: {
    transactionType: string;
    date: Date;
    description: string;
    amount: number;
    sourceId: string;
    soId?: string;
    poId?: string;
  }) {
    const config = await this.prisma.autoJournalConfig.findUnique({
      where: { transactionType: params.transactionType },
    });
    if (!config) {
      throw new BadRequestException(
        `No auto-journal config found for transaction type: ${params.transactionType}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const reference = await this.idGenerator.generateId('JRN');

      const entry = await tx.journalEntry.create({
        data: {
          date: params.date,
          reference,
          description: params.description,
          sourceDocumentType: params.transactionType as any,
          soId: params.soId,
          poId: params.poId,
          lines: {
            create: [
              {
                accountId: config.coaDebetId,
                debit: params.amount,
                credit: 0,
              },
              {
                accountId: config.coaCreditId,
                debit: 0,
                credit: params.amount,
              },
            ],
          },
        },
      });

      return entry;
    });
  }

  // ──────────────────────────────────────────────
  // AutoJournalConfig CRUD
  // ──────────────────────────────────────────────

  async getConfigs() {
    return this.prisma.autoJournalConfig.findMany();
  }

  async getConfig(transactionType: string) {
    return this.prisma.autoJournalConfig.findUnique({
      where: { transactionType },
    });
  }

  async upsertConfig(dto: {
    transactionType: string;
    coaDebetId: string;
    coaCreditId: string;
    description?: string;
  }) {
    return this.prisma.autoJournalConfig.upsert({
      where: { transactionType: dto.transactionType },
      update: {
        coaDebetId: dto.coaDebetId,
        coaCreditId: dto.coaCreditId,
        description: dto.description,
      },
      create: {
        transactionType: dto.transactionType,
        coaDebetId: dto.coaDebetId,
        coaCreditId: dto.coaCreditId,
        description: dto.description,
      },
    });
  }

  async deleteConfig(transactionType: string) {
    return this.prisma.autoJournalConfig.delete({
      where: { transactionType },
    });
  }
}
