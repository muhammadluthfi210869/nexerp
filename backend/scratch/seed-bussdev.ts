import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
    await prisma.$disconnect();
  }
}

main();
