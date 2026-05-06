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

  const personnel = [
    { name: 'Zaki', email: 'zaki@dreamlab.com', roles: [UserRole.SUPER_ADMIN], division: Division.MANAGEMENT, position: 'Direktur Utama' },
    { name: 'Fadhilah', email: 'fadhilah@dreamlab.com', roles: [UserRole.HEAD_OPS, UserRole.MARKETING], division: Division.MANAGEMENT, position: 'Head Operasional Pemasaran' },
    { name: 'Bagir', email: 'bagir@dreamlab.com', roles: [UserRole.HEAD_OPS, UserRole.PRODUCTION, UserRole.PURCHASING, UserRole.SCM], division: Division.MANAGEMENT, position: 'Head Operasional Manufacture' },
    { name: 'Irma', email: 'irma@dreamlab.com', roles: [UserRole.FINANCE, UserRole.PURCHASING], division: Division.FINANCE, position: 'Bendahara & Purchasing' },
    { name: 'Tika', email: 'tika@dreamlab.com', roles: [UserRole.FINANCE, UserRole.ADMIN], division: Division.FINANCE, position: 'Accounting & Admin' },
    { name: 'Salsa', email: 'salsa@dreamlab.com', roles: [UserRole.ADMIN], division: Division.MANAGEMENT, position: 'Sekretaris' },
    { name: 'Amira', email: 'amira@dreamlab.com', roles: [UserRole.COMPLIANCE, UserRole.RND], division: Division.RND, position: 'Penyelia Halal & Head R&D' },
    { name: 'Ciptaning', email: 'ciptaning@dreamlab.com', roles: [UserRole.APJ, UserRole.COMPLIANCE], division: Division.LEGAL, position: 'Legal (APJ / QA)' },
    { name: 'Yulia', email: 'yulia@dreamlab.com', roles: [UserRole.HR], division: Division.LEGAL, position: 'Manager HR & Legal' },
    { name: 'Diaz', email: 'diaz@dreamlab.com', roles: [UserRole.HR, UserRole.MARKETING], division: Division.LEGAL, position: 'Asst HR, Legal & Tracking Klien' },
    { name: 'Bagus', email: 'bagus@dreamlab.com', roles: [UserRole.IT_SYS], division: Division.SYSTEM, position: 'System & Web' },
    { name: 'Revita', email: 'revita@dreamlab.com', roles: [UserRole.DIGIMAR], division: Division.CREATIVE, position: 'Digital Marketing Strategy' },
    { name: 'Gusti', email: 'gusti@dreamlab.com', roles: [UserRole.DIGIMAR], division: Division.CREATIVE, position: 'Graphic Designer' },
    { name: 'Zarkasi', email: 'zarkasi@dreamlab.com', roles: [UserRole.DIGIMAR], division: Division.CREATIVE, position: 'Video Editor' },
    { name: 'Nisa', email: 'nisa@dreamlab.com', roles: [UserRole.MARKETING], division: Division.BD, position: 'Marketing' },
    { name: 'Diva', email: 'diva@dreamlab.com', roles: [UserRole.MARKETING], division: Division.BD, position: 'Marketing' },
    { name: 'Edi', email: 'edi@dreamlab.com', roles: [UserRole.RND], division: Division.RND, position: 'Packaging Specialist' },
    { name: 'Panca', email: 'panca@dreamlab.com', roles: [UserRole.RND], division: Division.RND, position: 'Asst R&D' },
    { name: 'RND Staff 1', email: 'rnd_staff1@dreamlab.com', roles: [UserRole.RND], division: Division.RND, position: 'R&D Staff' },
    { name: 'Muhammad', email: 'muhammad@dreamlab.com', roles: [UserRole.PRODUCTION], division: Division.PRODUCTION, position: 'Head Production' },
    { name: 'Lila', email: 'lila@dreamlab.com', roles: [UserRole.ADMIN, UserRole.PRODUCTION], division: Division.PRODUCTION, position: 'Admin Pabrik' },
    { name: 'Hasyim', email: 'hasyim@dreamlab.com', roles: [UserRole.PRODUCTION_OP], division: Division.PRODUCTION, position: 'Operator Sanitasi' },
    { name: 'Agus', email: 'agus@dreamlab.com', roles: [UserRole.PRODUCTION_OP], division: Division.PRODUCTION, position: 'Operator' },
    { name: 'Operator 2', email: 'operator2@dreamlab.com', roles: [UserRole.PRODUCTION_OP], division: Division.PRODUCTION, position: 'Operator' },
    { name: 'Makhmud', email: 'makhmud@dreamlab.com', roles: [UserRole.PRODUCTION_OP], division: Division.PRODUCTION, position: 'Operator' },
    { name: 'Ribut', email: 'ribut@dreamlab.com', roles: [UserRole.QC_LAB], division: Division.QC, position: 'Captain QC' },
    { name: 'Rudi', email: 'rudi@dreamlab.com', roles: [UserRole.PRODUCTION], division: Division.PRODUCTION, position: 'Captain Packing' },
    { name: 'Staff Packing Freelance', email: 'freelance@dreamlab.com', roles: [UserRole.PRODUCTION_OP], division: Division.PRODUCTION, position: 'Staff Packing' },
    { name: 'Ghufran', email: 'ghufran@dreamlab.com', roles: [UserRole.WAREHOUSE], division: Division.WAREHOUSE, position: 'Head Warehouse' },
    { name: 'Raka', email: 'raka@dreamlab.com', roles: [UserRole.WAREHOUSE], division: Division.WAREHOUSE, position: 'Warehouse' },
  ];

  console.log('🚀 Seeding Personnel...');

  for (const p of personnel) {
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
    await pool.end();
  });
