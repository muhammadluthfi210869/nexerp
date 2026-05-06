import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function verify() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: 'admin@dreamlab.com' }
  });

  if (user) {
    console.log('✅ User Found:', user.email);
    console.log('✅ Full Name:', user.fullName);
    console.log('✅ Roles:', user.roles);
    
    const isMatch = await bcrypt.compare('password123', user.passwordHash || '');
    console.log('✅ Password Match (password123):', isMatch);
  } else {
    console.log('❌ User NOT Found');
  }
  await prisma.$disconnect();
}

verify();
