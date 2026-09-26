/**
 * collector.service.ts — NEX ERP Batch 1.
 *
 * Self-Hosted WhatsApp QR Collector. Transport is whatsapp-web.js
 * (Puppeteer + LocalAuth). Public surface is read-only.
 *
 * Identity rules, dedup, message-classifier, internal-device-protection,
 * phone-normalizer, timestamp semantics — all unchanged from the prior
 * Baileys implementation. The transport adapter (`adaptMessage`) emits
 * a Baileys-like envelope shape (`envelope.key.*`,
 * `envelope.messageTimestamp`, `envelope.message`) so downstream
 * ingestion stays unmodified.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { Message as WwebMessage } from 'whatsapp-web.js';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { StorageService, PersistEventInput } from './storage.service';
import { resolveIdentity, isExcludedJid } from './identity-resolver';
import { composeDedupHash, composeExternalMessageId } from './dedup-key';
import { classifyMessage } from './message-classifier';
import { normalizeIdPhone, phoneLast4 } from './phone-normalizer';
import { WhatsappWebJsTransport } from './whatsapp-webjs-transport';
import type {
  DeviceStatusCode,
  DeviceStatusSnapshot,
  EventSourceCode,
  QrPairingSnapshot,
  TimestampStatusCode,
} from './self-qr.types';

// TECHNICAL_PILOT_PHONE = 6289531681278 (controlled tester).
// 62881023221414 (Luthfi Sales) is NOT currently paired — Luthfi
// BusDev history is NOT validated by these gates.
const PILOT_DEVICES: ReadonlyArray<{
  internalCode: string;
  displayName: string;
  rawPhone: string;
}> = [
  { internalCode: 'TESTER-1', displayName: 'Tester', rawPhone: '6289531681278' },
];

const EXPECTED_PILOT_WID = '6289531681278@c.us';

const CHROME_PATH =
  process.env.CHROME_EXECUTABLE_PATH ||
  (process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : '/usr/bin/chromium-browser');

@Injectable()
export class CollectorService implements OnModuleInit {
  private readonly logger = new Logger(CollectorService.name);
  /// Live wweb transport. Held only inside this service. NEVER returned.
  private transport: WhatsappWebJsTransport | null = null;
  private deviceRowId: string | null = null;
  private internalCode: string | null = null;
  private currentQr: { qr: string; expiresAt: number; generatedAt: Date; qrPngPath: string | null } | null = null;
  private status: DeviceStatusCode = 'UNPAIRED';
  private lastError: string | null = null;
  private pairedAt: Date | null = null;
  private lastReadyAt: Date | null = null;
  private readonly authRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {
    this.authRoot = process.env.SELF_QR_AUTH_ROOT
      ? path.resolve(process.env.SELF_QR_AUTH_ROOT)
      : path.resolve(process.cwd(), 'storage', 'self-qr-auth');
    fs.mkdirSync(this.authRoot, { recursive: true });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.bootstrapPilotDevice();
    } catch (err: any) {
      this.lastError = err?.message ?? 'unknown';
      this.status = 'ERROR';
      this.logger.warn(`🪪 collector bootstrap failed (non-fatal): ${this.lastError}`);
    }
  }

  async getStatus(): Promise<DeviceStatusSnapshot | null> {
    if (!this.deviceRowId) return null;
    const row = await this.prisma.selfQrDevice.findUnique({ where: { id: this.deviceRowId } });
    if (!row) return null;
    return {
      deviceId: row.id,
      internalCode: row.internalCode,
      displayName: row.displayName,
      normalizedPhone: row.normalizedPhone,
      phoneLast4: row.phoneLast4 ?? '',
      status: row.status as DeviceStatusCode,
      lastError: this.lastError,
      pairedAt: row.pairedAt,
      lastReadyAt: row.lastReadyAt,
    };
  }

  getCurrentQr(): QrPairingSnapshot | null {
    if (!this.currentQr) return null;
    const remainingMs = this.currentQr.expiresAt - Date.now();
    if (remainingMs <= 0) return null;
    return {
      qr: this.currentQr.qr,
      expiresInSeconds: Math.floor(remainingMs / 1000),
      generatedAt: this.currentQr.generatedAt,
    };
  }

  /// Returns the absolute path of the saved QR PNG (or null if none).
  getCurrentQrPngPath(): string | null {
    if (!this.currentQr) return null;
    const remainingMs = this.currentQr.expiresAt - Date.now();
    if (remainingMs <= 0) return null;
    return this.currentQr.qrPngPath;
  }

  async triggerHistorySync(opts: {
    requestedFrom: Date;
    requestedTo: Date;
  }): Promise<string> {
    if (!this.deviceRowId) throw new Error('device not bootstrapped');
    if (!this.transport) throw new Error('transport not bootstrapped');
    if (this.status !== 'READY' && this.status !== 'SYNCING_HISTORY' && this.status !== 'CONNECTED') {
      throw new Error(`history sync refused: device status=${this.status}`);
    }
    const deviceId = this.deviceRowId;
    const runId = await this.storage.openHistoryRun(deviceId, 'HISTORY', opts.requestedFrom, opts.requestedTo);
    this.status = 'SYNCING_HISTORY';
    let collected = 0;
    let duplicates = 0;
    let failedChats = 0;
    try {
      // Cutoff = pairedAt (Self QR initial pairing time, epoch SECONDS).
      // Only messages with whatsappTimestamp < pairedAt are admitted as
      // HISTORY. Anything with timestamp >= pairedAt could also have been
      // delivered via message_create during the realtime window — admitting
      // it would risk REALTIME_EVENT_MISCLASSIFIED_AS_HISTORY > 0, so we
      // strictly filter on the cutoff. Falls back to requestedFrom if
      // pairedAt is null (e.g. operator forced sync before READY).
      const cutoffEpochSeconds = this.pairedAt
        ? Math.floor(this.pairedAt.getTime() / 1000)
        : Math.floor(opts.requestedFrom.getTime() / 1000);
      const stats = await this.runHistorySync(cutoffEpochSeconds);
      collected = stats.collected;
      duplicates = stats.duplicates;
      failedChats = stats.failedChats;
      await this.storage.closeHistoryRun(runId, new Date(), 'completed', collected, duplicates);
      this.lastReadyAt = new Date();
      this.status = 'READY';
      if (failedChats > 0) {
        this.logger.warn(`🪪 history sync: ${failedChats} chat(s) failed fetchMessages`);
      }
    } catch (err: any) {
      await this.storage.closeHistoryRun(runId, new Date(), 'failed: ' + (err?.message ?? 'unknown'), collected, duplicates);
      this.status = 'ERROR';
      throw err;
    }
    return runId;
  }

  async getCoverage() {
    if (!this.deviceRowId) {
      return {
        deviceId: 'unset',
        messageCount: 0,
        oneToOneConversationCount: 0,
        inboundCount: 0,
        outboundCount: 0,
        unresolvedIdentityCount: 0,
        oldestFound: null as Date | null,
        newestFound: null as Date | null,
        duplicateSuppressedCount: 0,
        historySyncRunCount: 0,
      };
    }
    const deviceId = this.deviceRowId;
    const [totals, runs, oldestNewest, distinctRemotes, dupCount] = await Promise.all([
      this.prisma.selfQrNormalizedEvent.groupBy({
        by: ['direction'],
        where: { deviceId },
        _count: { _all: true },
      }),
      this.prisma.selfQrHistoryRun.findMany({ where: { deviceId, kind: 'HISTORY' }, select: { id: true } }),
      this.prisma.selfQrNormalizedEvent.aggregate({
        where: { deviceId },
        _min: { whatsappTimestamp: true },
        _max: { whatsappTimestamp: true },
      }),
      this.prisma.selfQrNormalizedEvent.findMany({ where: { deviceId }, select: { remoteJid: true }, distinct: ['remoteJid'] }),
      this.prisma.selfQrHistoryRun.aggregate({ where: { deviceId }, _sum: { duplicatesSkipped: true } }),
    ]);
    const inboundCount = (totals.find((t: any) => t.direction === 'INBOUND') as any)?._count?._all ?? 0;
    const outboundCount = (totals.find((t: any) => t.direction === 'OUTBOUND') as any)?._count?._all ?? 0;
    const messageCount = inboundCount + outboundCount;
    return {
      deviceId,
      messageCount,
      oneToOneConversationCount: distinctRemotes.length,
      inboundCount,
      outboundCount,
      unresolvedIdentityCount: await this.prisma.selfQrNormalizedEvent.count({
        where: { deviceId, identityStatus: 'UNRESOLVED_LID' },
      }),
      oldestFound: oldestNewest._min.whatsappTimestamp,
      newestFound: oldestNewest._max.whatsappTimestamp,
      duplicateSuppressedCount: dupCount._sum.duplicatesSkipped ?? 0,
      historySyncRunCount: runs.length,
    };
  }

  private async bootstrapPilotDevice(): Promise<void> {
    const pilot = PILOT_DEVICES[0];
    const normalizedPhone = normalizeIdPhone(pilot.rawPhone);
    if (!normalizedPhone) throw new Error(`pilot phone cannot be normalized: ${pilot.rawPhone}`);

    const existing = await this.prisma.selfQrDevice.findUnique({
      where: { internalCode: pilot.internalCode },
    });
    const deviceRow = existing
      ? existing
      : await this.prisma.selfQrDevice.create({
          data: {
            internalCode: pilot.internalCode,
            displayName: pilot.displayName,
            normalizedPhone,
            phoneLast4: phoneLast4(normalizedPhone),
            provider: 'whatsapp-webjs',
            authStatePath: path.join(this.authRoot, pilot.internalCode),
            status: 'UNPAIRED',
          },
        });
    this.deviceRowId = deviceRow.id;
    this.internalCode = deviceRow.internalCode;
    await this.ensureAuthFolder(deviceRow.authStatePath!);
    await this.startTransport();
  }

  private async ensureAuthFolder(folder: string) {
    fs.mkdirSync(folder, { recursive: true });
  }

  private async startTransport(): Promise<void> {
    if (!this.deviceRowId || !this.internalCode) throw new Error('startTransport: device metadata missing');
    const authDir = path.join(this.authRoot, this.internalCode);
    await this.ensureAuthFolder(authDir);
    const qrPngPath = path.join(authDir, 'qr.png');

    const transport = new WhatsappWebJsTransport({
      authDir,
      clientId: 'luthfi-pilot',
      chromePath: CHROME_PATH,
      qrOutPath: qrPngPath,
    });
    this.transport = transport;

    transport.on('qr', (payload: { qr: string; qrPngPath: string }) => {
      // QR is captured internally only. NEVER surfaced to operator HTTP.
      this.currentQr = {
        qr: payload.qr,
        expiresAt: Date.now() + 120_000,
        generatedAt: new Date(),
        qrPngPath: payload.qrPngPath,
      };
      this.status = 'CONNECTING';
      this.logger.log(`🪪 QR written to ${payload.qrPngPath} — scan with WhatsApp Business ${this.internalCode}`);
      void this.persistStatus();
    });

    transport.on('authenticated', () => {
      this.status = 'PAIRING';
      void this.persistStatus();
    });

    transport.on('ready', () => {
      const wid = transport.getAuthenticatedWid();
      this.logger.log(`🪪 wweb ready wid=${wid ?? 'unknown'}`);
      // Hard gate: SESSION_IDENTITY must equal expected pilot WID.
      if (wid !== EXPECTED_PILOT_WID) {
        this.lastError = `SESSION_IDENTITY_MISMATCH expected=${EXPECTED_PILOT_WID} got=${wid ?? 'null'}`;
        this.status = 'ERROR';
        this.logger.error(`🪪 ${this.lastError} — STOP.`);
        void this.persistStatus();
        return;
      }
      this.pairedAt = new Date();
      this.currentQr = null;
      this.status = 'READY';
      this.lastReadyAt = new Date();
      void this.persistStatus();
    });

    transport.on('disconnected', (info: { reason: string }) => {
      this.lastError = info.reason ?? 'disconnected';
      this.status = info.reason === 'auth_failure' ? 'LOGGED_OUT' : 'RECONNECTING';
      void this.persistStatus();
    });

    transport.on('message', (msg: WwebMessage) => {
      void this.handleRealtimeMessage(msg).catch((err: any) => {
        this.lastError = err?.message ?? 'message ingest error';
      });
    });

    // initialize() resolves on auth_failure / disconnected. We do NOT await
    // its final resolution — events drive state.
    void transport.start().catch((err: any) => {
      this.lastError = err?.message ?? 'transport.initialize error';
      this.status = 'ERROR';
      this.logger.error(`🪪 transport.start failed: ${this.lastError}`);
      void this.persistStatus();
    });
  }

  private async handleRealtimeMessage(msg: WwebMessage): Promise<void> {
    const envelope = adaptWwebMessage(msg);
    await this.ingestMessage(envelope, 'REALTIME');
  }

  private async runHistorySync(cutoffEpochSeconds: number): Promise<{
    collected: number;
    duplicates: number;
    failedChats: number;
  }> {
    if (!this.transport) throw new Error('transport not bootstrapped');
    const chats = await this.transport.getChats();
    let collected = 0;
    let duplicates = 0;
    let failedChats = 0;
    for (const chat of chats) {
      let msgs: WwebMessage[] = [];
      try {
        // Limit 500 reaches back further than the chat's in-memory window
        // via loadEarlierMsgs pagination. The actual cutoff gate is
        // m.timestamp < cutoffEpochSeconds — limit just controls depth.
        msgs = await chat.fetchMessages({ limit: 500 });
      } catch {
        failedChats++;
        continue;
      }
      for (const m of msgs) {
        if (!m.timestamp || m.timestamp >= cutoffEpochSeconds) continue;
        const envelope = adaptWwebMessage(m);
        const r = await this.ingestMessage(envelope, 'HISTORY');
        if (r?.outcome === 'inserted') collected++;
        else if (r?.outcome === 'duplicate_skipped') duplicates++;
      }
    }
    return { collected, duplicates, failedChats };
  }

  /// Ingests a wweb-adapted envelope. Downstream identity rules and
  /// dedup are unchanged from the prior Baileys implementation.
  private async ingestMessage(
    envelope: IngestEnvelope,
    source: EventSourceCode,
  ): Promise<{ outcome: string } | null> {
    if (!envelope || typeof envelope !== 'object') return null;
    if (!this.deviceRowId || !this.internalCode) return null;
    const { remoteJid, remoteJidAlt, fromMe, messageTimestamp: whatsappTimestampSeconds, rawMsg } = envelope;
    if (!remoteJid) return { outcome: 'skipped_excluded' };
    if (isExcludedJid(remoteJid)) return { outcome: 'skipped_excluded' };

    const resolved = resolveIdentity({ remoteJid, remoteJidAlt });
    if (resolved.kind === 'EXCLUDED_NON_USER') return { outcome: 'skipped_excluded' };
    if (resolved.kind === 'INTERNAL_DEVICE') return { outcome: 'skipped_excluded' };

    let whatsappTimestamp: Date;
    let timestampStatus: TimestampStatusCode;
    if (whatsappTimestampSeconds === null || !Number.isFinite(whatsappTimestampSeconds)) {
      whatsappTimestamp = new Date(0);
      timestampStatus = 'MISSING';
    } else {
      whatsappTimestamp = new Date(whatsappTimestampSeconds * 1000);
      const y = whatsappTimestamp.getUTCFullYear();
      timestampStatus = y >= 2015 && y <= 2100 ? 'OK' : 'SUSPECT';
    }

    const messageId = typeof envelope.messageId === 'string' ? envelope.messageId : null;
    const externalMessageId = composeExternalMessageId({
      deviceInternalCode: this.internalCode,
      rawMessageKey: messageId,
      fallbackFrom: { remoteJid, fromMe, whatsappTimestampSeconds: whatsappTimestampSeconds ?? null },
    });
    const dedupHash = composeDedupHash({
      deviceInternalCode: this.internalCode,
      rawMessageKey: messageId,
      fallbackFrom: { remoteJid, fromMe, whatsappTimestampSeconds: whatsappTimestampSeconds ?? null },
    });

    // classifyMessage reads Baileys-like envelope.message.conversation etc.
    // We construct a synthetic Baileys message shape from the wweb raw payload.
    const syntheticBaileysMsg: any = {
      key: { remoteJid, remoteJidAlt, fromMe, id: messageId },
      messageTimestamp: whatsappTimestampSeconds,
      message: rawMsg ?? undefined,
    };
    const classification = classifyMessage(syntheticBaileysMsg);
    const direction: 'INBOUND' | 'OUTBOUND' = fromMe ? 'OUTBOUND' : 'INBOUND';
    const receivedAt = new Date();
    const rawPayloadHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        k: { remoteJid, fromMe, id: messageId },
        ts: whatsappTimestampSeconds,
        m: rawMsg ? Object.keys(rawMsg) : null,
      }))
      .digest('hex');

    const input: PersistEventInput = {
      deviceId: this.deviceRowId,
      deviceInternalCode: this.internalCode,
      provider: 'whatsapp-webjs',
      externalMessageId,
      dedupHash,
      customerPhone: resolved.customerPhone,
      customerLid: resolved.customerLid,
      identityStatus: resolved.kind as 'RESOLVED_PHONE' | 'RESOLVED_LID' | 'UNRESOLVED_LID' | 'INTERNAL_DEVICE',
      remoteJid,
      remoteJidAlt,
      fromMe,
      direction,
      whatsappTimestamp,
      receivedAt,
      persistedAt: new Date(),
      messageType: classification.messageType,
      text: classification.text,
      source,
      rawPayloadHash,
      timestampStatus,
    };
    const result = await this.storage.persistEvent(input);
    return { outcome: result.outcome === 'inserted' ? 'inserted' : 'duplicate_skipped' };
  }

  private async persistStatus(): Promise<void> {
    if (!this.deviceRowId) return;
    await this.prisma.selfQrDevice.update({
      where: { id: this.deviceRowId },
      data: {
        status: this.status,
        pairedAt: this.pairedAt,
        lastReadyAt: this.lastReadyAt,
        disconnectedAt: this.status === 'LOGGED_OUT' || this.status === 'ERROR' ? new Date() : null,
      },
    });
  }
}

/// Ingest envelope shape — kept module-local to avoid leaking wweb types
/// into storage.service.ts or downstream.
interface IngestEnvelope {
  remoteJid: string;
  remoteJidAlt: string | null;
  fromMe: boolean;
  messageTimestamp: number | null;
  messageId: string | null;
  rawMsg: Record<string, unknown> | null;
}

/// Adapts a whatsapp-web.js Message to the IngestEnvelope shape consumed
/// by the existing identity-resolver / message-classifier pipeline.
function adaptWwebMessage(m: WwebMessage): IngestEnvelope {
  // wweb exposes m.from (the OTHER party — sender for inbound, self for outbound),
  // m.to (self for inbound, recipient for outbound), m.fromMe, m.timestamp
  // (epoch seconds), m.id (MsgKey with _serialized OR $1 after PR #201850).
  // For OUTBOUND messages we swap so remoteJid always points to the remote party.
  const fromAny = m.from as any;
  const toAny = m.to as any;
  const idAny = m.id as any;
  const fromJid =
    (typeof fromAny === 'string' ? fromAny : fromAny?._serialized ?? fromAny?.$1) ?? null;
  const toJid =
    (typeof toAny === 'string' ? toAny : toAny?._serialized ?? toAny?.$1) ?? null;
  const fromMe = !!m.fromMe;
  // remoteJid must always point to the OTHER party (the customer / recipient),
  // never to self. For INBOUND: m.from=other. For OUTBOUND: m.to=other.
  const remoteJid = fromMe
    ? (toJid ?? fromJid ?? '')
    : (fromJid ?? toJid ?? '');
  const selfJid = fromMe ? fromJid : toJid;
  const remoteJidAlt = selfJid && selfJid !== remoteJid ? selfJid : null;
  const messageId = idAny?._serialized ?? idAny?.$1 ?? (typeof idAny === 'string' ? idAny : null);

  // Synthesize a Baileys-like `message` object from wweb's body/type so the
  // existing classifier can read it unchanged. Non-text types fall through.
  const wwebType = (m as any).type as string | undefined;
  let rawMsg: Record<string, unknown> | null = null;
  if (typeof (m as any).body === 'string' && (m as any).body.length > 0) {
    if (wwebType === 'chat' || wwebType === 'string' || wwebType === undefined) {
      rawMsg = { conversation: (m as any).body };
    } else {
      rawMsg = { [`${wwebType}Message`]: { caption: (m as any).body } };
    }
  } else if (wwebType === 'image') {
    rawMsg = { imageMessage: { caption: null } };
  } else if (wwebType === 'video') {
    rawMsg = { videoMessage: { caption: null } };
  } else if (wwebType === 'ptt' || wwebType === 'audio') {
    rawMsg = { audioMessage: {} };
  } else if (wwebType === 'document') {
    rawMsg = { documentMessage: { caption: null } };
  } else if (wwebType === 'sticker') {
    rawMsg = { stickerMessage: {} };
  }

  return {
    remoteJid: typeof remoteJid === 'string' ? remoteJid : String(remoteJid ?? ''),
    remoteJidAlt,
    fromMe: !!m.fromMe,
    messageTimestamp: typeof m.timestamp === 'number' ? m.timestamp : null,
    messageId: messageId ? String(messageId) : null,
    rawMsg,
  };
}