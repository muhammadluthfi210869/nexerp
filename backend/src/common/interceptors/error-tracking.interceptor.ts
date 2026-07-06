import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Logger } from '../services/logger.service';

@Injectable()
export class ErrorTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ErrorTracking');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { method, url, headers, ip, user } = request;

    const startTime = Date.now();

    return next.handle().pipe(
      catchError((error) => {
        const duration = Date.now() - startTime;
        const status = error instanceof HttpException ? error.getStatus() : 500;

        const errorPayload = {
          type: 'API_ERROR',
          status,
          method,
          url,
          duration_ms: duration,
          ip,
          userAgent: headers['user-agent'],
          userId: user?.id,
          userRole: user?.roles?.[0],
          errorName: error?.name,
          errorMessage: error?.message,
          stack:
            process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
        };

        if (status >= 500) {
          this.logger.error(
            `${method} ${url} → ${status} (${duration}ms): ${error.message}`,
            error.stack,
            errorPayload,
          );
        } else {
          this.logger.warn(
            `${method} ${url} → ${status} (${duration}ms): ${error.message}`,
            errorPayload,
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
