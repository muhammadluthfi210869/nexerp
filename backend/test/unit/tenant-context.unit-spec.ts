/**
 * TenantContextInterceptor — the verified JWT claim is the only tenant source.
 *
 * The middleware pass seeds TenantContext from headers, and middleware runs
 * before guards. This interceptor runs AFTER guards, overwrites that seed with
 * the verified claim, and is the reason `TenantContext.getTenantId()` can be
 * trusted inside service code.
 */

import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { randomUUID } from 'crypto';
import { TenantContextInterceptor } from '../../src/platform/tenant/tenant.interceptor';
import { TenantContext } from '../../src/platform/tenant/tenant.context';

describe('TenantContextInterceptor', () => {
  const interceptor = new TenantContextInterceptor();

  const ctxFor = (user: unknown, type: string = 'http'): ExecutionContext =>
    ({
      getType: () => type,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getClass: () => ({ name: 'TestController' }),
      getHandler: () => ({ name: 'test' }),
    }) as unknown as ExecutionContext;

  const next: CallHandler = { handle: () => of({ ok: true }) };

  it('publishes the verified tenant claim so service code can read it', (done) => {
    const organizationId = randomUUID();
    const userId = randomUUID();
    const ctx = ctxFor({ id: userId, organizationId, roles: ['FINANCE'] });

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        expect(TenantContext.getTenantId()).toBe(organizationId);
        expect(TenantContext.getUserId()).toBe(userId);
        expect(TenantContext.getRoles()).toEqual(['FINANCE']);
        done();
      },
    });
  });

  it('reads tenantId when the claim carries that name instead', (done) => {
    const tenantId = randomUUID();
    const ctx = ctxFor({ id: randomUUID(), tenantId });

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        expect(TenantContext.getTenantId()).toBe(tenantId);
        done();
      },
    });
  });

  it('refuses a non-UUID tenant claim rather than publishing a header artefact', (done) => {
    const ctx = ctxFor({
      id: randomUUID(),
      organizationId: 'org-a',
      roles: [],
    });

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        expect(TenantContext.getTenantId()).toBeUndefined();
        done();
      },
    });
  });

  it('leaves the context empty for an unauthenticated request', (done) => {
    const ctx = ctxFor(undefined);

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        expect(TenantContext.getTenantId()).toBeUndefined();
        expect(TenantContext.getUserId()).toBeUndefined();
        done();
      },
    });
  });

  it('detects a super-admin role through the context', (done) => {
    TenantContext.enterWith({ roles: ['role-nex-super-admin'] });
    expect(TenantContext.isSuperAdmin()).toBe(true);
    done();
  });
});
