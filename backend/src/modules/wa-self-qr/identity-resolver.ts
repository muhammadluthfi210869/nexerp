/**
 * identity-resolver.ts — NEX ERP Batch 1.
 *
 * Deterministic identity resolution from a remote JID. NEVER guesses a phone.
 *
 *   INTERNAL_DEVICE     → known Sales phone, blocked from customer
 *   RESOLVED_PHONE      → PN phone provable from envelope
 *   RESOLVED_LID        → LID present, no PN
 *   UNRESOLVED_LID      → identifier present but no PN
 *   EXCLUDED_NON_USER   → group / newsletter / status / bot / broadcast
 */

import { extractCustomerPhoneFromJid } from './phone-normalizer';
import { isInternalDevice } from './internal-device-protection';

export type ResolvedIdentityKind =
  | 'INTERNAL_DEVICE'
  | 'RESOLVED_PHONE'
  | 'RESOLVED_LID'
  | 'UNRESOLVED_LID'
  | 'EXCLUDED_NON_USER';

export interface ResolvedIdentity {
  kind: ResolvedIdentityKind;
  customerPhone: string | null;
  customerLid: string | null;
  remoteJid: string;
  remoteJidAlt: string | null;
  identityNotes: string[];
}

export function classifyJid(jid: string | null | undefined): {
  isGroup: boolean;
  isStatus: boolean;
  isNewsletter: boolean;
  isBroadcast: boolean;
  isLid: boolean;
  isPnUser: boolean;
  isBot: boolean;
} {
  const out = {
    isGroup: false,
    isStatus: false,
    isNewsletter: false,
    isBroadcast: false,
    isLid: false,
    isPnUser: false,
    isBot: false,
  };
  if (typeof jid !== 'string') return out;
  const s = jid.trim();
  if (s.length === 0) return out;
  if (s.endsWith('@g.us')) out.isGroup = true;
  if (s.endsWith('@status') || s.endsWith('@status.broadcast')) out.isStatus = true;
  if (s.endsWith('@newsletter')) out.isNewsletter = true;
  if (s.endsWith('@broadcast')) out.isBroadcast = true;
  if (s.endsWith('@lid')) out.isLid = true;
  if (s.endsWith('@s.whatsapp.net')) out.isPnUser = true;
  if (s.endsWith('@bot')) out.isBot = true;
  return out;
}

export function isExcludedJid(jid: string | null | undefined): boolean {
  if (typeof jid !== 'string' || jid.trim().length === 0) return true;
  const c = classifyJid(jid);
  return c.isGroup || c.isStatus || c.isNewsletter || c.isBroadcast || c.isBot;
}

export function resolveIdentity(params: {
  remoteJid: string | null | undefined;
  remoteJidAlt?: string | null | undefined;
}): ResolvedIdentity {
  const remoteJid = typeof params.remoteJid === 'string' ? params.remoteJid : '';
  const remoteJidAlt =
    typeof params.remoteJidAlt === 'string' && params.remoteJidAlt.length > 0
      ? params.remoteJidAlt
      : null;

  const notes: string[] = [];

  if (!remoteJid) {
    return {
      kind: 'UNRESOLVED_LID',
      customerPhone: null,
      customerLid: null,
      remoteJid: '',
      remoteJidAlt: null,
      identityNotes: ['empty_remote_jid'],
    };
  }

  if (isExcludedJid(remoteJid)) {
    return {
      kind: 'EXCLUDED_NON_USER',
      customerPhone: null,
      customerLid: null,
      remoteJid,
      remoteJidAlt,
      identityNotes: ['excluded_non_user'],
    };
  }

  const primaryClass = classifyJid(remoteJid);
  const altClass = remoteJidAlt ? classifyJid(remoteJidAlt) : null;

  let customerPhone: string | null = null;
  let customerLid: string | null = null;

  if (primaryClass.isLid) {
    customerLid = remoteJid;
    if (altClass && altClass.isPnUser) {
      const p = extractCustomerPhoneFromJid(remoteJidAlt);
      if (p) customerPhone = p;
    }
  } else if (primaryClass.isPnUser) {
    const p = extractCustomerPhoneFromJid(remoteJid);
    if (p) customerPhone = p;
    if (altClass && altClass.isLid) customerLid = remoteJidAlt;
  } else {
    customerLid = remoteJid;
    notes.push('unknown_jid_shape');
  }

  if (customerPhone && isInternalDevice(customerPhone)) {
    return {
      kind: 'INTERNAL_DEVICE',
      customerPhone: null,
      customerLid,
      remoteJid,
      remoteJidAlt,
      identityNotes: [...notes, 'internal_device_phone'],
    };
  }

  let kind: ResolvedIdentityKind;
  if (customerPhone) kind = 'RESOLVED_PHONE';
  else if (customerLid) kind = primaryClass.isLid ? 'RESOLVED_LID' : 'UNRESOLVED_LID';
  else kind = 'UNRESOLVED_LID';

  return { kind, customerPhone, customerLid, remoteJid, remoteJidAlt, identityNotes: notes };
}
