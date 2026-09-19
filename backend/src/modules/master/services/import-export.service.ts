import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { AuditService } from '../../../platform/audit/audit.service';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { PolicyService, PolicyActor } from '../../../platform/policy/policy.service';
import { ScopeService } from '../../../platform/scope/scope.service';
import { Prisma } from '@prisma/client';
import { randomUUID, createHash } from 'crypto';
import { parse } from 'csv-parse/sync';

export interface ImportOptions {
  dryRun?: boolean;
  tenantId?: string;
  actor?: PolicyActor;
  idempotencyKey?: string;
  clientInjectedTenantId?: string;
  clientInjectedRoles?: string[];
}

export interface ExportOptions {
  tenantId?: string;
  actor?: PolicyActor;
  format?: 'csv' | 'json';
  clientInjectedTenantId?: string;
  clientInjectedRoles?: string[];
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  dryRun: boolean;
  idempotencyKey?: string;
  errors: Array<{ row: number; field?: string; message: string }>;
}

/**
 * P06-R4-B2: AuditService, OutboxService, PolicyService, ScopeService are MANDATORY
 * constructor dependencies. There is no @Optional marker, no null-returning
 * require* helper, and no noopWithAudit fallback. Production Nest DI
 * (MasterModule imports PlatformModule) resolves all four globally. Anyone
 * instantiating this service directly with fewer than four P05 dependencies
 * causes a TypeScript compile error.
 */
