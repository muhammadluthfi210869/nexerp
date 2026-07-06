import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from '../services/logger.service';

const SLOW_THRESHOLD_MS = 2000;

@Injectable()
export class PerformanceMonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { method, url } = request;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;

        if (duration > SLOW_THRESHOLD_MS) {
          this.logger.warn(
            `SLOW ${method} ${url} → ${duration}ms (threshold: ${SLOW_THRESHOLD_MS}ms)`,
            {
              method,
              url,
              duration_ms: duration,
              threshold_ms: SLOW_THRESHOLD_MS,
            },
          );
        }

        if (process.env.LOG_LEVEL === 'debug') {
          this.logger.debug(`${method} ${url} → ${duration}ms`, {
            method,
            url,
            duration_ms: duration,
          });
        }
      }),
    );
  }
}
