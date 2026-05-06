const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const adminEmail = "admin@dreamlab.com";
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  console.log(`Resetting password for ${adminEmail}...`);
  
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { 
      passwordHash: hashedPassword,
      roles: ["SUPER_ADMIN"],
      status: "ACTIVE",
      deleted_at: null
    },
    create: {
      email: adminEmail,
      fullName: "Super Admin",
      passwordHash: hashedPassword,
      roles: ["SUPER_ADMIN"],
      status: "ACTIVE"
    },
  });

  console.log("✅ Admin Password Reset to: password123");
  console.log("✅ Admin Role set to: SUPER_ADMIN");
  console.log("✅ Admin Status set to: ACTIVE");
  
  process.exit();
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
