import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception that produces RFC 7807 Problem Details responses.
 * Extend the existing service-layer error vocabulary.
 */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    details?: any,
  ) {
    super(
      {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

/**
 * Convert to RFC 7807 Problem Details format.
 * Fields: type, title, status, detail, instance (all required by RFC 7807).
 * Extension members (traceId, path, errors[]) are added by the caller via
 * the returned object — the helper keeps its signature minimal.
 */
export function toProblemDetails(
  status: number,
  code: string,
  detail: string,
  instance: string,
  details?: any,
): Record<string, unknown> {
  const TYPE_BASE = 'https://nexerp.dreamlab.id/errors/';
  return {
    type: `${TYPE_BASE}${code.toLowerCase().replace(/[:_]/g, '-')}`,
    title: humanizeCode(code),
    status,
    detail,
    instance,
    code,
    timestamp: new Date().toISOString(),
    ...(details !== undefined ? { details } : {}),
  };
}

function humanizeCode(code: string): string {
  return code
    .replace(/[:_]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * BusinessException — concrete error with stable error code.
 * Use these in service layer instead of generic BadRequestException,
 * so frontend can switch on `code` reliably.
 */
export class BusinessException extends ApiException {
  constructor(code: string, message: string, status: HttpStatus = HttpStatus.BAD_REQUEST, details?: any) {
    super(status, code, message, details);
  }
}

/**
 * StateTransitionInvalid — invalid status transitions.
 * Caller can switch on 'STATE_TRANSITION_INVALID'.
 */
export class StateTransitionInvalidException extends BusinessException {
  constructor(entityType: string, from: string, to: string, reason?: string) {
    super(
      'STATE_TRANSITION_INVALID',
      `Transisi status tidak valid: ${entityType} tidak bisa berubah dari ${from} ke ${to}${reason ? `. ${reason}` : ''}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
      { entityType, from, to, reason },
    );
  }
}

/**
 * GateBlocked — period lock, 3-way match, SoD, etc.
 */
export class GateBlockedException extends BusinessException {
  constructor(gate: string, reason: string, details?: any) {
    super(
      'GATE_BLOCKED',
      `Gate ${gate} menghalangi: ${reason}`,
      HttpStatus.FORBIDDEN,
      { gate, ...details },
    );
  }
}

/**
 * ResourceNotFound — wraps NotFoundException with stable code.
 */
export class ResourceNotFoundException extends BusinessException {
  constructor(resource: string, id?: string) {
    super(
      'RESOURCE_NOT_FOUND',
      `${resource}${id ? ` (${id})` : ''} tidak ditemukan`,
      HttpStatus.NOT_FOUND,
      { resource, id },
    );
  }
}

/**
 * BusinessRuleViolation — domain rule failure.
 */
export class BusinessRuleViolationException extends BusinessException {
  constructor(rule: string, message: string, details?: any) {
    super(
      `BUSINESS_RULE_VIOLATION:${rule}`,
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      { rule, ...details },
    );
  }
}

/**
 * ValidationError — input validation failed (consolidates ValidationPipe output).
 */
export class ValidationFailedException extends BusinessException {
  constructor(fieldErrors: Array<{ field: string; message: string; code?: string }>) {
    super(
      'VALIDATION_FAILED',
      `Validasi gagal untuk ${fieldErrors.length} field`,
      HttpStatus.BAD_REQUEST,
      { fieldErrors },
    );
  }
}

/**
 * PeriodLockedException — specific gate for closed period.
 */
export class PeriodLockedException extends BusinessException {
  constructor(period: string) {
    super(
      'PERIOD_LOCKED',
      `Periode ${period} sudah ditutup. Tidak bisa melakukan posting.`,
      HttpStatus.FORBIDDEN,
      { period },
    );
  }
}

/**
 * SoDViolationException — Segregation of Duties violation
 * (e.g., same user tries to prepare and approve a journal).
 */
export class SoDViolationException extends BusinessException {
  constructor(action: string) {
    super(
      'SOD_VIOLATION',
      `Pemisahan tugas dilanggar: ${action}. User yang berbeda diperlukan.`,
      HttpStatus.FORBIDDEN,
      { action },
    );
  }
}
