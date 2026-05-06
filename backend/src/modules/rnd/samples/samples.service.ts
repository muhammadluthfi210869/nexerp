import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateSampleDto } from '../dto/create-sample.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class SamplesService {
  constructor(private prisma: PrismaService) {}

  async create(createSampleDto: CreateSampleDto) {
    // [HARDENING: RND_ID RESOLUTION]
    // If the frontend fallback was used, try to resolve to the first RND user
    if (createSampleDto.rndId === '00000000-0000-0000-0000-000000000000') {
      const rndUser = await this.prisma.user.findFirst({
        where: { roles: { has: UserRole.RND } },
      });
      if (rndUser) createSampleDto.rndId = rndUser.id;
    }

    // Resolve leadId from NPF
    const npf = await this.prisma.newProductForm.findUnique({
      where: { id: createSampleDto.npfId },
      select: { leadId: true },
    });

    const sampleCode = await this.generateSampleCode();

    return this.prisma.sampleRequest.create({
      data: {
        sampleCode: sampleCode,
        npfId: createSampleDto.npfId,
        rndId: createSampleDto.rndId,
        version: createSampleDto.version || 1,
        leadId: npf?.leadId || 'UNKNOWN_UUID', // Fallback but better
        productName: 'Sample from NPF',
        targetFunction: 'General',
        textureReq: 'Standard',
        colorReq: 'Natural',
        aromaReq: 'Fresh',
      },
    });
  }

  async findAll() {
    return this.prisma.sampleRequest.findMany({
      include: {
        npf: { select: { productName: true } },
        rnd: { select: { fullName: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.sampleRequest.findUnique({
      where: { id },
      include: { formulas: true, feedbacks: true },
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
