import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SYNCING BUSSDEV STAFF: DIVA & NISA ---');

  const staffsToCreate = [
    { name: 'DIVA', email: 'diva@dreamlab.id' },
    { name: 'NISA', email: 'nisa@dreamlab.id' },
  ];

  for (const staff of staffsToCreate) {
    // 1. Ensure User exists
    let user = await prisma.user.findFirst({
      where: { email: staff.email },
    });

    if (!user) {
      console.log(`Creating User: ${staff.name}`);
      user = await prisma.user.create({
        data: {
          email: staff.email,
          full_name: staff.name,
          username: staff.name.toLowerCase(),
          password: '$2b$10$EpjX0Z.6.6.6.6.6.6.6.6.6.6.6.6.6.6.6.6.6.6.6.6', // dummy hashed password
          roles: ['COMMERCIAL'],
        },
      });
    }

    // 2. Ensure BussdevStaff exists and is linked
    let bStaff = await prisma.bussdevStaff.findFirst({
      where: { userId: user.id },
    });

    if (!bStaff) {
      console.log(`Creating BussdevStaff record for: ${staff.name}`);
      await prisma.bussdevStaff.create({
        data: {
          name: staff.name,
          userId: user.id,
          targetRevenue: 1000000000,
          isActive: true,
        },
      });
    } else {
      console.log(`BussdevStaff already exists for: ${staff.name}`);
      // Update name if mismatch
      await prisma.bussdevStaff.update({
        where: { id: bStaff.id },
        data: { name: staff.name, isActive: true },
      });
    }
  }

  console.log('--- SYNC COMPLETED ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
