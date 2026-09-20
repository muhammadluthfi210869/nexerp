import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable
} from '@nestjs/common';
import { Response, Request } from 'express';
import { NexError, scrub, getRegistered } from './error.factory';
import { randomUUID } from 'crypto';
interface ErrorPayload {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  correlationId?: string;
}

const ERROR_CODE_MAP: Record<string, { status: number; code: string; message: string }> = {
  SESSION_REVOKED: { status: HttpStatus.UNAUTHORIZED, code: 'AUTH_SESSION_REVOKED', message: 'Session revoked' },
  REFRESH_REPLAY: { status: HttpStatus.UNAUTHORIZED, code: 'AUTH_REFRESH_REPLAY', message: 'Refresh token replay detected' },
  SELF_APPROVAL_FORBIDDEN: { status: HttpStatus.FORBIDDEN, code: 'MAKER_CHECKER_SELF_APPROVE', message: 'Maker cannot approve own request' }
};

@Catch()
@Injectable()
export class CanonicalErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = this.getCorrelationId(request);

    const payload = this.resolvePayload(exception);
    payload.correlationId = correlationId;
    payload.message = scrub(payload.message);

    if (response && typeof response.status === 'function') {
      response.status(payload.status).json({
        error: {
          code: payload.code,
          message: payload.message,
          correlationId: payload.correlationId,
          ...(payload.fieldErrors ? { fieldErrors: payload.fieldErrors } : {})
        }
      });
    }
  }

  private getCorrelationId(request: Request): string {
    const h = request?.headers?.['x-correlation-id'];
    return typeof h === 'string' ? h : randomUUID();
  }

  private resolvePayload(exception: unknown): ErrorPayload {
    if (exception instanceof NexError) {
      return this.fromNexError(exception);
    }
    if (exception instanceof HttpException) {
      return this.fromHttp(exception);
    }
    if (exception instanceof Error) {
      return this.fromError(exception);
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };
  }

  private fromNexError(err: NexError): ErrorPayload {
    return {
      status: err.http,
      code: err.code,
      message: err.safeMessage,
      fieldErrors: err.fieldErrors
    };
  }

  private fromHttp(err: HttpException): ErrorPayload {
    const status = err.getStatus();
    const res: any = err.getResponse();
    let msg = err.message;
    let code = 'HTTP_ERROR';
    if (typeof res === 'string') {
      msg = res;
    } else if (res && typeof res === 'object') {
      msg = Array.isArray(res.message) ? res.message.join(', ') : (res.message || err.message);
      // Canonical business/authorization codes win over Nest's generic HTTP
      // label. P08 services (and the P07 gate before them) attach their
      // contractual code as `reason_code`; `res.error` is only the generic
      // "Bad Request"/"Forbidden" word and used to shadow it, so an HTTP client
      // could never switch on the code the contract names.
      code = res.code || res.reason_code || res.error || code;
    }
    return { status, code, message: msg };
  }

  private fromError(err: any): ErrorPayload {
    const reg = err.code ? getRegistered(err.code) : null;
    if (reg) {
      return { status: reg.http, code: err.code, message: reg.safeMessage };
    }
    const mapped = err.code ? ERROR_CODE_MAP[err.code] : null;
    if (mapped) {
      return { status: mapped.status, code: mapped.code, message: mapped.message };
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR', message: err.message || 'An unexpected error occurred' };
  }
}
