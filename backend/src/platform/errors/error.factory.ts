/**
 * NEX ERP - Canonical Error Factory and Filter
 *
 * NexError has { code, http, safeMessage, fieldErrors?, correlationId }.
 * The scrubber strips forbidden substrings (SQL, JWT, email, phone, NIK, cookies,
 * authorization, passwordHash) from any message before it leaves the process.
 */

import { randomUUID } from 'crypto';

export interface NexErrorOptions {
  http: number;
  safeMessage: string;
  fieldErrors?: Record<string, string>;
}

export class NexError extends Error {
  code: string;
  http: number;
  safeMessage: string;
  fieldErrors?: Record<string, string>;
  correlationId: string;
  constructor(code: string, opts: NexErrorOptions, correlationId?: string) {
    super(opts.safeMessage);
    this.name = 'NexError';
    this.code = code;
    this.http = opts.http;
    this.safeMessage = opts.safeMessage;
    this.fieldErrors = opts.fieldErrors;
    this.correlationId = correlationId || randomUUID();
  }
  static from(_gateId: string, reasonCode: string, message: string, details?: { http?: number; fieldErrors?: Record<string, string> }): NexError {
    return new NexError(reasonCode, {
      http: details?.http || 400,
      safeMessage: scrub(message),
      fieldErrors: details?.fieldErrors
    });
  }
}

const FORBIDDEN_PATTERNS: Array<{ re: RegExp; repl: string }> = [
  { re: /\b(SELECT|INSERT|UPDATE|DELETE|ALTER|DROP)\b/gi, repl: '[REDACTED_SQL]' },
  { re: /eyJ[A-Za-z0-9_-]+\./g, repl: '[REDACTED_JWT]' },
  { re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, repl: '[REDACTED_EMAIL]' },
  { re: /(?<![\d])\+?6?2?0?[\d\s-]{9,15}\d(?![\d-])/g, repl: '[REDACTED_PHONE]' },
  { re: /(?<![\d])\d{16}(?![\d])/g, repl: '[REDACTED_NIK]' },
  { re: /passwordHash\s*[:=]\s*['"][^'"]{4,}['"]/gi, repl: 'passwordHash=[REDACTED]' },
  { re: /set-cookie:\s*[^\s;,]+/gi, repl: 'set-cookie: [REDACTED]' },
  { re: /authorization:\s*[^\s;,]+/gi, repl: 'authorization: [REDACTED]' },
  { re: /Bearer\s+[A-Za-z0-9._-]{16,}/g, repl: 'Bearer [REDACTED]' }
];

export function scrub(input: string): string {
  if (typeof input !== 'string' || !input) return input || '';
  let out = input;
  for (const { re, repl } of FORBIDDEN_PATTERNS) out = out.replace(re, repl);
  return out;
}

const registry: Record<string, NexErrorOptions> = {};

export function registerError(code: string, opts: NexErrorOptions) {
  registry[code] = opts;
}

export function getRegistered(code: string): NexErrorOptions | undefined {
  return registry[code];
}

// Canonical P05 error codes
registerError('AUTH_INVALID_CREDENTIALS', { http: 401, safeMessage: 'Invalid credentials' });
registerError('AUTH_REFRESH_REPLAY', { http: 401, safeMessage: 'Refresh token replay detected' });
registerError('AUTH_SESSION_REVOKED', { http: 401, safeMessage: 'Session revoked' });
registerError('AUTH_MFA_REQUIRED', { http: 401, safeMessage: 'MFA required' });
registerError('AUTH_MFA_INVALID', { http: 401, safeMessage: 'MFA invalid' });
registerError('PERMISSION_DENIED', { http: 403, safeMessage: 'Permission denied' });
registerError('PERMISSION_DATA_SCOPE_DENIED', { http: 403, safeMessage: 'Data scope denied' });
registerError('TENANT_ISOLATION_VIOLATION', { http: 403, safeMessage: 'Tenant isolation violation' });
registerError('FIELD_SCOPE_LEAK', { http: 403, safeMessage: 'Field scope blocked' });
registerError('AUDIT_NOT_ATOMIC', { http: 500, safeMessage: 'Audit not atomic with mutation' });
registerError('OUTBOX_NOT_ATOMIC', { http: 500, safeMessage: 'Outbox not atomic with mutation' });
registerError('OUTBOX_DUPLICATE', { http: 409, safeMessage: 'Outbox duplicate idempotency key' });
registerError('OUTBOX_LEASE_LOST', { http: 409, safeMessage: 'Outbox lease lost or reclaimed' });
registerError('PARENT_ACL_DENIED', { http: 403, safeMessage: 'Parent ACL denied' });
registerError('CROSS_TENANT_MENTION', { http: 403, safeMessage: 'Cross-tenant mention denied' });
registerError('WEAK_CONFIGURATION', { http: 503, safeMessage: 'Weak configuration detected' });
registerError('STALE_EVIDENCE', { http: 503, safeMessage: 'Stale evidence rejected' });
registerError('PERMISSION_DENY_DEFAULT', { http: 403, safeMessage: 'Denied by default policy' });
registerError('TENANT_FROM_CLIENT_REJECTED', { http: 403, safeMessage: 'Tenant from client rejected' });

export const ERROR_REGISTRY = registry;

export function assertValidErrorEnvelope(payload: any): void {
  if (!payload || typeof payload !== 'object' || !payload.error || !payload.error.code || !payload.error.message || !payload.error.correlationId) {
    throw Object.assign(new Error('ERROR_ENVELOPE_MISSING: response does not conform to canonical error envelope'), {
      code: 'ERROR_ENVELOPE_MISSING',
      reason_code: 'ERROR_ENVELOPE_MISSING',
      gateId: 'canonical_error_contract'
    });
  }
}

export function assertNoPiiOrSecret(text: string): void {
  for (const { re } of FORBIDDEN_PATTERNS) {
    // reset regex state if global
    re.lastIndex = 0;
    if (re.test(text)) {
      throw Object.assign(new Error('PII_OR_SECRET_IN_ERROR: unscrubbed PII or secret detected in error output'), {
        code: 'PII_OR_SECRET_IN_ERROR',
        reason_code: 'PII_OR_SECRET_IN_ERROR',
        gateId: 'canonical_error_contract'
      });
    }
  }
}
