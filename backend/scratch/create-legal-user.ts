import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createLegalUser() {
  console.log('Registering Compliance Officer Account...');

  const hashedPassword = await bcrypt.hash('DreamlabCompliance2026!', 10);

  const user = await prisma.user.upsert({
    where: { email: 'legal@dreamlab.com' },
    update: {},
    create: {
      fullName: 'Siti Compliance Auditor',
      email: 'legal@dreamlab.com',
      passwordHash: hashedPassword,
      roles: [UserRole.COMPLIANCE],
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Account Registered Successfully!');
  console.log('Email: legal@dreamlab.com');
  console.log('Role Assigned: [COMPLIANCE]');
}

createLegalUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
