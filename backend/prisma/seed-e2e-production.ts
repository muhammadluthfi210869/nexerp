// @ts-nocheck
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MACHINE_UUIDS = {
  mixing: '6b092e06-4ab7-4010-96cc-5d88434d72f2',
  filling: 'c43bd370-bad8-47f9-9084-21c06c8fac01',
  packing: '50853b07-1b46-4db8-aa10-7a39ed734139',
};

const MATERIAL_UUIDS = {
  raw: 'dfd12732-8359-4949-a966-748168536336',
  bulk: '0d4a4c78-ae40-47e9-b64d-0e9aaabeea9f',
  primer: '7c577495-bf03-4065-a5fd-d01c8be50276',
  sekunder: 'b8c9d10e-1234-5678-90ab-cdef01234567',
};

async function main() {
  console.log('🌱 E2E Seed: Production Data\n');

  // 1. Machines
  const machines = [
    { id: MACHINE_UUIDS.mixing, name: 'E2E Mixer A1', type: 'MIXING_MACHINE', capacity: 500, cost: 75000 },
    { id: MACHINE_UUIDS.filling, name: 'E2E Filler X2', type: 'FILLING_MACHINE', capacity: 1000, cost: 120000 },
    { id: MACHINE_UUIDS.packing, name: 'E2E Packer P9', type: 'PACKING_MACHINE', capacity: 200, cost: 50000 },
  ];
  for (const m of machines) {
    await prisma.machine.upsert({
      where: { id: m.id },
      update: {},
      create: { id: m.id, name: m.name, type: m.type as any, capacityPerBatch: m.capacity, isActive: true, costPerHour: m.cost },
    });
    console.log(`✅ Machine: ${m.name} (${m.id})`);
  }

  // 2. Materials
  const materials = [
    { id: MATERIAL_UUIDS.raw, name: 'Dimethicone E2E', code: 'DIM-E2E', unit: 'kg', stock: 1000, price: 15000 },
    { id: MATERIAL_UUIDS.bulk, name: 'Bulk Serum E2E', code: 'BULK-E2E', unit: 'kg', stock: 500, price: 45000 },
    { id: MATERIAL_UUIDS.primer, name: 'Botol 100ml E2E', code: 'BTL-E2E', unit: 'pcs', stock: 2000, price: 2500 },
    { id: MATERIAL_UUIDS.sekunder, name: 'Kardus Box E2E', code: 'KRDS-E2E', unit: 'pcs', stock: 1000, price: 1500 },
  ];
  for (const m of materials) {
    await prisma.materialItem.upsert({
      where: { id: m.id },
      update: {},
      create: { id: m.id, name: m.name, code: m.code, unit: m.unit, stockQty: m.stock, unitPrice: m.price, type: 'RAW_MATERIAL', minLevel: 0, maxLevel: 99999, reorderPoint: 10 },
    });
    console.log(`✅ Material: ${m.name} (${m.id})`);
  }

  // 3. Set supervisor PIN on existing user
  const user = await prisma.user.findFirst({ where: { roles: { hasSome: ['SUPER_ADMIN', 'PRODUCTION'] } } });
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { managerPin: '123456' } });
    console.log(`✅ PIN set: ${user.fullName} (${user.id})`);
  }

  console.log('\n✅ Seed complete!');
  console.log(JSON.stringify({ machines: MACHINE_UUIDS, materials: MATERIAL_UUIDS, leadId: 'df0fefaf-2398-470f-b86c-31b018f30e86' }));
}

main().catch(console.error).finally(() => prisma.$disconnect());
