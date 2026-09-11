import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LogActivityType } from '@prisma/client';
import { ActivityLogService } from './activity-log.service';
import type { Request } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Paths that should never be logged (health, swagger, static assets).
const SKIP_PREFIXES = ['/health', '/api/docs', '/api/docs-json', '/uploads'];

interface AuthedReq extends Request {
  user?: { sub?: string; roles?: string[] };
}

/**
 * Auto-logs mutating HTTP requests (POST/PUT/PATCH/DELETE) to ActivityLog.
 * Global — registered via APP_INTERCEPTOR in ActivityLogModule.
 *
 * ponytail: page-view logs come from frontend hook, not this interceptor.
 * Auth events (login/logout/fail) are emitted from auth.controller.ts
 * directly — interceptor can't see them since they hit before this
 * runs and after the JWT guard.
 */
@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly service: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<AuthedReq>();
    const method = req.method?.toUpperCase();
    if (!method || !MUTATING_METHODS.has(method)) return next.handle();

    const url = req.originalUrl ?? req.url ?? '';
    if (SKIP_PREFIXES.some((p) => url.startsWith(p))) return next.handle();

    const userId = req.user?.sub ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    const ip = req.ip ?? null;

    // Derive entityType/Id from RESTful path:
    //   /api/<resource>/<uuid>  → entityType="<Resource>", entityId=<uuid>
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const entityType = segments.length >= 2 ? segments[1] : null;
    const last = segments[segments.length - 1];
    const isUuid =
      typeof last === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        last,
      );
    const entityId = isUuid ? last : null;

    return next.handle().pipe(
      tap({
        next: () => {
          // Fire-and-forget — interceptor MUST NOT fail the request
          // if logging itself fails.
          void this.service
            .log({
              userId,
              type: this.methodToType(method),
              method,
              entityType,
              entityId,
              path: url,
              ip,
              userAgent,
            })
            .catch(() => undefined);
        },
      }),
    );
  }

  private methodToType(method: string): LogActivityType {
    switch (method) {
      case 'POST':
        return LogActivityType.CREATE;
      case 'PUT':
      case 'PATCH':
        return LogActivityType.UPDATE;
      case 'DELETE':
        return LogActivityType.DELETE;
      default:
        return LogActivityType.UPDATE;
    }
  }
}