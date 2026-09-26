/**
 * storage.service.ts — NEX ERP Batch 1.
 *
 * Idempotent staging persistence. Wraps Prisma unique-constraint
 * protection. Internal to the Self-QR module; never imported by ERP.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { LEAD_VALIDATION_EVENTS, SelfQrEventPersistedPayload } from '../lead-capture/lead-validation.events';
import type {
  NormalizedWhatsAppEvent,
  EventSourceCode,
  ProviderCode,
} from './self-qr.types';

export interface PersistEventInput {
  deviceId: string;
  deviceInternalCode: string;
  provider: ProviderCode;
  externalMessageId: string;
  dedupHash: string;
  customerPhone: string | null;
  customerLid: string | null;
  identityStatus: 'RESOLVED_PHONE' | 'RESOLVED_LID' | 'UNRESOLVED_LID' | 'INTERNAL_DEVICE';
  remoteJid: string;
  remoteJidAlt: string | null;
  fromMe: boolean;
  direction: 'INBOUND' | 'OUTBOUND';
  whatsappTimestamp: Date;
  receivedAt: Date;
  persistedAt: Date;
  messageType: string;
  text: string | null;
  source: EventSourceCode;
  rawPayloadHash: string;
  timestampStatus: 'OK' | 'SUSPECT' | 'MISSING';
}

export interface PersistEventResult {
  outcome: 'inserted' | 'duplicate_skipped' | 'updated';
  eventId: string | null;
  duplicateSuppressed: boolean;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async persistEvent(input: PersistEventInput): Promise<PersistEventResult> {
    const existing = await this.prisma.selfQrNormalizedEvent.findUnique({
      where: {
        device_msg_unique: {
          deviceId: input.deviceId,
          externalMessageId: input.externalMessageId,
        },
      },
      select: { id: true },
    });
    if (existing) {
      return { outcome: 'duplicate_skipped', eventId: existing.id, duplicateSuppressed: true };
    }
    try {
      const row = await this.prisma.selfQrNormalizedEvent.create({
        data: {
          deviceId: input.deviceId,
          externalMessageId: input.externalMessageId,
          dedupHash: input.dedupHash,
          provider: input.provider,
          customerPhone: input.customerPhone,
          customerLid: input.customerLid,
          identityStatus: input.identityStatus,
          remoteJid: input.remoteJid,
          remoteJidAlt: input.remoteJidAlt,
          fromMe: input.fromMe,
          direction: input.direction,
          whatsappTimestamp: input.whatsappTimestamp,
          receivedAt: input.receivedAt,
          persistedAt: input.persistedAt,
          messageType: input.messageType,
          textBody: input.text,
          source: input.source,
          rawPayloadHash: input.rawPayloadHash,
          timestampStatus: input.timestampStatus,
        },
        select: { id: true },
      });
      // Fire-and-forget: notify the LeadCapture validation pipeline. Failures
      // here must NOT poison the persist — we only log them. The listener
      // is idempotent and re-runs are safe.
      void this.emitToLeadValidator(row.id, input).catch((err: any) =>
        this.logger.warn(`🪪 lead-validator emit failed: ${err?.message ?? err}`),
      );
      void this.maybeForwardToDreamlab(input).catch((err: any) =>
        this.logger.warn(`🪪 dreamlab forward failed: ${err?.message ?? err}`),
      );
      return { outcome: 'inserted', eventId: row.id, duplicateSuppressed: false };
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'P2002') {
        return { outcome: 'duplicate_skipped', eventId: null, duplicateSuppressed: true };
      }
      this.logger.error(
        `🪪 staging persist failed deviceId=${input.deviceId} extId=${maskTail(input.externalMessageId)} err=${err?.message ?? 'unknown'}`,
      );
      throw err;
    }
  }

  async openHistoryRun(deviceId: string, kind: string, fromIso: Date | null, toIso: Date | null): Promise<string> {
    const row = await this.prisma.selfQrHistoryRun.create({
      data: { deviceId, kind, requestedFrom: fromIso, requestedTo: toIso },
      select: { id: true },
    });
    return row.id;
  }

  async closeHistoryRun(runId: string, finishedAt: Date, outcome: string, messagesCollected: number, duplicatesSkipped: number): Promise<void> {
    await this.prisma.selfQrHistoryRun.update({
      where: { id: runId },
      data: { finishedAt, outcome, messagesCollected, duplicatesSkipped },
    });
  }

  /**
   * Build the lead-validation payload and emit. Looks up the device row
   * to attach `salesIdentity` (the Self QR side of the routing check).
   * Never throws — failures are logged inside the caller.
   */
  private async emitToLeadValidator(
    eventId: string,
    input: PersistEventInput,
  ): Promise<void> {
    const device = await this.prisma.selfQrDevice.findUnique({
      where: { id: input.deviceId },
      select: { internalCode: true, salesIdentity: true },
    });
    const payload: SelfQrEventPersistedPayload = {
      eventId,
      deviceId: input.deviceId,
      deviceInternalCode: device?.internalCode ?? input.deviceInternalCode,
      deviceSalesIdentity: device?.salesIdentity ?? null,
      direction: input.direction,
      customerPhone: input.customerPhone,
      customerLid: input.customerLid,
      identityStatus: input.identityStatus,
      text: input.text,
      whatsappTimestamp: input.whatsappTimestamp.toISOString(),
      source: input.source,
    };
    this.eventEmitter.emit(LEAD_VALIDATION_EVENTS.SELF_QR_EVENT_PERSISTED, payload);
  }

  private async maybeForwardToDreamlab(input: PersistEventInput): Promise<void> {
    if (input.direction !== 'INBOUND' || !input.text) return;
    const trackingMatch = input.text.match(/\[Kode:\s*([A-Za-z0-9_-]+)\]/i);
    const trackingCode = trackingMatch ? trackingMatch[1] : null;
    if (!trackingCode) return;

    let destinationPhone: string | null = null;
    try {
      const dev = await this.prisma.selfQrDevice.findUnique({
        where: { id: input.deviceId },
        select: { normalizedPhone: true },
      });
      destinationPhone = dev?.normalizedPhone ?? null;
    } catch {
      /* swallow */
    }

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    try {
      const res = await fetch('https://dreamlab.id/api/lead-capture/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-from': 'nexerp-self-qr',
        },
        body: JSON.stringify({
          trackingCode,
          phone: input.customerPhone,
          waName: input.customerPhone ? `WA ${input.customerPhone}` : 'WhatsApp Lead',
          waMessage: input.text,
          destinationPhone,
          phoneNumberId: null,
          wamid: input.externalMessageId,
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        this.logger.warn(
          `⚠️ dreamlab.id returned ${res.status} ${res.statusText}: ${bodyText.slice(0, 200)}`,
        );
      } else {
        this.logger.log(`✅ Forwarded self-qr lead ${trackingCode} to dreamlab.id`);
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ dreamlab.id forward error: ${err?.message ?? err}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

function maskTail(s: string): string {
  if (!s) return '';
  if (s.length <= 8) return '****';
  return s.slice(0, 4) + '…' + s.slice(-4);
}

export function toNormalizedEvent(row: any): NormalizedWhatsAppEvent {
  return {
    id: row.id,
    deviceId: row.deviceId,
    deviceInternalCode: row.device?.internalCode ?? '',
    provider: row.provider as ProviderCode,
    externalMessageId: row.externalMessageId,
    dedupHash: row.dedupHash,
    customerPhone: row.customerPhone,
    customerLid: row.customerLid,
    identityStatus: row.identityStatus,
    remoteJid: row.remoteJid,
    remoteJidAlt: row.remoteJidAlt,
    fromMe: row.fromMe,
    direction: row.direction,
    whatsappTimestamp: row.whatsappTimestamp,
    receivedAt: row.receivedAt,
    persistedAt: row.persistedAt,
    messageType: row.messageType,
    text: row.textBody,
    source: row.source,
    rawPayloadHash: row.rawPayloadHash ?? '',
    timestampStatus: row.timestampStatus,
  };
}
