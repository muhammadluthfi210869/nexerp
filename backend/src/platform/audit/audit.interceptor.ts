/**
 * NEX ERP - Universal Audit Log Interceptor
 *
 * Automatically captures mutating HTTP operations (POST, PUT, PATCH, DELETE)
 * across all modules and records an immutable audit log entry via AuditService.
 *
 * Registered globally; see platform.module.ts (APP_INTERCEPTOR, after
 * TenantContextInterceptor so the tenant claim is already published).
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { AuditService } from './audit.service';
import { TenantContext } from '../tenant/tenant.context';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const SKIPPED_PATHS = ['/health', '/metrics', '/auth/login'];

const SENSITIVE_KEY_PARTS = [
  'password',
  'passwordhash',
  'pin',
  'managerpin',
  'approvalpin',
  'token',
  'secret',
  'refreshtoken',
  'apikey',
];

const MAX_ARRAY_ITEMS = 20;
const MAX_DEPTH = 3;

interface AuditActor {
  id?: string;
  sub?: string;
  roles?: unknown;
  permissions?: unknown;
  organizationId?: unknown;
  tenantId?: unknown;
}

type Jsonish = Record<string, unknown>;

function toValidUuid(val: unknown): string {
  return typeof val === 'string' && UUID_REGEX.test(val) ? val : randomUUID();
}

function optionalUuid(val: unknown): string | undefined {
  return typeof val === 'string' && UUID_REGEX.test(val) ? val : undefined;
}

function headerValue(req: Request, name: string): string | undefined {
  const raw = req.headers?.[name];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return undefined;
}

function sanitizePayload(obj: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH || obj === null || typeof obj !== 'object') return obj;
  if (typeof (obj as any).toJSON === 'function') {
    return (obj as any).toJSON();
  }
  if (typeof (obj as any).toNumber === 'function') {
    return (obj as any).toNumber();
  }
  if (Array.isArray(obj)) {
    return obj
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizePayload(item, depth + 1));
  }
  const clean: Jsonish = {};
  for (const [key, val] of Object.entries(obj as Jsonish)) {
    if (typeof val === 'function') continue;
    clean[key] = SENSITIVE_KEY_PARTS.some((s) => key.toLowerCase().includes(s))
      ? '[REDACTED]'
      : sanitizePayload(val, depth + 1);
  }
  return clean;
}

function pickEntityId(req: Request, response: unknown): string | undefined {
  const body = response as Jsonish | undefined;
  const nested = body?.data as Jsonish | undefined;
  const params = req.params as Jsonish | undefined;
  const query = req.query as Jsonish | undefined;

  const candidates = [body?.id, nested?.id, params?.id, query?.id];
  for (const candidate of candidates) {
    const uuid = optionalUuid(candidate);
    if (uuid) return uuid;
  }
  return undefined;
}

function roleSlug(raw: unknown): string | undefined {
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  if (typeof raw === 'string') return raw;
  return undefined;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    if (!req) return next.handle();

    const method = req.method?.toUpperCase();
    if (!MUTATING_METHODS.has(method)) return next.handle();

    const path = req.route?.path || req.originalUrl || req.url || '';
    if (SKIPPED_PATHS.some((skip) => path.includes(skip))) {
      return next.handle();
    }

    const actor = (req.user || {}) as AuditActor;
    const tenantId =
      actor.organizationId || actor.tenantId || TenantContext.getTenantId();

    const correlationId = toValidUuid(
      (req as Request & { correlationId?: string }).correlationId ||
        headerValue(req, 'x-correlation-id'),
    );
    const entityType =
      context.getClass()?.name?.replace(/Controller$/i, '') || 'Resource';
    const action = `${method} ${path}`;
    const beforeSnapshot = req.body ? sanitizePayload(req.body) : null;
    const idempotencyKey = headerValue(req, 'idempotency-key');

    return next.handle().pipe(
      tap((response: unknown) => {
        void this.record({
          actor,
          tenantId,
          correlationId,
          idempotencyKey,
          entityType,
          entityId: pickEntityId(req, response),
          action,
          beforeSnapshot,
          afterSnapshot: response ? sanitizePayload(response) : null,
          source: req.ip || 'http',
        });
      }),
    );
  }

  private async record(entry: {
    actor: AuditActor;
    tenantId: unknown;
    correlationId: string;
    idempotencyKey?: string;
    entityType: string;
    entityId?: string;
    action: string;
    beforeSnapshot: unknown;
    afterSnapshot: unknown;
    source: string;
  }): Promise<void> {
    try {
      await this.auditService.writeDirectAudit({
        actorUserId: optionalUuid(entry.actor.id || entry.actor.sub),
        actorRoleSlug: roleSlug(entry.actor.roles),
        actorPermissionSnapshot:
          entry.actor.roles || entry.actor.permissions || ['AUTHENTICATED'],
        tenantId: optionalUuid(entry.tenantId),
        correlationId: entry.correlationId,
        idempotencyKey: entry.idempotencyKey,
        source: entry.source,
        entityType: entry.entityType,
        // Every audit row needs a non-null entity id; a route that returns no id
        // still recorded a mutation, so it gets a fresh one rather than nothing.
        entityId: entry.entityId || randomUUID(),
        action: entry.action,
        beforeSnapshot: entry.beforeSnapshot,
        afterSnapshot: entry.afterSnapshot,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to capture audit log for ${entry.action}: ${message}`,
      );
    }
  }
}
