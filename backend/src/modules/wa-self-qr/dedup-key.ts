/**
 * dedup-key.ts — NEX ERP Batch 1.
 *
 * Stable dedup hash for a Self-QR normalized event.
 * Hash input is `deviceInternalCode + rawMessageKey`. Optional fallback when
 * provider gave no stable id. Text is NEVER part of the dedup key.
 */

import * as crypto from 'crypto';

export interface DedupKeyInput {
  deviceInternalCode: string;
  rawMessageKey: string | null | undefined;
  fallbackFrom?: {
    remoteJid?: string | null;
    fromMe?: boolean | null;
    whatsappTimestampSeconds?: number | null;
  };
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function composeDedupHash(input: DedupKeyInput): string {
  const pieces: string[] = [input.deviceInternalCode];
  if (input.rawMessageKey && input.rawMessageKey.trim().length > 0) {
    pieces.push('R:' + input.rawMessageKey.trim());
    return sha256(pieces.join('|'));
  }
  const fb = input.fallbackFrom ?? {};
  const parts: string[] = ['F'];
  if (typeof fb.fromMe === 'boolean') parts.push('m=' + (fb.fromMe ? '1' : '0'));
  if (typeof fb.remoteJid === 'string' && fb.remoteJid.length > 0) parts.push('r=' + fb.remoteJid);
  if (typeof fb.whatsappTimestampSeconds === 'number' && Number.isFinite(fb.whatsappTimestampSeconds)) {
    parts.push('t=' + Math.trunc(fb.whatsappTimestampSeconds));
  }
  pieces.push(parts.join(';'));
  return sha256(pieces.join('|'));
}

export function composeExternalMessageId(input: DedupKeyInput): string {
  if (input.rawMessageKey && input.rawMessageKey.trim().length > 0) {
    return input.rawMessageKey.trim();
  }
  const fb = input.fallbackFrom ?? {};
  const parts: string[] = ['synth'];
  if (typeof fb.fromMe === 'boolean') parts.push('m=' + (fb.fromMe ? '1' : '0'));
  if (typeof fb.remoteJid === 'string' && fb.remoteJid.length > 0) parts.push('r=' + fb.remoteJid);
  if (typeof fb.whatsappTimestampSeconds === 'number' && Number.isFinite(fb.whatsappTimestampSeconds)) {
    parts.push('t=' + Math.trunc(fb.whatsappTimestampSeconds));
  }
  return parts.join(';');
}
