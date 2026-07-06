
import { PrismaClient, ContractType, Division, AttendanceStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';
import { randomElement, randomInt } from './utils';

function encryptBaseSalary(text: string): string {
  const secret = process.env.AES_SECRET_KEY || 'default-seed-key-32bytes-long!!';
  const key = Buffer.alloc(32, secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export async function seedHR(prisma: PrismaClient) {
  console.log('🌱 Seeding HR Data...');

  const users = await prisma.user.findMany({ take: 20 });
  
  for (const user of users) {
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        name: user.fullName || faker.person.fullName(),
        joinedAt: faker.date.past(),
        contractType: randomElement(Object.values(ContractType)),
        baseSalary: encryptBaseSalary('5000000'),
      }
    });

    // Division Mapping
    await prisma.employeeRoleMapping.create({
      data: {
        employeeId: employee.id,
        division: randomElement(Object.values(Division)),
        roleName: faker.person.jobTitle(),
        weight: 1.0,
        isPrimary: true,
      }
    });

    // Attendance (Last 30 days)
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          clockIn: new Date(date.setHours(8, randomInt(0, 30), 0)),
          clockOut: new Date(date.setHours(17, randomInt(0, 30), 0)),
          lat: -6.2,
          lng: 106.8,
          distanceFromFactory: randomInt(0, 500),
          status: randomElement(Object.values(AttendanceStatus)),
        }
      });
    }
  }

  console.log('✅ HR Data Seeded.');
}
