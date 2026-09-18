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

  async enqueue(tx: Prisma.TransactionClient, input: OutboxEventInput) {
    const idempotencyKey = this.computeIdempotencyKey(input);
    return await tx.outboxEvent.create({
      data: {
        eventType: input.eventType,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        idempotencyKey,
        payload: input.payload as any,
        correlationId: input.correlationId,
        tenantId: input.tenantId || null,
        status: OutboxStatus.PENDING,
        nextAttemptAt: new Date()
      }
    });
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
      return { deadLettered: true };
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
