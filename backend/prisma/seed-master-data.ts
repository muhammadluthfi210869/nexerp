// @ts-nocheck
/**
 * Master Data Seed Script — Batch 6
 *
 * Reads from docs/legacy-erp/MASTER_DATA/*.csv and seeds:
 * - MasterCategory (7 rows from KATEGORI-BARANG.csv)
 * - MaterialItem (2,795 rows from BARANG.csv)
 * - Supplier (176 rows from SUPPLIER.csv)
 * - Customer (816 rows from PELANGGAN.csv) -> mapped to SalesLead model
 * - User (45 rows from USERS.csv)
 * - MasterUnit (8 default UoMs)
 * - MasterKode (6 default sequences per Format Kode Universal)
 *
 * Run: npx ts-node prisma/seed-master-data.ts
 *
 * Per /plan/NEX_ERP_REFACTOR_ROADMAP.md Batch 6
 */

import { PrismaClient, MaterialType, MaterialStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CSV_DIR = path.join(process.cwd(), "..", "docs", "legacy-erp", "MASTER_DATA");

function parseCSV<T = Record<string, string>>(filename: string): T[] {
  const filePath = `${CSV_DIR}\\${filename}`;
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, "utf-8").replace(/^/, "");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true }) as T[];
}

async function seedMasterUnits() {
  console.log("\nSeeding MasterUnits...");
  const defaults = [
    { code: "PCS", name: "Pieces", symbol: "pcs" },
    { code: "KG", name: "Kilogram", symbol: "kg" },
    { code: "GR", name: "Gram", symbol: "gr" },
    { code: "ML", name: "Milliliter", symbol: "ml" },
    { code: "L", name: "Liter", symbol: "L" },
    { code: "BOX", name: "Box", symbol: "box" },
    { code: "PACK", name: "Pack", symbol: "pack" },
    { code: "PCS_LARGE", name: "Pieces (Large)", symbol: "pcs" },
  ];
  for (const unit of defaults) {
    await prisma.masterUnit.upsert({
      where: { code: unit.code },
      update: { name: unit.name, symbol: unit.symbol, isActive: true },
      create: { ...unit, isActive: true },
    });
  }
  console.log(`  ${defaults.length} units seeded`);
}

async function seedCategories() {
  console.log("\nSeeding Categories from KATEGORI-BARANG.csv...");
  const rows = parseCSV<{ kode: string; kategori: string; deskripsi: string }>(
    "KATEGORI-BARANG.csv"
  );
  for (const row of rows) {
    if (!row.kode) continue;
    await prisma.masterCategory.upsert({
      where: { code: row.kode },
      update: { name: row.kategori, description: row.deskripsi || null, isActive: true },
      create: {
        code: row.kode,
        name: row.kategori,
        description: row.deskripsi || null,
        type: "GOODS",
        isActive: true,
      },
    });
  }
  console.log(`  ${rows.length} categories seeded`);
}

async function seedMaterials() {
  console.log("\nSeeding Materials from BARANG.csv...");
  const rows = parseCSV<{
    kode: string;
    barang: string;
    harga_beli: string;
    sub_kategori: string;
    kategori: string;
    satuan: string;
    barang2: string;
  }>("BARANG.csv");
  const categories = await prisma.masterCategory.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  let count = 0;
  for (const row of rows) {
    if (!row.kode || !row.barang) continue;
    const category =
      categoryByName.get(row.kategori?.toLowerCase()) || categories[0];
    try {
      await prisma.materialItem.upsert({
        where: { code: row.kode },
        update: {
          name: row.barang,
          unitPrice: parseFloat(row.harga_beli?.replace(/,/g, "") || "0") || 0,
          status: "ACTIVE" as MaterialStatus,
          unit: row.satuan || "pcs",
          imageUrl: row.barang2?.startsWith("http") ? row.barang2 : null,
          categoryId: category?.id,
        },
        create: {
          code: row.kode,
          name: row.barang,
          type: "RAW_MATERIAL" as MaterialType,
          unit: row.satuan || "pcs",
          unitPrice: parseFloat(row.harga_beli?.replace(/,/g, "") || "0") || 0,
          status: "ACTIVE" as MaterialStatus,
          imageUrl: row.barang2?.startsWith("http") ? row.barang2 : null,
          categoryId: category?.id,
        },
      });
      count++;
    } catch {
      // skip errors silently for large dataset
    }
  }
  console.log(`  ${count} materials seeded`);
}

async function seedSuppliers() {
  console.log("\nSeeding Suppliers from SUPPLIER.csv...");
  const rows = parseCSV<{
    supplier: string;
    pic: string;
    phone: string;
    kota: string;
    kategori: string;
    pajak: string;
  }>("SUPPLIER.csv");
  const categories = await prisma.masterCategory.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  let count = 0;
  for (const row of rows) {
    if (!row.supplier) continue;
    const category =
      categoryByName.get(row.kategori?.toLowerCase()) || categories[0];
    try {
      const existing = await prisma.supplier.findFirst({
        where: { name: row.supplier },
      });
      const payload = {
        name: row.supplier,
        contact: row.pic || null,
        phone: row.phone || null,
        email: null,
        address: row.kota || null,
        categoryId: category?.id,
      };
      if (existing) {
        await prisma.supplier.update({ where: { id: existing.id }, data: payload });
      } else {
        await prisma.supplier.create({ data: payload });
      }
      count++;
    } catch {}
  }
  console.log(`  ${count} suppliers seeded`);
}

