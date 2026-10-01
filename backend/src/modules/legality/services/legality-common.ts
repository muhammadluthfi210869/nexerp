import { LegalStatus } from '@prisma/client';

/**
 * BUS-RULE-115 — an artwork review is recorded against the artwork that exists.
 *
 * The pipeline names a lead, not a design version, so the artwork under review is
 * resolved from that lead's design task: the client-approved master when the
 * design is finalized, otherwise the version on the table. A review with no
 * artwork behind it is refused rather than written against a fabricated URL.
 */
export const ARTWORK_NOT_ON_FILE = 'ARTWORK_NOT_ON_FILE';

/** The governed artwork of a lead's design version under review. */
export interface GovernedArtwork {
  /** The master file the review is performed on. */
  artworkUrl: string | null;
  /** A rendition a browser can display (the version's mockup), when there is one. */
  previewUrl: string | null;
  /** The version that artwork belongs to. */
  version: number | null;
}

/**
 * BUS-RULE-112 — the single permit expiry policy.
 *
 * Before this, the module carried three separate computations with two different
 * thresholds (90 days in the dashboard and the permit list, 30/60 days in the
 * expiry feed) and three response vocabularies. A permit could therefore be
 * "EXPIRING_SOON" on one screen and "SAFE" on another on the same day.
 *
 * Canonical buckets: EXPIRED (<=0), CRITICAL (<=30), WARNING (<=90), SAFE, and
 * NO_EXPIRY for a record with no expiry date recorded. NO_EXPIRY is deliberately
 * distinct from SAFE: an unknown expiry is not a safe one.
 */
export const PERMIT_CRITICAL_DAYS = 30;
export const PERMIT_WARNING_DAYS = 90;

export type PermitExpiryBucket =
  | 'EXPIRED'
  | 'CRITICAL'
  | 'WARNING'
  | 'SAFE'
  | 'NO_EXPIRY';

export function permitDaysLeft(
  expiryDate: Date | string | null | undefined,
  today: Date = new Date(),
): number | null {
  if (!expiryDate) return null;
  const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return null;
  return Math.floor((expiry.getTime() - today.getTime()) / 86400000);
}

export function permitExpiryBucket(
  expiryDate: Date | string | null | undefined,
  today: Date = new Date(),
): PermitExpiryBucket {
  const daysLeft = permitDaysLeft(expiryDate, today);
  if (daysLeft === null) return 'NO_EXPIRY';
  if (daysLeft <= 0) return 'EXPIRED';
  if (daysLeft <= PERMIT_CRITICAL_DAYS) return 'CRITICAL';
  if (daysLeft <= PERMIT_WARNING_DAYS) return 'WARNING';
  return 'SAFE';
}

/**
 * Audit risk derived from the record's real state rather than asserted at insert.
 * A record with no expiry date on file is not "OK" — the audit it would rest on
 * has not happened, so it is a delayed audit.
 */
export function permitAuditRisk(
  expiryDate: Date | string | null | undefined,
  today: Date = new Date(),
): 'OK' | 'DELAY_AUDIT' | 'CRITICAL' {
  switch (permitExpiryBucket(expiryDate, today)) {
    case 'EXPIRED':
    case 'CRITICAL':
      return 'CRITICAL';
    case 'WARNING':
    case 'NO_EXPIRY':
      return 'DELAY_AUDIT';
    default:
      return 'OK';
  }
}

export function injectTimeMetrics<
  T extends { applicationDate: Date | string; expiryDate?: Date | string | null },
>(
  record: T,
  today: Date = new Date(),
): T & { daysElapsed: number; daysLeft: number | null } {
  const appDate = new Date(record.applicationDate);
  const daysElapsed = Math.floor(
    (today.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  let daysLeft: number | null = null;
  if (record.expiryDate) {
    const expDate = new Date(record.expiryDate);
    daysLeft = Math.floor(
      (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  return {
    ...record,
    daysElapsed,
    daysLeft,
  };
}
