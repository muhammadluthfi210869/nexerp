import { PrismaClient, MachineType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Machines...');
  
  const machines = [
    { name: 'Mixer Industrial A1', type: 'MIXING_MACHINE', capacityPerBatch: 500 },
    { name: 'Mixer High-Shear B2', type: 'MIXING_MACHINE', capacityPerBatch: 250 },
    { name: 'Filling Line X2 (Liquid)', type: 'FILLING_MACHINE', capacityPerBatch: 1000 },
    { name: 'Rotary Filler R5', type: 'FILLING_MACHINE', capacityPerBatch: 800 },
    { name: 'Automatic Packer P9', type: 'PACKING_MACHINE', capacityPerBatch: 200 },
    { name: 'Heat Shrink Tunnel T3', type: 'PACKING_MACHINE', capacityPerBatch: 400 },
  ];

  for (const m of machines) {
    await prisma.machine.upsert({
      where: { id: '00000000-0000-0000-0000-000000000000' }, // Dummy for unique check if no unique field
      update: {},
      create: {
        name: m.name,
        type: m.type as any,
        capacityPerBatch: m.capacityPerBatch,
        isActive: true,
      }
    });
    console.log(`✅ Machine Added: ${m.name}`);
  }

  console.log('✨ Seeding Completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
