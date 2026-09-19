/**
 * NEX ERP - Outbox Service (transactional outbox with lease/retry/DLQ)
 *
 * Stable idempotencyKey = sha256(eventType|aggregateType|aggregateId|payloadDigest).
 * Backoff schedule: 1s, 5s, 30s, 2m, 10m. After 5 attempts → DEAD_LETTER row.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient, OutboxStatus, Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';

const BACKOFF_MS = [1_000, 5_000, 30_000, 120_000, 600_000];
const LEASE_MS = 30_000;
const MAX_ATTEMPTS = 5;

export interface OutboxEventInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  correlationId: string;
  tenantId?: string;
}

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaClient) {}

  computeIdempotencyKey(input: OutboxEventInput): string {
    const payloadDigest = createHash('sha256').update(JSON.stringify(input.payload)).digest('hex');
    return createHash('sha256')
      .update(`${input.eventType}|${input.aggregateType}|${input.aggregateId}|${payloadDigest}`)
      .digest('hex');
  }

  async enqueue(txOrInput: any, maybeInput?: any, options?: { requireExternalTransaction?: boolean }) {
    if (options?.requireExternalTransaction && typeof txOrInput?.outboxEvent?.create !== 'function') {
      throw Object.assign(new Error('OUTBOX_NOT_ATOMIC: outbox event must be enqueued within active transaction'), {
        code: 'OUTBOX_NOT_ATOMIC',
        reason_code: 'OUTBOX_NOT_ATOMIC',
        gateId: 'outbox_retry_dedup'
      });
    }
    if (typeof txOrInput?.outboxEvent?.create === 'function') {
      return this.executeEnqueue(txOrInput, maybeInput);
    } else {
      return await this.prisma.$transaction(async tx => {
        return this.executeEnqueue(tx, txOrInput);
      });
    }
  }

  private resolveAggregateId(input: any): string {
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
    const rawAgg = input ? input.aggregateId : null;
    if (isUuid(rawAgg)) return rawAgg;
    const payloadId = input && input.payload ? input.payload.id : null;
    if (isUuid(payloadId)) return payloadId;
    return randomUUID();
  }

  private resolveEnqueueData(input: any) {
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
    const inp = input || {};
    const aggId = this.resolveAggregateId(inp);
    const rawCorr = inp.correlationId;
    const corrId = isUuid(rawCorr) ? rawCorr : randomUUID();
    const eventType = inp.eventType || inp.topic || 'event';
    const aggregateType = inp.aggregateType || 'Generic';
    const payload = inp.payload || {};
    const idempotencyKey = inp.idempotencyKey || this.computeIdempotencyKey({
      eventType,
      aggregateType,
      aggregateId: aggId,
      payload,
      correlationId: corrId
    });
    const tenantId = isUuid(inp.tenantId) ? inp.tenantId : null;
    return { eventType, aggregateType, aggregateId: aggId, idempotencyKey, payload, correlationId: corrId, tenantId };
  }

  private async executeEnqueue(tx: Prisma.TransactionClient, input: any) {
    const data = this.resolveEnqueueData(input);
    try {
      return await tx.outboxEvent.create({
        data: {
          eventType: data.eventType,
          aggregateType: data.aggregateType,
          aggregateId: data.aggregateId,
          idempotencyKey: data.idempotencyKey,
          payload: data.payload,
          correlationId: data.correlationId,
          tenantId: data.tenantId,
          status: OutboxStatus.PENDING,
          nextAttemptAt: new Date()
        }
      });
    } catch (e: any) {
      if (e.code === 'P2002' || (e.message && e.message.includes('idempotencyKey'))) {
        throw Object.assign(new Error('OUTBOX_DUPLICATE_REJECTED: duplicate idempotency key rejected'), {
          code: 'OUTBOX_DUPLICATE_REJECTED',
          reason_code: 'OUTBOX_DUPLICATE_REJECTED',
          gateId: 'outbox_retry_dedup'
        });
      }
      throw e;
    }
  }

  async claimBatch(workerId: string, batchSize = 10) {
    return this.claim(workerId, batchSize);
  }

  async claim(workerId: string, batchSize = 10) {
    const now = new Date();
    const leaseExpires = new Date(Date.now() + LEASE_MS);
    // Find PENDING or expired-lease IN_FLIGHT events
    const candidates = await this.prisma.outboxEvent.findMany({
      where: {
        OR: [
          { status: OutboxStatus.PENDING, nextAttemptAt: { lte: now } },
          { status: OutboxStatus.IN_FLIGHT, leaseExpiresAt: { lt: now } }
        ]
      },
      take: batchSize,
      orderBy: { createdAt: 'asc' }
    });
    const claimed = [];
    for (const ev of candidates) {
      const updated = await this.prisma.outboxEvent.updateMany({
        where: { id: ev.id, OR: [
          { status: OutboxStatus.PENDING },
          { status: OutboxStatus.IN_FLIGHT, leaseExpiresAt: { lt: now } }
        ]},
        data: { status: OutboxStatus.IN_FLIGHT, leaseOwner: workerId, leaseExpiresAt: leaseExpires, lastAttemptAt: now }
      });
      if (updated.count > 0) claimed.push({ ...ev, status: OutboxStatus.IN_FLIGHT, leaseOwner: workerId });
    }
    return claimed;
  }

  async ack(eventId: string) {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: { status: OutboxStatus.PUBLISHED, publishedAt: new Date(), leaseOwner: null, leaseExpiresAt: null }
    });
  }

  async fail(eventId: string, reason: string) {
    const ev = await this.prisma.outboxEvent.findUnique({ where: { id: eventId } });
    if (!ev) return;
    const attempts = ev.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: OutboxStatus.DEAD_LETTER,
          attempts,
          failureReason: reason,
          deadLetteredAt: new Date()
        }
      });
      await this.prisma.outboxDlq.create({
        data: { outboxEventId: eventId, payload: ev.payload as any, deadLetteredAt: new Date(), reason }
      });
      return { deadLettered: true, code: 'OUTBOX_DEAD_LETTERED', status: 'FAIL', reason_code: 'OUTBOX_DEAD_LETTERED', gate_id: 'outbox_retry_dedup' };
    }
    const nextAttempt = new Date(Date.now() + BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)]);
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxStatus.PENDING,
        attempts,
        failureReason: reason,
        nextAttemptAt: nextAttempt,
        leaseOwner: null,
        leaseExpiresAt: null
      }
    });
    return { deadLettered: false, attempts, nextAttempt };
  }
}
