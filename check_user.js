const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function checkUser() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@dreamlab.com' }
    });

    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('User found:', user.email);
    console.log('Password Hash:', user.passwordHash);

    const isMatch = await bcrypt.compare('password123', user.passwordHash);
    console.log('Password Match:', isMatch);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
