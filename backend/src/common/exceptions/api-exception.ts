import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    details?: any,
  ) {
    super(
      { code, message, details, timestamp: new Date().toISOString() },
      status,
    );
  }
}

export class StateTransitionInvalidException extends ApiException {
  constructor(entityType: string, from: string, to: string, reason?: string) {
    super(
      HttpStatus.BAD_REQUEST,
      'STATE_TRANSITION_INVALID',
      `Transisi status tidak valid: ${entityType} tidak bisa berubah dari ${from} ke ${to}${reason ? `. ${reason}` : ''}`,
    );
  }
}

export class GateBlockedException extends ApiException {
  constructor(gate: string, reason: string) {
    super(
      HttpStatus.FORBIDDEN,
      'GATE_BLOCKED',
      `Gate ${gate} menghalangi: ${reason}`,
    );
  }
}

export class ResourceNotFoundException extends ApiException {
  constructor(resource: string, id?: string) {
    super(
      HttpStatus.NOT_FOUND,
      'RESOURCE_NOT_FOUND',
      `${resource}${id ? ` (${id})` : ''} tidak ditemukan`,
    );
  }
}

export class BusinessRuleViolationException extends ApiException {
  constructor(rule: string, message: string) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      `BUSINESS_RULE_VIOLATION:${rule}`,
      message,
    );
  }
}
