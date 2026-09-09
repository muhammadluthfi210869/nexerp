import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Optional,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IdempotencyService } from '../idempotency/idempotency.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private static readonly fallbackService = new IdempotencyService();

  constructor(
    @Optional() private readonly idempotencyService?: IdempotencyService,
  ) {}

  private get service(): IdempotencyService {
    return this.idempotencyService || IdempotencyInterceptor.fallbackService;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    const headers = req?.headers || {};
    const key = (headers['idempotency-key'] ||
      headers['x-idempotency-key']) as string | undefined;

    if (!key) {
      return next.handle();
    }

    const method = req.method || 'POST';
    const path = req.originalUrl || req.url || '';
    const endpoint = `${method} ${path}`;

    const cached = this.service.check(key, endpoint);
    if (cached) {
      const res = ctx.getResponse();
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('X-Cache-Lookup', 'HIT');
        res.setHeader('X-Idempotency-Replay', 'true');
      }
      return of(cached.result);
    }

    return next.handle().pipe(
      tap((result) => {
        this.service.record(key, endpoint, result);
      }),
    );
  }
}
