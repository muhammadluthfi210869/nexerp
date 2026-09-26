/**
 * NEX ERP - Tenant Context Middleware
 *
 * Seeds TenantContext from the request headers. Middleware runs BEFORE guards, so
 * `req.user` is still empty here; the verified tenant is published later by
 * `TenantContextInterceptor` (which runs after guards). This pass exists for the
 * two cases an interceptor cannot cover: routes with no guard at all, and the
 * header-supplied tenant on requests that are refused before a handler exists.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext, TenantContextData } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const headerOrgId = req.headers['x-organization-id'] || req.headers['x-tenant-id'];

    const contextData: TenantContextData = {
      organizationId: typeof headerOrgId === 'string' ? headerOrgId : undefined,
      tenantId: typeof headerOrgId === 'string' ? headerOrgId : undefined,
    };

    TenantContext.run(contextData, () => {
      next();
    });
  }
}
