import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LegalityBatch3Service } from './legality-batch3.service';

/**
 * BATCH 3 — Cross-module listener.
 *
 * Listens for `rnd.sample.approved` (emitted by RndService on SampleStage
 * transition to APPROVED) and triggers idempotent Legalitas intake.
 *
 * The actual event payload is the SampleRequest id. Anything that emits
 * `{ sampleRequestId, actorId }` works — see RndService for the source.
 *
 * Failures are logged but DO NOT crash the originating R&D transaction —
 * intake is a fire-and-forget side effect, not a hard precondition.
 *
 * NOTE: `@OnEvent` only fires when the listener class is registered as a
 * provider inside a fully-bootstrapped NestApplication. In TestingModule
 * the decorator metadata is set but the wiring doesn't happen — see the
 * e2e spec for manual `eventEmitter.on()` registration in tests.
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
        `[INTAKE] sample=${payload.sampleRequestId} → pipeline=${result.pipeline.id} (idempotent=${result.idempotent})`,
      );
    } catch (err) {
      // INV-03: legal gate is enforced at SO-creation time, not here.
      // Intake failure must not bubble back into R&D transaction.
      this.logger.error(
        `[INTAKE] failed for sample ${payload.sampleRequestId}: ${(err as Error).message}`,
      );
    }
  }
}

