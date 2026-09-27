import { Logger } from '@nestjs/common';

/**
 * Report a write that is allowed to fail, instead of swallowing it.
 *
 * Twelve call sites in `modules/scm/services/` were written as
 *
 *   try { await tx.auditLog.create({ ... }); } catch {}
 *
 * The *decision* behind that is sound and is kept: a failed audit row must not
 * roll back the business transaction, and a failed mirror write must not roll
 * back the authoritative one. What was not sound is that the failure left no
 * trace anywhere — no log, no counter, nothing. An audit trail that is missing a
 * row in silence is worse than one that is missing it loudly, because the claim
 * "every mutation is audited" is then unverifiable from inside the system.
 *
 * `AuditLogInterceptor` already makes this call correctly — `logger.warn`, no
 * rethrow (see `platform/audit/audit.interceptor.ts`). This helper brings the
 * older sites in line with it rather than inventing a second convention.
 *
 * Deliberately NOT a rethrow: failing the business transaction because the audit
 * insert failed would let a hiccup in one table block the operation it was
 * supposed to record. Loudly degraded beats silently absent, and both beat
 * refusing to work.
 *
 * `label` should name the entity and the action the way the audit row does
 * (`audit:APPayment:REVERSE`, `invoice-mirror:bill-create`), so a grep for the
 * label finds the intent and a grep for the audit `action` finds the row.
 */
export function logBestEffort(logger: Logger, label: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  logger.warn(`Best-effort write failed (${label}): ${message}`);
}
