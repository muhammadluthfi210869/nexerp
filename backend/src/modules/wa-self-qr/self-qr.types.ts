/**
 * self-qr.types.ts — NEX ERP Batch 1.
 *
 * Provider-independent internal contract for Self-Hosted WhatsApp QR Collector.
 * The Baileys socket is bound by `CollectorService`. Public callers see only
 * NormalizedWhatsAppEvent v1 and a narrow StatusSnapshot.
 */

export type DeviceStatusCode =
  | 'UNPAIRED'
  | 'CONNECTING'
  | 'PAIRING_CODE_READY'
  | 'PAIRING'
  | 'CONNECTED'
  | 'SYNCING_HISTORY'
  | 'READY'
  | 'RECONNECTING'
  | 'LOGGED_OUT'
  | 'ERROR'
  | 'SUSPENDED';

export type EventSourceCode = 'HISTORY' | 'REALTIME' | 'CATCHUP' | 'EXPORT';

export type IdentityStatusCode =
  | 'RESOLVED_PHONE'
  | 'RESOLVED_LID'
  | 'UNRESOLVED_LID'
  | 'INTERNAL_DEVICE';

export type DirectionCode = 'INBOUND' | 'OUTBOUND';

export type TimestampStatusCode = 'OK' | 'SUSPECT' | 'MISSING';

export type MessageTypeCode =
  | 'text'
  | 'image'
  | 'video'
  | 'sticker'
  | 'audio'
  | 'document'
  | 'unknown';

export type ProviderCode = 'baileys' | 'whatsapp-webjs';

export interface NormalizedWhatsAppEvent {
  id: string;
  deviceId: string;
  deviceInternalCode: string;
  provider: ProviderCode;
  externalMessageId: string;
  dedupHash: string;
  customerPhone: string | null;
  customerLid: string | null;
  identityStatus: IdentityStatusCode;
  remoteJid: string;
  remoteJidAlt: string | null;
  fromMe: boolean;
  direction: DirectionCode;
  whatsappTimestamp: Date;
  receivedAt: Date;
  persistedAt: Date;
  messageType: MessageTypeCode;
  text: string | null;
  source: EventSourceCode;
  rawPayloadHash: string;
  timestampStatus: TimestampStatusCode;
}

export interface DeviceStatusSnapshot {
  deviceId: string;
  internalCode: string;
  displayName: string;
  normalizedPhone: string;
  phoneLast4: string;
  status: DeviceStatusCode;
  lastError: string | null;
  pairedAt: Date | null;
  lastReadyAt: Date | null;
}

export interface QrPairingSnapshot {
  qr: string;
  expiresInSeconds: number;
  generatedAt: Date;
}

export interface HistoryCoverage {
  deviceId: string;
  internalCode: string;
  requestedFrom: string | null;
  requestedTo: string | null;
  oldestFound: string | null;
  newestFound: string | null;
  oneToOneConversationCount: number;
  messageCount: number;
  inboundCount: number;
  outboundCount: number;
  unresolvedIdentityCount: number;
  unresolvedIdentityRate: number;
  duplicateSuppressedCount: number;
  historySyncRunCount: number;
  knownGaps: string[];
  excludedConversationTypes: string[];
  coverageStatus: 'VERIFIED' | 'LIKELY_COMPLETE' | 'PARTIAL' | 'UNKNOWN';
}
