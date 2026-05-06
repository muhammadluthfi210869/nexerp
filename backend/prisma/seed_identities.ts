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
  console.log("Starting Identity Synchronization (Nisa & Diva)...");

  // 1. Ensure Admin exists
  const adminEmail = "admin@dreamlab.com";
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { roles: [UserRole.SUPER_ADMIN] },
    create: {
      email: adminEmail,
      fullName: "Super Admin",
      passwordHash: hashedPassword,
      roles: [UserRole.SUPER_ADMIN],
    },
  });
  console.log("✅ Admin Vector Synchronized");

  // 2. Setup Nisa
  const nisaEmail = "nisa@dreamlab.com";
  const nisaUser = await prisma.user.upsert({
    where: { email: nisaEmail },
    update: { roles: [UserRole.COMMERCIAL] },
    create: {
      email: nisaEmail,
      fullName: "Nisa",
      passwordHash: hashedPassword,
      roles: [UserRole.COMMERCIAL],
    },
  });

  const nisaStaff = await prisma.bussdevStaff.findFirst({ where: { name: "Nisa" } });
  if (!nisaStaff) {
    await prisma.bussdevStaff.create({
      data: { name: "Nisa", targetRevenue: 1000000000, userId: nisaUser.id },
    });
  } else {
    await prisma.bussdevStaff.update({
      where: { id: nisaStaff.id },
      data: { userId: nisaUser.id },
    });
  }
  console.log("✅ Nisa Identity Linked");

  // 3. Setup Diva
  const divaEmail = "diva@dreamlab.com";
  const divaUser = await prisma.user.upsert({
    where: { email: divaEmail },
    update: { roles: [UserRole.COMMERCIAL] },
    create: {
      email: divaEmail,
      fullName: "Diva",
      passwordHash: hashedPassword,
      roles: [UserRole.COMMERCIAL],
    },
  });

  const divaStaff = await prisma.bussdevStaff.findFirst({ where: { name: "Diva" } });
  if (!divaStaff) {
    await prisma.bussdevStaff.create({
      data: { name: "Diva", targetRevenue: 1000000000, userId: divaUser.id },
    });
  } else {
    await prisma.bussdevStaff.update({
      where: { id: divaStaff.id },
      data: { userId: divaUser.id },
    });
  }
  console.log("✅ Diva Identity Linked");

  console.log("Identity Synchronization Complete.");
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
