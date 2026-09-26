/**
 * NEX ERP - Tenant Context Interceptor
 *
 * Guards run before interceptors, so by the time this runs `req.user` holds the
 * tenant from the verified JWT claim — never from the body or a header. Publishing
 * it into AsyncLocalStorage here is what makes `TenantContext.getTenantId()`
 * trustworthy inside service code.
 *
 * Registered globally; see platform.module.ts (APP_INTERCEPTOR).
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { TenantContext, TenantContextData } from './tenant.context';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RequestActor {
  id?: unknown;
  sub?: unknown;
  roles?: unknown;
  organizationId?: unknown;
  tenantId?: unknown;
  divisionId?: unknown;
}

function asString(val: unknown): string | undefined {
  return typeof val === 'string' && val.length > 0 ? val : undefined;
}

/** A claim is a real tenant id only when it is a UUID; headers are not trusted. */
function asTenant(val: unknown): string | undefined {
  const str = asString(val);
  return str && UUID_REGEX.test(str) ? str : undefined;
}

function asRoles(val: unknown): string[] {
  return Array.isArray(val) ? val.map(String) : [];
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as Request & { user?: RequestActor }).user;

    if (user) {
      const claimOrg = asTenant(user.organizationId) || asTenant(user.tenantId);

      const data: TenantContextData = {
        userId: asString(user.id) || asString(user.sub),
        organizationId: claimOrg,
        tenantId: claimOrg,
        divisionId: asString(user.divisionId),
        roles: asRoles(user.roles),
      };
      TenantContext.enterWith(data);
    }

    return next.handle();
  }
}
