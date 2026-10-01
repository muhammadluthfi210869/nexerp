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

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = 'INTERNAL_SERVER_ERROR';
    let detail = 'Internal Server Error';
    let details: any = undefined;

    const prismaError = exception as any;
    if (prismaError?.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      code = 'DUPLICATE_RESOURCE';
      const target = Array.isArray(prismaError.meta?.target)
        ? prismaError.meta.target.join(', ')
        : (prismaError.meta?.target || 'field');
      detail = `Duplicate entry for ${target}. This resource already exists.`;
      details = { target: prismaError.meta?.target };
    } else if (prismaError?.code === 'P2003') {
      status = HttpStatus.BAD_REQUEST;
      code = 'FOREIGN_KEY_VIOLATION';
      const field = prismaError.meta?.field_name || 'referenced record';
      detail = `Referenced record (${field}) does not exist.`;
      details = { field: prismaError.meta?.field_name };
    } else if (prismaError?.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      code = 'NOT_FOUND';
      detail = prismaError.meta?.cause || 'Requested record was not found.';
    } else if (exception instanceof HttpException) {
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
          if (r.fieldErrors !== undefined) details = { ...details, fieldErrors: r.fieldErrors };
        }
      } else if (typeof res === 'string') {
        detail = res;
        code = status === 429 ? 'TOO_MANY_REQUESTS' : `HTTP_${status}`;
      }
    } else {
      const err = exception as Error;
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        err.stack,
      );
      detail = process.env.NODE_ENV === 'production'
        ? 'An unexpected internal error occurred'
        : (err.message ?? detail);
    }

    const body = {
      ...toProblemDetails(status, code, detail, request.url, details),
      message: detail,
    };

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
