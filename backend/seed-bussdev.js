const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const staffs = await prisma.bussdevStaff.findMany();
    console.log('Bussdev Staffs:', staffs);
    
    if (staffs.length === 0) {
      const newStaff = await prisma.bussdevStaff.create({
        data: {
          name: 'Super Bussdev PIC',
          targetRevenue: 1000000000,
        }
      });
      console.log('Created default staff:', newStaff);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}
run();
