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

/**
 * Legacy opening stock arrives with no real supplier, but
 * `MaterialInventory.supplierId` is NOT NULL. Every imported opening batch is
 * parked on this one canonical system supplier instead of being silently
 * attributed to a real vendor.
 */
const OPENING_STOCK_SUPPLIER = 'OPENING-BALANCE (SYSTEM)';

export interface ImportOptions {  dryRun?: boolean;
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
      } else if (entLower === 'openingbalance' || entLower === 'openingbalances' || entLower === 'coabalance') {
        const accountCode = row.code ?? row.accountCode;
        if (!accountCode || String(accountCode).trim() === '') {
          errors.push({ row: rowNum, field: 'code', message: 'Account code is required' });
        }
        const debit = Number(row.debit ?? 0);
        const credit = Number(row.credit ?? 0);
        if (!Number.isFinite(debit) || !Number.isFinite(credit)) {
          errors.push({ row: rowNum, field: 'debit', message: 'debit/credit must be numeric' });
        } else if (debit < 0 || credit < 0) {
          errors.push({ row: rowNum, field: 'debit', message: 'debit/credit must not be negative' });
        } else if (debit === 0 && credit === 0) {
          errors.push({ row: rowNum, field: 'debit', message: 'Either debit or credit must be non-zero' });
        }
        if (row.date !== undefined && Number.isNaN(Date.parse(String(row.date)))) {
          errors.push({ row: rowNum, field: 'date', message: 'date must be a parseable date (YYYY-MM-DD)' });
        }
      } else if (entLower === 'openingstock' || entLower === 'openingstocks' || entLower === 'warehousestock') {
        const materialCode = row.code ?? row.materialCode;
        if (!materialCode || String(materialCode).trim() === '') {
          errors.push({ row: rowNum, field: 'code', message: 'Material code is required' });
        }
        const qty = Number(row.quantity ?? row.qty);
        if (!Number.isFinite(qty) || qty <= 0) {
          errors.push({ row: rowNum, field: 'quantity', message: 'quantity must be a positive number' });
        }
        if (row.expDate !== undefined && row.expDate !== '' && Number.isNaN(Date.parse(String(row.expDate)))) {
          errors.push({ row: rowNum, field: 'expDate', message: 'expDate must be a parseable date (YYYY-MM-DD)' });
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

    // ── Batch-internal duplicate codes ──
    // A batch listing the same code twice is ambiguous: `upsert` would silently
    // collapse it to one row and hide the client's keying error. Reject instead.
    const CODE_KEYED_ENTITIES = new Set([
      'unit', 'units', 'masterunit',
      'category', 'categories', 'mastercategory',
      'material', 'materials', 'materialitem', 'goods',
      'openingbalance', 'openingbalances', 'coabalance',
      'openingstock', 'openingstocks', 'warehousestock',
    ]);
    if (CODE_KEYED_ENTITIES.has(entLower)) {
      // Opening stock legitimately lists one material several times (once per
      // batch), so its identity is material + batch, not material alone.
      const openingStockEntities = new Set(['openingstock', 'openingstocks', 'warehousestock']);
      const firstSeenAt = new Map<string, number>();
      rows.forEach((row, idx) => {
        const raw = row?.code ?? row?.accountCode ?? row?.materialCode;
        if (raw === undefined || raw === null || String(raw).trim() === '') return;
        const codeKey = String(raw).trim().toUpperCase();
        const key = openingStockEntities.has(entLower)
          ? `${codeKey}::${String(row?.batchNumber ?? '').trim().toUpperCase()}`
          : codeKey;
        const first = firstSeenAt.get(key);
        if (first !== undefined) {
          errors.push({
            row: idx + 1,
            field: 'code',
            message: `DUPLICATE_CODE_IN_BATCH: code "${key}" already used on row ${first}`,
          });
        } else {
          firstSeenAt.set(key, idx + 1);
        }
      });
    }

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

    const isOpeningBalance =
      entLower === 'openingbalance' || entLower === 'openingbalances' || entLower === 'coabalance';
    const isOpeningStock =
      entLower === 'openingstock' || entLower === 'openingstocks' || entLower === 'warehousestock';

    // ── Reference validation: every referenced master must already exist ──
    // Runs before `dryRun` so a dry run is a real rehearsal, and before the
    // write transaction so an unmapped reference can never half-apply a batch.
    const accountIdByCode = new Map<string, string>();
    const materialByCode = new Map<string, { id: string }>();
    let openingBalanceDate = new Date();

    if (isOpeningBalance) {
      const codes = Array.from(
        new Set(rows.map((r) => String(r.code ?? r.accountCode ?? '').trim().toUpperCase()).filter(Boolean))
      );
      const found = await this.prisma.account.findMany({
        where: { code: { in: codes } },
        select: { id: true, code: true },
      });
      for (const acc of found) accountIdByCode.set(acc.code.toUpperCase(), acc.id);

      const missing = codes.filter((c) => !accountIdByCode.has(c));
      if (missing.length > 0) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'IMPORT_VALIDATION_FAILED',
          message: `COA_NOT_REGISTERED: ${missing.length} account code(s) are not registered in the chart of accounts`,
          totalRows: rows.length,
          errors: missing.map((c) => ({
            row: 0,
            field: 'code',
            message: `Account code ${c} is not registered in COA`,
          })),
        });
      }

      const totalDebit = rows.reduce((sum, r) => sum + Number(r.debit ?? 0), 0);
      const totalCredit = rows.reduce((sum, r) => sum + Number(r.credit ?? 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'IMPORT_VALIDATION_FAILED',
          message: `OPENING_BALANCE_UNBALANCED: total debit ${totalDebit} != total credit ${totalCredit}`,
          totalRows: rows.length,
          errors: [{ row: 0, field: 'batch', message: 'Opening balance batch must balance (debit == credit)' }],
        });
      }

      const rowDates = Array.from(
        new Set(rows.filter((r) => r.date !== undefined).map((r) => new Date(String(r.date)).toISOString().slice(0, 10)))
      );
      if (rowDates.length > 1) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'IMPORT_VALIDATION_FAILED',
          message: `OPENING_BALANCE_MIXED_DATES: batch spans ${rowDates.length} distinct dates; split it per date`,
          totalRows: rows.length,
          errors: [{ row: 0, field: 'date', message: `Distinct dates: ${rowDates.join(', ')}` }],
        });
      }
      if (rowDates.length === 1) openingBalanceDate = new Date(`${rowDates[0]}T00:00:00.000Z`);
    }

    if (isOpeningStock) {
      const codes = Array.from(
        new Set(rows.map((r) => String(r.code ?? r.materialCode ?? '').trim().toUpperCase()).filter(Boolean))
      );
      const found = await this.prisma.materialItem.findMany({
        where: { code: { in: codes } },
        select: { id: true, code: true },
      });
      for (const mat of found) {
        if (mat.code) materialByCode.set(mat.code.toUpperCase(), { id: mat.id });
      }

      const missing = codes.filter((c) => !materialByCode.has(c));
      if (missing.length > 0) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'IMPORT_VALIDATION_FAILED',
          message: `MATERIAL_NOT_REGISTERED: ${missing.length} material code(s) do not exist — import the master first`,
          totalRows: rows.length,
          errors: missing.map((c) => ({
            row: 0,
            field: 'code',
            message: `Material code ${c} is not registered`,
          })),
        });
      }
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
    // 10k-row batches run one upsert per row inside this transaction: the 5s
    // Prisma default would abort a legitimate master-data load mid-flight.
    return await this.prisma.$transaction(
      async (tx) => {
      if (options.idempotencyKey) {        const lockHash = createHash('sha256')
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

      const batchId = randomUUID();
      let importedCount = 0;
      // Opening balances land as ONE balanced journal for the whole batch, so
      // the lines accumulate here and the entry is written after the loop.
      const openingBalanceLines: Array<{ accountId: string; debit: number; credit: number }> = [];
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

          case 'openingbalance':
          case 'openingbalances':
          case 'coabalance': {
            const accountCode = String(row.code ?? row.accountCode ?? '').trim().toUpperCase();
            const accountId = accountIdByCode.get(accountCode);
            if (!accountId) {
              throw new BadRequestException(
                `VALIDATION_FAILED: Account code ${accountCode} was not resolved before the import transaction`
              );
            }
            openingBalanceLines.push({
              accountId,
              debit: Number(row.debit ?? 0),
              credit: Number(row.credit ?? 0),
            });
            break;
          }

          case 'openingstock':
          case 'openingstocks':
          case 'warehousestock': {
            const materialCode = String(row.code ?? row.materialCode ?? '').trim().toUpperCase();
            const material = materialByCode.get(materialCode);
            if (!material) {
              throw new BadRequestException(
                `VALIDATION_FAILED: Material code ${materialCode} was not resolved before the import transaction`
              );
            }
            const qty = Number(row.quantity ?? row.qty ?? 0);
            const unitPrice = Number(row.unitPrice ?? 0);

            let destLocId: string | null = null;
            if (row.warehouse) {
              const loc = await tx.warehouseLocation.findFirst({
                where: { name: String(row.warehouse).trim() },
                select: { id: true },
              });
              if (!loc) {
                throw new BadRequestException(
                  `VALIDATION_FAILED: Warehouse location "${row.warehouse}" does not exist`
                );
              }
              destLocId = loc.id;
            }

            // Legacy opening stock has no real supplier; park it on one canonical
            // system supplier so MaterialInventory.supplierId (NOT NULL) holds.
            const existingSupplier = await tx.supplier.findFirst({
              where: { name: OPENING_STOCK_SUPPLIER },
              select: { id: true },
            });
            const supplierId =
              existingSupplier?.id ??
              (await tx.supplier.create({ data: { name: OPENING_STOCK_SUPPLIER, contact: 'SYSTEM' } })).id;

            const inventory = await tx.materialInventory.create({
              data: {
                materialId: material.id,
                supplierId,
                batchNumber: String(row.batchNumber || `OPEN-${materialCode}-${batchId.slice(0, 8)}`),
                currentStock: qty,
                qcStatus: 'GOOD',
                receivingDate: openingBalanceDate,
                expDate: row.expDate ? new Date(String(row.expDate)) : null,
                notes: `OPENING STOCK IMPORT ${batchId}`,
              },
            });

            await tx.inventoryTransaction.create({
              data: {
                materialId: material.id,
                type: 'INBOUND',
                quantity: qty,
                referenceNo: String(row.referenceNo || `OPEN-${batchId.slice(0, 8)}`),
                notes: `OPENING STOCK IMPORT ${batchId}`,
                inventoryId: inventory.id,
                unitValueAtTransaction: unitPrice,
                actorId: options.actor!.id,
                destLocId,
              },
            });

            await tx.materialItem.update({
              where: { id: material.id },
              data: { stockQty: { increment: qty } },
            });
            break;
          }

          default:
            throw new BadRequestException('Unsupported entity for import: ' + entity);
        }
        importedCount++;
      }

      if (openingBalanceLines.length > 0) {
        // Pre-validated to balance (debit == credit, tolerance 0.01) before the
        // transaction opened; the PrismaService journal guard re-checks here.
        await tx.journalEntry.create({
          data: {
            date: openingBalanceDate,
            reference: `OPENING-BALANCE-${batchId.slice(0, 8)}`,
            description: `Opening balance import (${openingBalanceLines.length} lines) key=${options.idempotencyKey ?? batchId}`,
            sourceDocumentType: 'MANUAL',
            lines: { create: openingBalanceLines },
          },
        });
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
    },
      { maxWait: 60_000, timeout: 600_000 }
    );
  }
}
