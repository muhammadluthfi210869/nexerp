const { PrismaClient } = require('@prisma/client');

async function checkAdmins() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      where: {
        roles: {
          hasSome: ['SUPER_ADMIN', 'ADMIN']
        }
      }
    });

    console.log('--- ADMIN USERS FOUND ---');
    users.forEach(u => {
      console.log(`Email: ${u.email}, Roles: ${u.roles}, Status: ${u.status}`);
    });
    console.log('-------------------------');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
