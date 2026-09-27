/**
 * lead-validation.events.ts
 *
 * Cross-module event contracts for the Self QR → LeadCapture validation
 * pipeline. The Self QR `StorageService` emits `SELF_QR_EVENT_PERSISTED`
 * AFTER it has stored a NormalizedWhatsAppEvent. The LeadCapture listener
 * reacts by binding the event to a website LeadCapture (if the message
 * carries a [Kode: DL...] tracking code) and triggering the existing
 * name/product extraction pipeline.
 */

export const LEAD_VALIDATION_EVENTS = {
  SELF_QR_EVENT_PERSISTED: 'selfqr.event.persisted',
} as const;

export interface SelfQrEventPersistedPayload {
  eventId: string;
  deviceId: string;
  deviceInternalCode: string;
  deviceSalesIdentity: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  customerPhone: string | null;
  customerLid: string | null;
  identityStatus: string;
  text: string | null;
  whatsappTimestamp: string; // ISO
  source: 'HISTORY' | 'REALTIME' | 'CATCHUP' | 'EXPORT';
}
