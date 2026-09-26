/**
 * message-classifier.ts — NEX ERP Batch 1.
 */

import type { MessageTypeCode } from './self-qr.types';

export interface ClassifiedMessage {
  messageType: MessageTypeCode;
  text: string | null;
}

export function classifyMessage(envelope: any): ClassifiedMessage {
  if (!envelope || typeof envelope !== 'object') {
    return { messageType: 'unknown', text: null };
  }
  const convo = envelope?.message?.conversation;
  if (typeof convo === 'string' && convo.length > 0) {
    return { messageType: 'text', text: convo };
  }
  const ext = envelope?.message?.extendedTextMessage?.text;
  if (typeof ext === 'string' && ext.length > 0) {
    return { messageType: 'text', text: ext };
  }
  if (envelope?.message?.imageMessage) return { messageType: 'image', text: captionFrom(envelope) };
  if (envelope?.message?.videoMessage) return { messageType: 'video', text: captionFrom(envelope) };
  if (envelope?.message?.audioMessage) return { messageType: 'audio', text: null };
  if (envelope?.message?.documentMessage) return { messageType: 'document', text: captionFrom(envelope) };
  if (envelope?.message?.stickerMessage) return { messageType: 'sticker', text: null };
  return { messageType: 'unknown', text: null };
}

function captionFrom(envelope: any): string | null {
  const c =
    envelope?.message?.imageMessage?.caption ??
    envelope?.message?.videoMessage?.caption ??
    envelope?.message?.documentMessage?.caption ??
    null;
  return typeof c === 'string' && c.length > 0 ? c : null;
}
