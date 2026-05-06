import { PrismaClient, UserRole, UserStatus, Division, ContractType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const defaultPassword = 'DreamLab2024!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const p = { name: 'Yaya', email: 'yaya@dreamlab.com', roles: [UserRole.RND], division: Division.RND, position: 'R&D Staff' };

  console.log(`🚀 Adding ${p.name} to R&D...`);

  try {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        fullName: p.name,
        roles: p.roles,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: p.email,
        fullName: p.name,
        passwordHash: hashedPassword,
        roles: p.roles,
        status: UserStatus.ACTIVE,
      },
    });

    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {
        name: p.name,
        isActive: true,
      },
      create: {
        userId: user.id,
        name: p.name,
        joinedAt: new Date(),
        contractType: ContractType.PERMANENT,
        isActive: true,
      },
    });

    // Assign roles in mapping
    await prisma.employeeRoleMapping.deleteMany({
      where: { employeeId: employee.id }
    });

    await prisma.employeeRoleMapping.create({
      data: {
        employeeId: employee.id,
        division: p.division,
        roleName: p.position,
        weight: 1.0,
        isPrimary: true,
      }
    });

    console.log(`✅ Created user: ${user.email} (${p.position})`);
  } catch (error) {
    console.error(`❌ Failed to create user ${p.email}:`, error);
  }

  console.log('✨ Task Completed!');
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
