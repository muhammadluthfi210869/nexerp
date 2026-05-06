const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('--- SYNCING BUSSDEV STAFF (JS VERSION) ---');

  const staffsToCreate = [
    { name: 'DIVA', email: 'diva@dreamlab.id' },
    { name: 'NISA', email: 'nisa@dreamlab.id' },
  ];

  for (const staff of staffsToCreate) {
    let user = await prisma.user.findFirst({
      where: { email: staff.email },
    });

    if (!user) {
      console.log(`Creating User: ${staff.name}`);
      user = await prisma.user.create({
        data: {
          id: undefined, // Let prisma handle UUID
          email: staff.email,
          full_name: staff.name,
          username: staff.name.toLowerCase(),
          password: 'hashed_password_here',
          roles: ['COMMERCIAL'],
        },
      });
    }

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
