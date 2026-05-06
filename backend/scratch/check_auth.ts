
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@dreamlab.com' }
  });
  
  if (!user) {
    console.log('User not found!');
  } else {
    console.log('User found:', user.email);
    console.log('Roles:', user.roles);
    const isValid = await bcrypt.compare('password123', user.passwordHash || '');
    console.log('Password valid (check script):', isValid);
  }
}

check().then(() => prisma.$disconnect());
