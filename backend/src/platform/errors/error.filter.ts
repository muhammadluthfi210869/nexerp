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

@Catch()
@Injectable()
export class CanonicalErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let fieldErrors: Record<string, string> | undefined = undefined;
    const correlationId = (request?.headers?.['x-correlation-id'] as string) || randomUUID();

    if (exception instanceof NexError) {
      status = exception.http;
      code = exception.code;
      message = exception.safeMessage;
      fieldErrors = exception.fieldErrors;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const anyRes = res as any;
        message = anyRes.message || exception.message;
        code = anyRes.error || anyRes.code || code;
        if (Array.isArray(anyRes.message)) {
          message = anyRes.message.join(', ');
        }
      }
    } else if (exception instanceof Error) {
      const anyErr = exception as any;
      if (anyErr.code && getRegistered(anyErr.code)) {
        const reg = getRegistered(anyErr.code)!;
        status = reg.http;
        code = anyErr.code;
        message = reg.safeMessage;
      } else if (anyErr.code === 'SESSION_REVOKED') {
        status = HttpStatus.UNAUTHORIZED;
        code = 'AUTH_SESSION_REVOKED';
        message = 'Session revoked';
      } else if (anyErr.code === 'REFRESH_REPLAY') {
        status = HttpStatus.UNAUTHORIZED;
        code = 'AUTH_REFRESH_REPLAY';
        message = 'Refresh token replay detected';
      } else if (anyErr.code === 'SELF_APPROVAL_FORBIDDEN') {
        status = HttpStatus.FORBIDDEN;
        code = 'MAKER_CHECKER_SELF_APPROVE';
        message = 'Maker cannot approve own request';
      } else {
        message = exception.message || message;
      }
    }

    const safeMessage = scrub(String(message || ''));

    if (response && typeof response.status === 'function') {
      response.status(status).json({
        error: {
          code,
          message: safeMessage,
          correlationId,
          ...(fieldErrors ? { fieldErrors } : {})
        }
      });
    }
  }
}
