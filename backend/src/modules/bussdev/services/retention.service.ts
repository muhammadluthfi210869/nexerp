import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RetentionService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async triggerRetentionCheck(leadId: string) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const retention = await this.prisma.retentionEngine.upsert({
      where: { leadId },
      create: { leadId, status: 'WAITING' },
      update: {},
    });

    return {
      retentionId: retention.id,
      leadId,
      status: retention.status,
      message: 'Retention check triggered',
    };
  }
}
