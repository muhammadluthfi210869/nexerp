const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function resetAdmin() {
  const prisma = new PrismaClient();
  try {
    const email = 'admin@dreamlab.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Resetting user ${email}...`);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashedPassword,
        status: 'ACTIVE'
      },
      create: {
        email,
        fullName: 'Super Admin',
        passwordHash: hashedPassword,
        roles: ['SUPER_ADMIN'],
        status: 'ACTIVE'
      }
    });

    console.log('✅ Admin user reset successfully!');
    console.log('Email:', user.email);
    console.log('Roles:', user.roles);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
