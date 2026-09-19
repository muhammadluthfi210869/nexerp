import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

export interface ImportOptions {
  dryRun?: boolean;
  tenantId?: string;
  userId?: string;
}

export interface ExportOptions {
  tenantId?: string;
  format?: 'csv' | 'json';
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  dryRun: boolean;
  errors: Array<{ row: number; field?: string; message: string }>;
}

@Injectable()
export class ImportExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Neutralizes formula injection vulnerabilities (CSV/Excel)
   * Cells starting with =, +, -, @ are prepended with a single quote '
   */
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

  async exportData(entity: string, filter: Record<string, any> = {}, options: ExportOptions = {}) {
    const limit = Number(filter?.limit) || 50;
    const safeLimit = Math.min(limit, 200);
    const page = Math.max(1, Number(filter?.page) || 1);
    const skip = (page - 1) * safeLimit;

    const where: Record<string, any> = { ...(filter?.where || {}) };
    if (options.tenantId) {
      where.tenantId = options.tenantId;
    }

    let records: any[] = [];
    switch (entity.toLowerCase()) {
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
      case 'masterwarehouse':
        records = await this.prisma.masterWarehouse.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { code: 'asc' },
        });
        break;
      case 'supplier':
      case 'suppliers':
      case 'mastersupplier':
        records = await this.prisma.masterSupplier.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: { code: 'asc' },
        });
        break;
      default:
        throw new BadRequestException('Unsupported entity for export: ' + entity);
    }

    return records.map((r) => this.sanitizeExportRow(r));
  }

  async importData(entity: string, rows: Record<string, any>[], options: ImportOptions = {}): Promise<ImportResult> {
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        success: true,
        totalRows: 0,
        importedRows: 0,
        dryRun: !!options.dryRun,
        errors: [],
      };
    }

    const errors: Array<{ row: number; field?: string; message: string }> = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      if (!row || typeof row !== 'object') {
        errors.push({ row: rowNum, message: 'Row must be a valid object' });
        return;
      }
      if (!row.code || typeof row.code !== 'string' || row.code.trim() === '') {
        errors.push({ row: rowNum, field: 'code', message: 'Code is required' });
      }
      if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
        errors.push({ row: rowNum, field: 'name', message: 'Name is required' });
      }
    });

    if (errors.length > 0) {
      return {
        success: false,
        totalRows: rows.length,
        importedRows: 0,
        dryRun: !!options.dryRun,
        errors,
      };
    }

    if (options.dryRun) {
      return {
        success: true,
        totalRows: rows.length,
        importedRows: rows.length,
        dryRun: true,
        errors: [],
      };
    }

    return this.prisma.$transaction(async (tx) => {
      let importedCount = 0;
      for (const row of rows) {
        const code = String(row.code).trim().toUpperCase();
        const name = String(row.name).trim();

        switch (entity.toLowerCase()) {
          case 'unit':
          case 'units':
          case 'masterunit':
            await tx.masterUnit.upsert({
              where: { code },
              update: { name, symbol: row.symbol ?? null, description: row.description ?? null },
              create: { code, name, symbol: row.symbol ?? null, description: row.description ?? null },
            });
            break;
          case 'category':
          case 'categories':
          case 'mastercategory':
            await tx.masterCategory.upsert({
              where: { code },
              update: { name, description: row.description ?? null },
              create: { code, name, description: row.description ?? null },
            });
            break;
          default:
            throw new BadRequestException('Unsupported entity for import: ' + entity);
        }
        importedCount++;
      }

      return {
        success: true,
        totalRows: rows.length,
        importedRows: importedCount,
        dryRun: false,
        errors: [],
      };
    });
  }
}
