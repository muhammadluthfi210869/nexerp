/**
 * internal-device-protection.ts — NEX ERP Batch 1.
 *
 * Loads Sales-facing internal device phones from
 * `SELF_QR_INTERNAL_DEVICE_PHONES` (comma-separated), normalized to PN canonical.
 * Used to flag a candidate customer phone as INTERNAL_DEVICE (never-as-customer).
 */

import { normalizeIdPhone } from './phone-normalizer';

let _cache: Set<string> | null = null;

export function loadInternalDevicePhonesFromEnv(): Set<string> {
  if (_cache) return _cache;
  const raw = process.env.SELF_QR_INTERNAL_DEVICE_PHONES ?? '';
  const set = new Set<string>();
  for (const part of raw.split(',')) {
    const canon = normalizeIdPhone(part);
    if (canon) set.add(canon);
  }
  _cache = set;
  return set;
}

export function _resetInternalDeviceCacheForTests(): void {
  _cache = null;
}

export function isInternalDevice(canon: string | null): boolean {
  if (!canon) return false;
  const set = loadInternalDevicePhonesFromEnv();
  if (set.size === 0) return false;
  return set.has(canon);
}
