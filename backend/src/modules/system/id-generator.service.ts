import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class IdGeneratorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a standardized ID in format: PREFIX-YYMM-SEQ
   * Example: SO-2605-001
   * @param prefix Entity prefix (SO, BMR, PO, etc.)
   * @param seqLength Length of the sequence part (default 3)
   */
  async generateId(prefix: string, seqLength: number = 3): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const period = `${year}${month}`; // e.g., "2605"

    return this.prisma.$transaction(async (tx) => {
      const sequence = await tx.systemSequence.upsert({
        where: {
          prefix_period: {
            prefix,
            period,
          },
        },
        update: {
          lastValue: {
            increment: 1,
          },
        },
        create: {
          prefix,
          period,
          lastValue: 1,
        },
      });

      const paddedSeq = sequence.lastValue.toString().padStart(seqLength, '0');
      return `${prefix}-${period}-${paddedSeq}`;
    });
  }

  /**
   * Helper to generate IDs for production stages with sub-sequences if needed
   */
  async generateStageId(stage: string): Promise<string> {
    const prefixMap: Record<string, string> = {
      MIXING: 'MIX',
      FILLING: 'FIL',
      PACKING: 'PAC',
      BATCHING: 'BAT',
    };
    const prefix = prefixMap[stage] || stage.substring(0, 3).toUpperCase();
    return this.generateId(prefix);
  }
}
