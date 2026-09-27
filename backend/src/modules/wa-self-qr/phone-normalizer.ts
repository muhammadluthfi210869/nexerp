/**
 * phone-normalizer.ts — NEX ERP Batch 1.
 *
 * Indonesian phone canonicalization for the Self-QR staging layer.
 * Stable, pure, exported. Reuses the conservative approach from
 * `WablasSafetyService.normalizeIdPhone`.
 */

export function normalizeIdPhone(input: string | null | undefined): string | null {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  if (s.length === 0) return null;
  const beforeAt = s.split('@')[0].split(':')[0];
  const digits = beforeAt.replace(/\D+/g, '');
  if (digits.length === 0) return null;
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return null;
}

export function phoneLast4(canon: string | null): string {
  if (!canon) return '';
  return canon.slice(-4);
}

export function extractCustomerPhoneFromJid(jid: string | null | undefined): string | null {
  if (typeof jid !== 'string') return null;
  const s = jid.trim();
  if (s.length === 0) return null;
  const beforeAt = s.split('@')[0];
  return normalizeIdPhone(beforeAt);
}
