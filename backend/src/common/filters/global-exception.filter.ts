import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { toProblemDetails } from '../exceptions/api-exception';

const corsHeaders = (request: Request) => ({
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

    let code = 'INTERNAL_SERVER_ERROR';
    let detail = 'Internal Server Error';
    let details: any = undefined;

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
        `Unhandled exception on ${request.method} ${request.url}`,
        err.stack,
      );
      detail = err.message ?? detail;
    }

    const body = toProblemDetails(status, code, detail, request.url, details);

    const headers = corsHeaders(request);
    for (const [key, value] of Object.entries(headers)) {
      response.header(key, value);
    }

    response
      .status(status)
      .header('Content-Type', 'application/problem+json')
      .json(body);
  }
}
