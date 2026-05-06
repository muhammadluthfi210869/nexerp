const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the root backend folder
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function createLegalUser() {
  console.log('--- FORCED ACCOUNT PROVISIONING ---');
  console.log('Target Email: legal@dreamlab.com');
  
  const password = 'DreamlabCompliance2026!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const user = await prisma.user.upsert({
      where: { email: 'legal@dreamlab.com' },
      update: {
        passwordHash: hashedPassword,
        roles: ['COMPLIANCE'],
        status: 'ACTIVE'
      },
      create: {
        fullName: 'Siti Compliance Auditor',
        email: 'legal@dreamlab.com',
        passwordHash: hashedPassword,
        roles: ['COMPLIANCE'],
        status: 'ACTIVE',
      },
    });
    
    console.log('SUCCESS: Compliance credentials stabilized.');
    console.log('Role Policy applied correctly.');
  } catch (err) {
    console.error('CRITICAL FAILURE:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

createLegalUser();
