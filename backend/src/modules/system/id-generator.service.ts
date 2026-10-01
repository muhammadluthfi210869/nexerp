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

  /**
   * Generates Universal Code according to REQUIREMENT.md (Poin 148-154):
   * Versi lengkap: kode-perusahaan-divisi-produk-tanggal-nomor-urut (e.g. DL-FIN-SO-29062026-0001)
   * Versi ringkas: produk-tanggal-nomor-urut (e.g. SO-29062026-0001)
   * Nomor urut bersifat global dan berkelanjutan (4 digit 0001), tidak reset per periode.
   */
  async generateUniversalCode(
    productOrPrefix: string,
    options: {
      company?: string;
      division?: string;
      version?: 'FULL' | 'COMPACT';
      date?: Date;
    } = {},
  ): Promise<string> {
    const {
      company = 'DL',
      division,
      version = 'COMPACT',
      date = new Date(),
    } = options;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const dateStr = `${day}${month}${year}`;

    const prefixKey = productOrPrefix.toUpperCase();

    const sequence = await this.prisma.systemSequence.upsert({
      where: {
        prefix_period: {
          prefix: `UNIVERSAL_${prefixKey}`,
          period: 'GLOBAL',
        },
      },
      update: {
        lastValue: {
          increment: 1,
        },
      },
      create: {
        prefix: `UNIVERSAL_${prefixKey}`,
        period: 'GLOBAL',
        lastValue: 1,
      },
    });

    const seqStr = sequence.lastValue.toString().padStart(4, '0');

    if (version === 'FULL') {
      const divStr = division ? division.toUpperCase() : 'OPS';
      return `${company.toUpperCase()}-${divStr}-${prefixKey}-${dateStr}-${seqStr}`;
    }

    return `${prefixKey}-${dateStr}-${seqStr}`;
  }
}
