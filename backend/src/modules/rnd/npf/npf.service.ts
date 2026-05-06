import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateNPFDto } from '../dto/create-npf.dto';
import { UserRole, SampleStatus } from '@prisma/client';

@Injectable()
export class NpfService {
  constructor(private prisma: PrismaService) {}

  async create(createNPFDto: CreateNPFDto) {
    const npf = await this.prisma.newProductForm.create({
      data: {
        productName: createNPFDto.productName,
        targetPrice: createNPFDto.targetPrice,
        conceptNotes: createNPFDto.conceptNotes,
        leadId: createNPFDto.leadId,
      },
    });

    // Automation Trigger: Create initial sample for R&D Pipeline
    // Find first active R&D user to assign
    const rndUser = await this.prisma.user.findFirst({
      where: { roles: { has: UserRole.RND }, status: 'ACTIVE' },
    });

    if (rndUser) {
      const sampleCode = await this.generateSampleCode();
      await this.prisma.sampleRequest.create({
        data: {
          sampleCode: sampleCode,
          npfId: npf.id,
          rndId: rndUser.id,
          version: 1,
          leadId: createNPFDto.leadId,
          productName: createNPFDto.productName,
          targetFunction: 'General',
          textureReq: 'Standard',
          colorReq: 'Natural',
          aromaReq: 'Fresh',
        },
      });
    }

    return npf;
  }

  async findAll() {
    return this.prisma.newProductForm.findMany({
      include: { lead: { select: { clientName: true } } },
      orderBy: { productName: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.newProductForm.findUnique({
      where: { id },
      include: { lead: true, samples: true },
    });
  }

  private async generateSampleCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `SMP-${year}${month}-`;

    const lastSample = await this.prisma.sampleRequest.findFirst({
      where: {
        sampleCode: {
          startsWith: prefix,
        },
      },
      orderBy: {
        sampleCode: 'desc',
      },
    });

    let seq = 1;
    if (lastSample) {
      const lastSeq = parseInt(lastSample.sampleCode.split('-')[2]);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${prefix}${seq.toString().padStart(3, '0')}`;
  }
}