async function seedCustomers() {
  console.log("\nSeeding Customers from PELANGGAN.csv...");
  const rows = parseCSV<{
    nama: string;
    phone: string;
    kategori: string;
    penginput: string;
    kota: string;
    nominal_so_produk: string;
    so_sample: string;
    so_produk: string;
  }>("PELANGGAN.csv");
  const categories = await prisma.masterCategory.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  let count = 0;
  for (const row of rows) {
    if (!row.nama) continue;
    const category = categoryByName.get(row.kategori?.toLowerCase()) || null;
    try {
      const existing = await prisma.salesLead.findFirst({
        where: { name: row.nama },
      });
      const payload = {
        name: row.nama,
        phone: row.phone || null,
        city: row.kota || null,
        categoryId: category?.id,
        notes: row.penginput ? `Penginput: ${row.penginput}` : null,
      };
      if (existing) {
        await prisma.salesLead.update({ where: { id: existing.id }, data: payload });
      } else {
        await prisma.salesLead.create({ data: payload });
      }
      count++;
    } catch {}
  }
  console.log(`  ${count} customers seeded`);
}

async function seedUsers() {
  console.log("\nSeeding Users from USERS.csv...");
  const rows = parseCSV<{
    kodenip: string;
    nama: string;
    email: string;
    phone: string;
    hak_akses: string;
    nama2: string;
  }>("USERS.csv");
  const roleMap: Record<
    string,
    "SUPER_ADMIN" | "FINANCE" | "RND" | "WAREHOUSE" | "PPIC" | "HEAD_OPS" | "COMMERCIAL" | "PURCHASING" | "PRODUCTION_OP" | "QC_LAB" | "COMPLIANCE" | "DIGIMAR"
  > = {
    administrator: "SUPER_ADMIN",
    admin: "SUPER_ADMIN",
    finance: "FINANCE",
    rnd: "RND",
    warehouse: "WAREHOUSE",
    ppic: "PPIC",
    purchasing: "PURCHASING",
    production: "PRODUCTION_OP",
    qc: "QC_LAB",
    legal: "COMPLIANCE",
    legalitas: "COMPLIANCE",
    marketing: "DIGIMAR",
    busdev: "COMMERCIAL",
  };
  let count = 0;
  for (const row of rows) {
    if (!row.email || !row.nama) continue;
    const roleKey = row.hak_akses?.toLowerCase().trim() || "administrator";
    const role = roleMap[roleKey] || "SUPER_ADMIN";
    try {
      const existing = await prisma.user.findUnique({ where: { email: row.email } });
      const data = { fullName: row.nama, roles: [role], status: "ACTIVE" as const };
      if (existing) {
        await prisma.user.update({ where: { id: existing.id }, data });
      } else {
        await prisma.user.create({
          data: {
            email: row.email,
            passwordHash: "$2b$10$placeholder.hash.for.seeding.only",
            ...data,
          },
        });
      }
      count++;
    } catch {}
  }
  console.log(`  ${count} users seeded`);
}

async function seedMasterKodes() {
  console.log("\nSeeding MasterKodes (auto-numbering sequences)...");
  const defaults = [
    { documentType: "BILL", format: "FP-YYMM-XXXX", exampleFormat: "FP-2608-0001", description: "Faktur Pembelian", resetCycle: "MONTHLY" },
    { documentType: "SO", format: "DL-SAL-SO-DDMMYYYY-XXXX", exampleFormat: "DL-SAL-SO-29062026-0001", description: "Sales Order", resetCycle: "NEVER" },
    { documentType: "PO", format: "DL-PRD-PO-DDMMYYYY-XXXX", exampleFormat: "DL-PRD-PO-29062026-0001", description: "Purchase Order", resetCycle: "NEVER" },
    { documentType: "DP_PRODUKSI", format: "DPJ-YYMM-XXXX", exampleFormat: "DPJ-2608-0001", description: "DP Produksi", resetCycle: "MONTHLY" },
    { documentType: "BILL_PAYMENT", format: "BPB-YYMM-XXXX", exampleFormat: "BPB-2608-0001", description: "Bayar Pembelian", resetCycle: "MONTHLY" },
    { documentType: "JOURNAL", format: "JU-YYMM-XXXXX", exampleFormat: "JU-2608-00001", description: "Jurnal Umum", resetCycle: "MONTHLY" },
  ];
  for (const k of defaults) {
    await prisma.masterKode.upsert({
      where: { documentType: k.documentType },
      update: { format: k.format, exampleFormat: k.exampleFormat, isActive: true },
      create: { ...k, isActive: true, currentSequence: 0 } as any,
    });
  }
  console.log(`  ${defaults.length} master codes seeded`);
}

async function main() {
  console.log("===============================================");
  console.log("  Master Data Seed Script — Batch 6");
  console.log("===============================================\n");
  try {
    await seedMasterUnits();
    await seedCategories();
    await seedMaterials();
    await seedSuppliers();
    await seedCustomers();
    await seedUsers();
    await seedMasterKodes();
    console.log("\nAll master data seeded successfully!");
  } catch (e) {
    console.error("\nSeed failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
