// @ts-nocheck
import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { seedPersonnel } from './seeders/personnel.seeder';
import { seedKpiMetrics } from './seeders/kpi-metrics.seeder';
import { seedKpiScores } from './seeders/kpi-scores.seeder';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 RESETTING DATABASE...');
  
  // Cleanup
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    kpi_point_logs, kpi_scores, attendances, payroll_items, payrolls,
    employee_role_mappings, employees, sales_order_items, sales_orders,
    inventory_transactions, material_inventories, inbound_items, warehouse_inbounds,
    purchase_order_items, purchase_orders, bill_of_materials, work_orders,
    production_step_logs, production_schedules, production_plans,
    sample_stage_logs, sample_feedback, sample_revisions, sample_requests,
    sales_leads, bussdev_staffs, lost_deals, lead_activities, lead_timeline_logs,
    material_items, suppliers, users, financial_periods,
    kpi_metric_definitions, accounts, master_categories, account_health_logs,
    activity_streams, articles, artwork_reviews, audit_escalations, content_assets,
    copq_records, daily_ads_metrics, delivery_orders, design_feedbacks, design_tasks,
    design_versions, finished_goods, formula_items, formula_phases, formulas,
    fund_requests, guest_logs, hki_records, internal_audits, journal_entries,
    journal_lines, lab_test_results, labor_rates, legal_staffs, legal_timeline_logs,
    machines, marketing_targets, new_product_forms, payments, pnbp_requests,
    production_logs, purchase_request_items, purchase_requests, 
    qc_audits, qc_parameters, regulatory_pipelines, reject_executions,
    material_requisitions, material_valuations,
    retention_engine, sales_return_items, sales_returns, sales_targets,
    shipment_items, shipments,
    stock_adjustment_items, stock_adjustments, stock_opname_items, stock_opnames,
    system_configs, system_override_logs, tickets, transfer_order_items,
    transfer_orders, unified_invoices, warehouse_locations, warehouses, website_products,
    work_orders
  RESTART IDENTITY CASCADE`);

  console.log('');
  console.log('🌱 FASE 1: Seeding Personnel (24 Real Users)...');
  await seedPersonnel(prisma);

  console.log('');
  console.log('🌱 FASE 2: Seeding KPI Metric Definitions...');
  await seedKpiMetrics(prisma);

  console.log('');
  console.log('🌱 FASE 3: Seeding KPI Scores & Attendance...');
  await seedKpiScores(prisma);

  console.log('');
  console.log('🌱 FASE 4: Syncing Bussdev Staff...');
  const marketingUsers = await prisma.user.findMany({
    where: { roles: { hasSome: [UserRole.MARKETING, UserRole.COMMERCIAL, UserRole.SUPER_ADMIN] } },
  });
  for (const user of marketingUsers) {
    const existing = await prisma.bussdevStaff.findUnique({ where: { userId: user.id } });
    if (!existing) {
      await prisma.bussdevStaff.create({
        data: {
          userId: user.id,
          name: user.fullName || user.email,
          targetRevenue: 1000000000,
          isActive: true,
        },
      });
      console.log(`  ✅ Bussdev Staff: ${user.fullName}`);
    }
  }

  console.log('');
  console.log('💎 SEEDING COMPLETE.');
  console.log('   🔐 Password untuk semua akun: password123');
  console.log('   📧 Format email: nama@dreamlab.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
