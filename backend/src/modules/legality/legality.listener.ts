import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { RegStage } from '@prisma/client';

@Injectable()
export class LegalityListener {
  private readonly logger = new Logger(LegalityListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('legality.pnbp_paid')
  async handlePnbpPaid(payload: { pnbpId: string }) {
    this.logger.log(
      `[EVENT] PNBP Paid: ${payload.pnbpId}. Advancing pipeline stage.`,
    );

    try {
      const pnbp = await this.prisma.pNBPRequest.findUnique({
        where: { id: payload.pnbpId },
        include: { pipeline: true },
      });

      if (!pnbp || !pnbp.pipeline) return;

      // Advance stage to EVALUATION
      await this.prisma.regulatoryPipeline.update({
        where: { id: pnbp.pipelineId },
        data: {
          currentStage: RegStage.EVALUATION,
          pnbpStatus: true,
          logHistory: {
            push: {
              stage: RegStage.EVALUATION,
              date: new Date().toISOString(),
              notes: 'AUTO-ADVANCE: PNBP Payment verified.',
            },
          } as any,
        },
      });

      this.logger.log(
        `[PIPELINE] Pipeline ${pnbp.pipelineId} advanced to EVALUATION.`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to advance pipeline: ${error.message}`);
    }
  }
}
