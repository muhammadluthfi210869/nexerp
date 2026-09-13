import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { toProblemDetails } from '../exceptions/api-exception';

const corsHeaders = (request: Request): Record<string, string> => ({
  'Access-Control-Allow-Origin': request.headers.origin || '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, X-Requested-With, Idempotency-Key, X-Idempotency-Key',
  'Access-Control-Allow-Credentials': 'true',
});

/**
 * Global exception filter that returns RFC 7807 Problem Details for every error.
 * Frontend can rely on:
 *   - `type`: stable URI → switch by code
 *   - `title`: human-readable category
 *   - `status`: HTTP status code
 *   - `detail`: specific message
 *   - `instance`: request path (URI)
 *   - `code`: machine-readable error code
 *   - `timestamp`: ISO-8601
 *   - `details`: optional context object
 *   - `traceId`: per-request UUID (Wave 2/A5 — log correlation)
 *   - `errors[]`: normalized validation/field error array (RFC 7807 extension)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Wave 2/A5 — per-request traceId for log correlation. Generated here
    // so every error response carries one even when upstream middleware did
    // not set a request ID. ponytail: randomUUID is stdlib; no tracing lib
    // added.
    const traceId =
      (request.headers['x-request-id'] as string | undefined) ??
      (request.headers['x-trace-id'] as string | undefined) ??
      randomUUID();

    let code = 'INTERNAL_SERVER_ERROR';
    let detail = 'Internal Server Error';
    let details: any = undefined;
    let errors: Array<{ field?: string; message: string; code?: string }> | undefined;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const r = res as any;
        code = r.code ?? `HTTP_${status}`;
        // Validation pipe returns { message: string[], error: string, statusCode: number }
        if (Array.isArray(r.message)) {
          detail = `Validation failed for ${r.message.length} field(s)`;
          details = {
            fieldErrors: r.message.map((m: string) => ({ message: m })),
          };
          errors = r.message.map((m: string) => ({ message: m }));
          code = 'VALIDATION_FAILED';
        } else {
          detail = r.message ?? detail;
          if (r.details !== undefined) details = r.details;
        }
      } else if (typeof res === 'string') {
        detail = res;
      }
    } else {
      const err = exception as Error;
      this.logger.error(
        `[traceId=${traceId}] Unhandled exception on ${request.method} ${request.url}`,
        err.stack,
      );
      detail = err.message ?? detail;
    }

    const body = toProblemDetails(status, code, detail, request.url, details);
    body.traceId = traceId;
    if (errors) body.errors = errors;
    body.path = request.url;

    const headers = corsHeaders(request);
    headers['X-Request-Id'] = traceId;
    for (const [key, value] of Object.entries(headers)) {
      response.header(key, value);
    }

    response
      .status(status)
      .header('Content-Type', 'application/problem+json')
      .json(body);
  }
}
