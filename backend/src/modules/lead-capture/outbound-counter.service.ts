import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';

const COLD_AT = 1;
const WARM_AT = 5;

@Injectable()
export class OutboundCounterService {
  private readonly logger = new Logger(OutboundCounterService.name);

  constructor(private prisma: PrismaService) {}

  async recordBusdevReply(leadId: string): Promise<void> {
    const updated = await this.prisma.leadCapture.update({
      where: { id: leadId },
      data: { outboundReplyCount: { increment: 1 } },
    });

    const count = updated.outboundReplyCount;
    let newStage: string | null = null;

    if (count === COLD_AT && updated.workflowStatus === 'NEW_LEAD') {
      newStage = 'COLD';
    } else if (count === WARM_AT) {
      newStage = 'WARM';
    }

    if (newStage && newStage !== updated.workflowStatus) {
      await this.prisma.leadCapture.update({
        where: { id: leadId },
        data: { workflowStatus: newStage as any },
      });

      await this.prisma.leadValidationLog.create({
        data: {
          leadId,
          type: 'APPROVAL',
          input: `outboundReplyCount=${count}`,
          output: JSON.stringify({ stage: newStage }),
          action: 'SAVED',
        },
      });

      this.logger.log(`Lead ${leadId} → ${newStage} (outbound ${count})`);
    }
  }
}