@Injectable()
export class ImportExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly policyService: PolicyService,
    private readonly scopeService: ScopeService
  ) {}

  /** Neutralizes formula injection vulnerabilities (CSV/Excel). */
  sanitizeCellValue(val: unknown): unknown {
    if (typeof val === 'string') {
      if (['=', '+', '-', '@', '\t', '\r'].some((char) => val.startsWith(char))) {
        return "'" + val;
      }
    }
    return val;
  }

  sanitizeExportRow<T extends Record<string, any>>(row: T): T {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        sanitized[key] = this.sanitizeExportRow(value);
      } else {
        sanitized[key] = this.sanitizeCellValue(value);
      }
    }
    return sanitized as T;
  }

  computePayloadDigest(content: string | Record<string, any>[]): string {
    const serialized = typeof content === 'string' ? content : JSON.stringify(content);
    return createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * P06-R4-B3: enforcePolicy fails closed when actor is missing, actor.id is
   * missing, or required tenant/organization scope is unresolved. Never returns
   * success when actor is absent.
   */
  private enforcePolicy(
    entity: string,
    action: 'import' | 'export',
    options: { actor?: PolicyActor; tenantId?: string; clientInjectedTenantId?: string; clientInjectedRoles?: string[] }
  ): void {
    if (!options.actor || !options.actor.id) {
      throw new ForbiddenException('MISSING_ACTOR_CONTEXT: authenticated actor required');
    }
    if (!options.actor.organizationId) {
      throw new ForbiddenException('MISSING_TENANT_SCOPE: actor has no organizationId');
    }

    const decision = this.policyService.decide({
      actor: options.actor,
      action: `${entity}:${action}`,
      requiredPermission: `${entity}:${action === 'import' ? 'write' : 'read'}`,
      resource: {
        type: entity,
        tenantId: options.tenantId || options.actor.organizationId,
        organizationId: options.tenantId || options.actor.organizationId,
      },
      clientInjectedTenantId: options.clientInjectedTenantId,
      clientInjectedRoles: options.clientInjectedRoles,
    });

    if (!decision.allow) {
      throw new ForbiddenException(decision.reason_code || 'PERMISSION_DENY_DEFAULT');
    }
  }

  async exportData(entity: string, filter: Record<string, any> = {}, options: ExportOptions = {}) {
    const entLower = entity.toLowerCase().replace(/[-_]/g, '');
    this.enforcePolicy(entLower, 'export', options);

    const limit = Number(filter?.limit) || 50;
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const page = Math.max(1, Number(filter?.page) || 1);
    const skip = (page - 1) * safeLimit;

    const where: Record<string, any> = { ...(filter?.where || {}) };
    // P06-R4-D: Master entities (Unit, Category, TaxRate, MaterialItem,
    // Warehouse, Supplier, Customer) are global canonical masters. They
    // do not carry an `organizationId` column in the physical schema. Tenant
    // scope for these is therefore access-control driven (PolicyService.decide
    // role/permission checks) rather than row-level filter. Cross-tenant
    // isolation is enforced upstream in enforcePolicy(); audit logs capture
    // the actor+tenant combination per request.
    if (filter?.search && typeof filter.search === 'string') {
      const s = filter.search.trim();
      if (s) {
        if (['unit', 'units', 'category', 'categories', 'material', 'materials'].includes(entLower)) {
          where.OR = [
            { code: { contains: s, mode: 'insensitive' } },
            { name: { contains: s, mode: 'insensitive' } },
          ];
        } else {
          where.OR = [
            { name: { contains: s, mode: 'insensitive' } },
          ];
        }
      }
    }

    let records: any[] = [];

    switch (entLower) {
      case 'unit':
      case 'units':
      case 'masterunit':
        records = await this.prisma.masterUnit.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { code: 'asc' },
        });
        break;

      case 'category':
      case 'categories':
      case 'mastercategory':
        records = await this.prisma.masterCategory.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { code: 'asc' },
        });
        break;

      case 'warehouse':
      case 'warehouses':
        records = await this.prisma.warehouse.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { name: 'asc' },
        });
        break;

      case 'supplier':
      case 'suppliers':
        records = await this.prisma.supplier.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { name: 'asc' },
        });
        break;

      case 'customer':
      case 'customers':
      case 'saleslead':
        records = await this.prisma.salesLead.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { clientName: 'asc' },
        });
        break;

      case 'material':
      case 'materials':
      case 'materialitem':
      case 'goods':
        records = await this.prisma.materialItem.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { name: 'asc' },
        });
        break;

      case 'taxrate':
      case 'taxrates':
      case 'mastertaxrate':
        records = await this.prisma.taxRate.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { name: 'asc' },
        });
        break;

      default:
        throw new BadRequestException('Unsupported entity for export: ' + entity);
    }

    const sanitizedRecords = records.map((r) => this.sanitizeExportRow(r));

    const masked = sanitizedRecords.map((r) =>
      this.scopeService.maskField<Record<string, any>>(r, ['taxId', 'bankAccount', 'npwp'], {
        userId: options.actor!.id,
        organizationId: options.tenantId || options.actor!.organizationId || '',
      })
    );

    if (options.format === 'csv') {
      return this.serializeToCsv(masked);
    }

    return masked;
  }

  serializeToCsv(records: Record<string, any>[]): string {
    if (!records || records.length === 0) return '';
    const headers = Object.keys(records[0]);
    const lines = [headers.join(',')];

    for (const row of records) {
      const line = headers.map(h => {
        let val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
          return `"${val}"`;
        }
        return String(val);
      }).join(',');
      lines.push(line);
    }

    return lines.join('\n');
  }

  parseCsv(csvString: string): Record<string, any>[] {
    if (!csvString || !csvString.trim()) {
      throw new BadRequestException('CSV_EMPTY: CSV content cannot be empty');
    }
    try {
      const records = parse(csvString, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_quotes: false,
      });
      return records as Record<string, any>[];
    } catch (err: any) {
      throw new BadRequestException(`CSV_PARSE_FAILED: ${err.message}`);
    }
  }

  async importData(
    entity: string,
    rowsOrCsv: Record<string, any>[] | string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const entLower = entity.toLowerCase().replace(/[-_]/g, '');
    this.enforcePolicy(entLower, 'import', options);

    let rows: Record<string, any>[];
    if (typeof rowsOrCsv === 'string') {
      rows = this.parseCsv(rowsOrCsv);
    } else if (Array.isArray(rowsOrCsv)) {
      rows = rowsOrCsv;
    } else {
      throw new BadRequestException('INVALID_IMPORT_PAYLOAD: expected rows array or CSV string');
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('IMPORT_BATCH_EMPTY: at least one row is required');
    }

    const payloadDigest = this.computePayloadDigest(rowsOrCsv);
    const resolvedTenant = options.tenantId || options.actor!.organizationId;

    // ── Row-Level Validation ──
    const errors: Array<{ row: number; field?: string; message: string }> = [];
    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      if (!row || typeof row !== 'object') {
        errors.push({ row: rowNum, message: 'Row must be a valid object' });
        return;
      }
      if (entLower === 'supplier' || entLower === 'suppliers') {
        if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
          errors.push({ row: rowNum, field: 'name', message: 'Supplier name is required' });
        }
      } else if (entLower === 'customer' || entLower === 'customers' || entLower === 'saleslead') {
        if (!row.clientName && !row.name && !row.brandName) {
          errors.push({ row: rowNum, field: 'name', message: 'Customer name or brand name is required' });
        }
      } else if (entLower === 'taxrate' || entLower === 'taxrates' || entLower === 'mastertaxrate') {
        if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
          errors.push({ row: rowNum, field: 'name', message: 'Tax rate name is required' });
        }
        if (row.rate === undefined || row.rate === null || isNaN(Number(row.rate))) {
          errors.push({ row: rowNum, field: 'rate', message: 'Valid rate number is required' });
        }
      } else if (entLower === 'warehouse' || entLower === 'warehouses') {
        if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
          errors.push({ row: rowNum, field: 'name', message: 'Warehouse name is required' });
        }
      } else {
        if (!row.code || typeof row.code !== 'string' || row.code.trim() === '') {
          errors.push({ row: rowNum, field: 'code', message: 'Code is required' });
        }
        if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
          errors.push({ row: rowNum, field: 'name', message: 'Name is required' });
        }
      }
    });

    // P06-R4-B4: any validation failure throws canonical 400 — never returns
    // a "success: false" transport success. Row-level diagnostics are preserved
    // in the exception payload for the caller.
    if (errors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'IMPORT_VALIDATION_FAILED',
        message: 'VALIDATION_FAILED: Import batch contains validation errors',
        totalRows: rows.length,
        errors,
      });
    }

    if (options.dryRun) {
      return {
        success: true,
        totalRows: rows.length,
        importedRows: rows.length,
        dryRun: true,
        idempotencyKey: options.idempotencyKey,
        errors: [],
      };
    }

    // ── All-or-Nothing Atomic Transaction with intra-transaction idempotency acquisition
    // P06-R4-B5: the entire idempotency check + lock + master mutation + audit +
    // outbox run inside one tx. Two concurrent identical requests serialize at
    // the advisory lock, and the second transaction observes the first's
    // committed SUCCEEDED row before attempting the master mutation.
    return await this.prisma.$transaction(async (tx) => {
      if (options.idempotencyKey) {
        const lockHash = createHash('sha256')
          .update(`${resolvedTenant}|${entLower}|${options.idempotencyKey}`)
          .digest();
        const lockInt = lockHash.readUInt32BE(0) % 0x7FFFFFFE;
        await tx.$queryRawUnsafe(`SELECT (pg_advisory_xact_lock(${lockInt}::bigint))::text AS acquired`);

        // Re-check inside the transaction so we observe any committed winner.
        const existing = await tx.importExecution.findFirst({
          where: {
            tenantId: resolvedTenant,
            entityType: entLower,
            idempotencyKey: options.idempotencyKey,
          },
        });
        if (existing) {
          if (existing.payloadDigest === payloadDigest && existing.status === 'SUCCEEDED' && existing.resultSummary) {
            return existing.resultSummary as unknown as ImportResult;
          }
          if (existing.payloadDigest !== payloadDigest) {
            throw new ConflictException(
              `IDEMPOTENCY_CONFLICT: Key "${options.idempotencyKey}" previously executed with different payload`
            );
          }
          throw new ConflictException('IMPORT_IN_PROGRESS: another import with this key is currently running');
        }
      }

      let importedCount = 0;
      for (const row of rows) {
        const code = row.code ? String(row.code).trim().toUpperCase() : undefined;
        const name = row.name ? String(row.name).trim() : undefined;

        switch (entLower) {
          case 'unit':
          case 'units':
          case 'masterunit':
            if (!code || !name) {
              throw new BadRequestException('VALIDATION_FAILED: Unit code and name are required');
            }
            await tx.masterUnit.upsert({
              where: { code: code },
              update: { name: name, symbol: row.symbol ?? null, description: row.description ?? null },
              create: { code: code, name: name, symbol: row.symbol ?? null, description: row.description ?? null },
            });
            break;

          case 'category':
          case 'categories':
          case 'mastercategory':
            if (!code || !name) {
              throw new BadRequestException('VALIDATION_FAILED: Category code and name are required');
            }
            await tx.masterCategory.upsert({
              where: { code: code },
              update: { name: name, description: row.description ?? null, type: row.type || 'GENERAL' },
              create: { code: code, name: name, description: row.description ?? null, type: row.type || 'GENERAL' },
            });
            break;

          case 'supplier':
          case 'suppliers':
            if (!name) {
              throw new BadRequestException('VALIDATION_FAILED: Supplier name is required');
            }
            await tx.supplier.create({
              data: {
                name: name,
                email: row.email || null,
                phone: row.phone || null,
                address: row.address || null,
                city: row.city || null,
                contact: row.contact || null,
              },
            });
            break;

          case 'customer':
          case 'customers':
          case 'saleslead': {
            if (!row.clientName && !row.name) {
              throw new BadRequestException('VALIDATION_FAILED: Customer name is required');
            }
            const defaultPic = await tx.bussdevStaff.findFirst({ orderBy: { name: 'asc' } });
            await tx.salesLead.create({
              data: {
                clientName: String(row.clientName || row.name).trim(),
                brandName: row.brandName ? String(row.brandName).trim() : null,
                contactInfo: row.phone || row.contactInfo || row.email || '-',
                email: row.email || null,
                city: row.city || null,
                province: row.province || null,
                addressDetail: row.address || null,
                status: 'NEW_LEAD',
                source: 'IMPORT',
                productInterest: row.productInterest || 'General',
                picId: defaultPic?.id || randomUUID(),
              },
            });
            break;
          }

          case 'material':
          case 'materials':
          case 'materialitem':
          case 'goods':
            if (!code || !name) {
              throw new BadRequestException('VALIDATION_FAILED: Material code and name are required');
            }
            await tx.materialItem.upsert({
              where: { code: code },
              update: {
                name: name,
                type: row.type || 'RAW_MATERIAL',
                unit: row.unit || 'pcs',
                unitPrice: row.unitPrice !== undefined ? Number(row.unitPrice) : 0,
                stockQty: row.stockQty !== undefined ? Number(row.stockQty) : 0,
                minLevel: row.minLevel !== undefined ? Number(row.minLevel) : (row.minStock !== undefined ? Number(row.minStock) : 0),
                maxLevel: row.maxLevel !== undefined ? Number(row.maxLevel) : 100000,
                reorderPoint: row.reorderPoint !== undefined ? Number(row.reorderPoint) : 10,
                status: row.status || 'ACTIVE',
              },
              create: {
                code: code,
                name: name,
                type: row.type || 'RAW_MATERIAL',
                unit: row.unit || 'pcs',
                unitPrice: row.unitPrice !== undefined ? Number(row.unitPrice) : 0,
                stockQty: row.stockQty !== undefined ? Number(row.stockQty) : 0,
                minLevel: row.minLevel !== undefined ? Number(row.minLevel) : (row.minStock !== undefined ? Number(row.minStock) : 0),
                maxLevel: row.maxLevel !== undefined ? Number(row.maxLevel) : 100000,
                reorderPoint: row.reorderPoint !== undefined ? Number(row.reorderPoint) : 10,
                status: row.status || 'ACTIVE',
              },
            });
            break;

          case 'warehouse':
          case 'warehouses': {
            if (!name) {
              throw new BadRequestException('VALIDATION_FAILED: Warehouse name is required');
            }
            const existingWh = await tx.warehouse.findFirst({ where: { name: name } });
            if (existingWh) {
              await tx.warehouse.update({
                where: { id: existingWh.id },
                data: {
                  phone: row.phone || existingWh.phone,
                  picName: row.picName || existingWh.picName,
                  city: row.city || existingWh.city,
                  address: row.address || existingWh.address,
                  status: row.status || existingWh.status,
                },
              });
            } else {
              await tx.warehouse.create({
                data: {
                  name: name,
                  phone: row.phone || null,
                  picName: row.picName || null,
                  city: row.city || null,
                  address: row.address || null,
                  status: row.status || 'ACTIVE',
                },
              });
            }
            break;
          }

          case 'taxrate':
          case 'taxrates':
          case 'mastertaxrate': {
            if (!name) {
              throw new BadRequestException('VALIDATION_FAILED: Tax rate name is required');
            }
            const existingTax = await tx.taxRate.findFirst({ where: { name: name } });
            if (existingTax) {
              await tx.taxRate.update({
                where: { id: existingTax.id },
                data: { rate: Number(row.rate) || 0, isActive: row.isActive !== false },
              });
            } else {
              await tx.taxRate.create({
                data: { name: name, rate: Number(row.rate) || 0, isActive: row.isActive !== false },
              });
            }
            break;
          }

          default:
            throw new BadRequestException('Unsupported entity for import: ' + entity);
        }
        importedCount++;
      }

      const successResult: ImportResult = {
        success: true,
        totalRows: rows.length,
        importedRows: importedCount,
        dryRun: false,
        idempotencyKey: options.idempotencyKey,
        errors: [],
      };

      // ── Persist Durable Idempotency State inside transaction ──
      if (options.idempotencyKey) {
        await tx.importExecution.create({
          data: {
            tenantId: resolvedTenant,
            entityType: entLower,
            idempotencyKey: options.idempotencyKey,
            payloadDigest,
            status: 'SUCCEEDED',
            totalRows: rows.length,
            importedRows: importedCount,
            resultSummary: successResult as any,
          },
        });
      }

      // ── Atomic Audit and Outbox (fails transaction if either fails) ──
      const batchId = randomUUID();
      const correlationId = randomUUID();

      await this.auditService.withAudit(
        tx,
        {
          actorUserId: options.actor!.id,
          actorRoleSlug: options.actor!.roles?.[0] || 'ADMIN',
          actorPermissionSnapshot: { roles: options.actor!.roles, action: `${entLower}:import` },
          tenantId: resolvedTenant,
          correlationId,
          idempotencyKey: options.idempotencyKey || null,
          source: 'import-export.service',
          entityType: entity,
          entityId: batchId,
          action: 'BULK_IMPORT',
          afterSnapshot: { totalRows: rows.length, importedRows: importedCount },
        },
        async (txInner: Prisma.TransactionClient) => {
          await this.outboxService.enqueue(txInner, {
            eventType: 'MASTER_DATA_IMPORTED',
            aggregateType: entity,
            aggregateId: batchId,
            idempotencyKey: options.idempotencyKey ? `${options.idempotencyKey}:outbox` : randomUUID(),
            payload: { entity, count: importedCount, tenantId: resolvedTenant, batchId },
            correlationId,
            tenantId: resolvedTenant,
          });
          return successResult;
        }
      );

      return successResult;
    });
  }
}
