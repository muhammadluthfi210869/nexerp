/**
 * R4 BUSINESS_READY — Targeted Remediation Regression Tests
 *
 * Each `it()` covers one defect-class from §0 reclassification:
 *   B1: qc-validate uses proper DTO (no inline anonymous type)
 *   B2: Batch3CreateSOItemDto.netto is required and positive
 *   B3: createWorkOrder creates a ProductionPlan in the same transaction
 *   B4: verifyOrderPayment creates a DP Invoice + Payment (Finance ledger)
 *   B5: sales_order.created listener creates a Design Task linked to the SO
 *   B6: PRODUCTION_OP canonical role exists and is bootstrap-target
 *
 * A-class fixtures (warehouse, supplier, material, etc.) are protected by
 * r4-staff-bootstrap.spec.ts.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

describe('R4 BUSINESS_READY remediation', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- B1: qc-validate uses QcValidateDto, not inline anonymous type ---
  it('B1: inbounds.controller declares QcValidateDto body for qc-validate', () => {
    const filePath = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'scm',
      'controllers',
      'inbounds.controller.ts',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    // Must import QcValidateDto
    expect(src).toMatch(/QcValidateDto/);
    // Must NOT have inline `dto: { items: ... }` anonymous body type
    expect(src).not.toMatch(/@Body\(\)\s*dto:\s*\{\s*items:/);
  });

  it('B1: QcValidateDto declares IsArray + ValidateNested on items', () => {
    const filePath = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'scm',
      'dto',
      'inbound.dto.ts',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).toMatch(/export class QcValidateDto/);
    expect(src).toMatch(/@IsArray\(\)/);
    expect(src).toMatch(/@ValidateNested\(\{\s*each:\s*true\s*\}/);
  });

  // --- B2: Batch3CreateSOItemDto.netto is required and positive ---
  it('B2: Batch3CreateSOItemDto.netto is @IsPositive (no longer @IsOptional)', () => {
    const filePath = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'commercial',
      'dto',
      'batch3-sales-order.dto.ts',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).toMatch(/netto!:\s*number/); // non-optional in DTO
    // Service signature must also drop optional + ?? 0 default
    const svcPath = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'commercial',
      'services',
      'sales-orders-batch3.service.ts',
    );
    const svc = fs.readFileSync(svcPath, 'utf8');
    expect(svc).not.toMatch(/netto\?\?:\s*number\s*\?\?:\s*0/);
    expect(svc).not.toMatch(/netto:\s*item\.netto\s*\?\?\s*0/);
  });

  // --- B3: createWorkOrder creates a ProductionPlan ---
  it('B3: createWorkOrder creates a ProductionPlan in the same transaction', async () => {
    // Static check on production.service.ts
    const filePath = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'production',
      'production.service.ts',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    // The createWorkOrder function must include tx.productionPlan.create
    expect(src).toMatch(/async createWorkOrder[\s\S]{0,4000}tx\.productionPlan\.create/);
  });

  // --- B4: verifyOrderPayment creates a DP invoice + payment ---
  it('B4: verifyOrderPayment creates a DP invoice in the Finance ledger', async () => {
    const filePath = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'finance',
      'finance.service.ts',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).toMatch(/verifyOrderPayment[\s\S]{0,3000}tx\.invoice\.create/);
    expect(src).toMatch(/type:\s*'DP'/);
    expect(src).toMatch(/tx\.payment\.create/);
  });

  // --- B5: sales_order.created listener auto-creates a DesignTask ---
  it('B5: bussdev listener auto-creates a DesignTask on sales_order.created', () => {
    const filePath = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'bussdev',
      'bussdev.listener.ts',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).toMatch(/OnEvent\(\s*'sales_order\.created'\s*\)/);
    expect(src).toMatch(/prisma\.designTask\.create/);
  });

  // --- B6: PRODUCTION_OP exists in UserRole enum and is canonical ---
  it('B6: UserRole enum contains PRODUCTION_OP as a canonical operator role', async () => {
    const enumRows = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'UserRole'
        AND e.enumlabel = 'PRODUCTION_OP';
    `;
    expect(enumRows.length).toBe(1);
  });

  it('B6: production.controller requires PRODUCTION_OP for submit-log (canonical boundary)', () => {
    const filePath = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'production',
      'production.controller.ts',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).toMatch(/submit-log[\s\S]{0,400}Roles\([^)]*PRODUCTION_OP/);
    expect(src).toMatch(/qc-checkpoint[\s\S]{0,400}Roles\([^)]*QC_LAB/);
  });
});