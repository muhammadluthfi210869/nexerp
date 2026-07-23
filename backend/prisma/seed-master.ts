// @ts-nocheck
import 'dotenv/config';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type UserSeed = {
  email: string;
  fullName: string;
  roles: UserRole[];
};

const USERS: UserSeed[] = [
  { email: 'zaki@nexerp.id', fullName: 'Zaki', roles: [UserRole.SUPER_ADMIN] },
  { email: 'admin@nexerp.id', fullName: 'Admin', roles: [UserRole.SUPER_ADMIN] },
  { email: 'salsa@nexerp.id', fullName: 'Salsa', roles: [UserRole.ADMIN] },
  { email: 'fadhilah@nexerp.id', fullName: 'Fadhilah', roles: [UserRole.HEAD_OPS, UserRole.MARKETING] },
  { email: 'bagir@nexerp.id', fullName: 'Bagir', roles: [UserRole.HEAD_OPS, UserRole.PRODUCTION, UserRole.PURCHASING] },
  { email: 'irma@nexerp.id', fullName: 'Irma', roles: [UserRole.FINANCE, UserRole.PURCHASING] },
  { email: 'tika@nexerp.id', fullName: 'Tika', roles: [UserRole.FINANCE, UserRole.ADMIN] },
  { email: 'amira@nexerp.id', fullName: 'Amira', roles: [UserRole.RND, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE] },
  { email: 'ciptaning@nexerp.id', fullName: 'Ciptaning', roles: [UserRole.APJ, UserRole.COMPLIANCE] },
  { email: 'yulia@nexerp.id', fullName: 'Yulia', roles: [UserRole.HR] },
  { email: 'diaz@nexerp.id', fullName: 'Diaz', roles: [UserRole.HR, UserRole.MARKETING] },
  { email: 'bagus@nexerp.id', fullName: 'Bagus', roles: [UserRole.IT_SYS] },
  { email: 'revita@nexerp.id', fullName: 'Revita', roles: [UserRole.DIGIMAR] },
  { email: 'gusti@nexerp.id', fullName: 'Gusti', roles: [UserRole.DIGIMAR] },
  { email: 'zarkasi@nexerp.id', fullName: 'Zarkasi', roles: [UserRole.DIGIMAR] },
  { email: 'nisa@nexerp.id', fullName: 'Nisa', roles: [UserRole.MARKETING] },
  { email: 'diva@nexerp.id', fullName: 'Diva', roles: [UserRole.MARKETING] },
  { email: 'edi@nexerp.id', fullName: 'Edi', roles: [UserRole.RND] },
  { email: 'panca@nexerp.id', fullName: 'Panca', roles: [UserRole.RND] },
  { email: 'yaya@nexerp.id', fullName: 'Yaya', roles: [UserRole.RND] },
  { email: 'muhammad@nexerp.id', fullName: 'Muhammad', roles: [UserRole.PRODUCTION] },
  { email: 'lila@nexerp.id', fullName: 'Lila', roles: [UserRole.ADMIN, UserRole.PRODUCTION] },
  { email: 'hasyim@nexerp.id', fullName: 'Hasyim', roles: [UserRole.PRODUCTION_OP] },
  { email: 'agus@nexerp.id', fullName: 'Agus', roles: [UserRole.PRODUCTION_OP] },
  { email: 'makhmud@nexerp.id', fullName: 'Makhmud', roles: [UserRole.PRODUCTION_OP] },
  { email: 'rudi@nexerp.id', fullName: 'Rudi', roles: [UserRole.PRODUCTION] },
  { email: 'ribut@nexerp.id', fullName: 'Ribut', roles: [UserRole.QC_LAB] },
  { email: 'ghufran@nexerp.id', fullName: 'Ghufran', roles: [UserRole.WAREHOUSE] },
  { email: 'raka@nexerp.id', fullName: 'Raka', roles: [UserRole.WAREHOUSE] },
];

async function main() {
  console.log('🌱 MASTER SEED — Creating all users with @nexerp.id');
  const hashed = await bcrypt.hash('password123', 10);

  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        passwordHash: hashed,
        roles: u.roles,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash: hashed,
        roles: u.roles,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`  ✅ ${u.email} (${u.fullName}) — ${u.roles.join(', ')}`);
  }

  console.log(`\n💎 MASTER SEED COMPLETE. ${USERS.length} users created/updated.`);
  console.log('   🔐 Password untuk semua akun: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
