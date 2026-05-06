import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

const corsHeaders = (request: Request) => ({
  'Access-Control-Allow-Origin': request.headers.origin || '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
});

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let body: Record<string, any>;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (
        typeof res === 'object' &&
        res !== null &&
        'code' in res &&
        'message' in res
      ) {
        body = { ...(res as any), statusCode: status, path: request.url };
      } else {
        const msg =
          typeof res === 'string'
            ? res
            : (res as any).message || 'Unknown error';
        body = {
          statusCode: status,
          code: `HTTP_${status}`,
          message: msg,
          path: request.url,
          timestamp: new Date().toISOString(),
        };
      }
    } else {
      body = {
        statusCode: status,
        code: 'INTERNAL_SERVER_ERROR',
        message: (exception as Error).message || 'Internal Server Error',
        path: request.url,
        timestamp: new Date().toISOString(),
      };
    }

    console.error(
      `[${status}] ${request.method} ${request.url}:`,
      body.message,
    );

    const headers = corsHeaders(request);
    for (const [key, value] of Object.entries(headers)) {
      response.header(key, value);
    }

    response.status(status).json(body);
  }
}
