import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LegalityBatch3Service } from './legality-batch3.service';

/**
 * BATCH 3 (corrected) — Cross-module listener.
 *
 * Listens for `rnd.sample.approved` and triggers Legalitas intake.
 *
 * Applicability is now driven by the sample's explicit
 * sampleRequest.legalApplicability field. UNKNOWN samples do NOT
 * auto-create pipelines — they emit a "decision required" event for a
 * Legalitas operator and surface a clear SO-eligibility BLOCK.
 *
 * Idempotency: replay of the same event never creates a duplicate
 * pipeline because intake itself is idempotent on
 * (leadId, sampleRequestId, type).
 */
@Injectable()
export class LegalityBatch3Listener {
  private readonly logger = new Logger(LegalityBatch3Listener.name);

  constructor(private readonly batch3: LegalityBatch3Service) {}

  @OnEvent('rnd.sample.approved', { async: true })
  async handleRndSampleApproved(payload: { sampleRequestId: string; actorId: string }) {
    if (!payload?.sampleRequestId) {
      this.logger.warn('rnd.sample.approved event missing sampleRequestId — skipped');
      return;
    }
    try {
      const result = await this.batch3.intakeForCompletedSample(
        payload.sampleRequestId,
        payload.actorId,
      );
      this.logger.log(
        `[INTAKE] sample=${payload.sampleRequestId} → pipeline=${result.pipeline?.id ?? 'none'} (idempotent=${result.idempotent}, applicability=${result.applicability})`,
      );
    } catch (err) {
      this.logger.error(
        `[INTAKE] failed for sample ${payload.sampleRequestId}: ${(err as Error).message}`,
      );
    }
  }
}
