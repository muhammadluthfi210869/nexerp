import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 SEEDING R&D TEST DATA...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create RND User
  const rndUser = await prisma.user.upsert({
    where: { email: 'rnd@dreamlab.com' },
    update: { 
      passwordHash: hashedPassword, 
      roles: [UserRole.RND] 
    },
    create: {
      email: 'rnd@dreamlab.com',
      fullName: 'Staf Laboratorium R&D',
      passwordHash: hashedPassword,
      roles: [UserRole.RND],
      status: 'ACTIVE',
    },
  });
  console.log(`✅ RND User Created: ${rndUser.email}`);

  // 2. Create RndStaff (The operational staff in workbench)
  const staffs = [
    { name: 'Dr. Amelia', specialty: 'Skincare', isActive: true },
    { name: 'Apoteker Rudy', specialty: 'Bodycare', isActive: true },
    { name: 'Siska (Formulator)', specialty: 'Cosmetics', isActive: true },
  ];

  for (const staff of staffs) {
    await prisma.rndStaff.upsert({
      where: { id: 'dummy' }, // We use findFirst or name for simplicity in seed
      update: staff,
      create: staff,
    }).catch(async () => {
        // Since we don't have unique on name, let's just create if not exists
        const exists = await prisma.rndStaff.findFirst({ where: { name: staff.name } });
        if (!exists) {
            await prisma.rndStaff.create({ data: staff });
        }
    });
    console.log(`✅ R&D Staff Synchronized: ${staff.name}`);
  }

  console.log('📊 R&D SEEDING COMPLETE');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
