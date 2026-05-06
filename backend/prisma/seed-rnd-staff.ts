import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding R&D Staff...');

  const staff = [
    { name: 'Amira', role: 'HEAD_RND' },
    { name: 'Panca', role: 'ASSISTANT_RND' },
    { name: 'Yaya', role: 'RND_STAFF' },
  ];

  for (const s of staff) {
    const exists = await prisma.rndStaff.findFirst({
      where: { name: s.name }
    });

    if (!exists) {
      await prisma.rndStaff.create({
        data: {
          name: s.name,
          specialty: s.role,
          isActive: true
        }
      });
      console.log(`Created staff: ${s.name}`);
    } else {
      console.log(`Staff already exists: ${s.name}`);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
