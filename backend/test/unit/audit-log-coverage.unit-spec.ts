/**
 * Universal Audit Log Coverage & Sanitization Unit Tests
 */

import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { randomUUID } from 'crypto';
import { AuditLogInterceptor } from '../../src/platform/audit/audit.interceptor';
import { AuditService } from '../../src/platform/audit/audit.service';

describe('AuditLogInterceptor - Universal Audit Logging & Masking', () => {
  let interceptor: AuditLogInterceptor;
  let mockAuditService: { writeDirectAudit: jest.Mock };

  beforeEach(() => {
    mockAuditService = {
      writeDirectAudit: jest.fn().mockResolvedValue({ id: randomUUID(), txId: 'audit:test' }),
    };
    interceptor = new AuditLogInterceptor(mockAuditService as unknown as AuditService);
  });

  const createMockContext = (
    method: string,
    url: string,
    body: any = {},
    user: any = null,
    headers: any = {},
  ): ExecutionContext => {
    const req = {
      method,
      url,
      originalUrl: url,
      route: { path: url },
      body,
      user,
      headers: { 'x-correlation-id': randomUUID(), ...headers },
      params: { id: randomUUID() },
      ip: '127.0.0.1',
    };

    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
      getClass: () => ({ name: 'SalesOrderController' }),
      getHandler: () => ({ name: 'createOrder' }),
    } as unknown as ExecutionContext;
  };

  it('ignores GET requests and does not write audit log', (done) => {
    const ctx = createMockContext('GET', '/v1/sales-orders');
    const next: CallHandler = { handle: () => of({ data: [] }) };

    interceptor.intercept(ctx, next).subscribe({
      next: (val) => {
        expect(val).toEqual({ data: [] });
        expect(mockAuditService.writeDirectAudit).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('captures POST request and sanitizes sensitive fields in beforeSnapshot & afterSnapshot', (done) => {
    const rawBody = {
      customerName: 'PT Maju Bersama',
      amount: 15000000,
      password: 'supersecretpassword123',
      pin: '123456',
      token: 'jwt-token-val',
    };

    const user = {
      id: randomUUID(),
      roles: ['COMMERCIAL_STAFF'],
      organizationId: randomUUID(),
    };

    const ctx = createMockContext('POST', '/v1/sales-orders', rawBody, user);
    const mockResponse = { id: randomUUID(), status: 'DRAFT', token: 'response-token-value' };
    const next: CallHandler = { handle: () => of(mockResponse) };

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        expect(mockAuditService.writeDirectAudit).toHaveBeenCalledTimes(1);
        const auditCall = mockAuditService.writeDirectAudit.mock.calls[0][0];

        expect(auditCall.actorUserId).toBe(user.id);
        expect(auditCall.actorRoleSlug).toBe('COMMERCIAL_STAFF');
        expect(auditCall.tenantId).toBe(user.organizationId);
        expect(auditCall.entityType).toBe('SalesOrder');
        expect(auditCall.action).toContain('POST');

        // Sensitive credentials must be redacted
        expect(auditCall.beforeSnapshot.password).toBe('[REDACTED]');
        expect(auditCall.beforeSnapshot.pin).toBe('[REDACTED]');
        expect(auditCall.beforeSnapshot.token).toBe('[REDACTED]');
        expect(auditCall.beforeSnapshot.customerName).toBe('PT Maju Bersama');

        expect(auditCall.afterSnapshot.token).toBe('[REDACTED]');
        expect(auditCall.afterSnapshot.status).toBe('DRAFT');

        done();
      },
    });
  });

  it('bypasses /health, /metrics, and /auth/login endpoints from universal audit interceptor', (done) => {
    const healthCtx = createMockContext('POST', '/health', { ping: true });
    const next: CallHandler = { handle: () => of({ status: 'ok' }) };

    interceptor.intercept(healthCtx, next).subscribe({
      next: () => {
        expect(mockAuditService.writeDirectAudit).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('does not fail business response even if audit log creation throws error', (done) => {
    mockAuditService.writeDirectAudit.mockRejectedValue(new Error('DB Connection Timeout'));

    const user = { id: randomUUID(), roles: ['FINANCE_ADMIN'], organizationId: randomUUID() };
    const ctx = createMockContext('PUT', '/v1/invoices', { number: 'INV-001' }, user);
    const next: CallHandler = { handle: () => of({ success: true }) };

    interceptor.intercept(ctx, next).subscribe({
      next: (val) => {
        expect(val).toEqual({ success: true });
        done();
      },
    });
  });
});
