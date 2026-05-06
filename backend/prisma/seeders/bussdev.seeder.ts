
import { PrismaClient, WorkflowStatus, LeadSource, ProductCategory, HkiMode, PaymentType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomElement, randomInt, randomDecimal, generateSequence, randomAprilDate } from './utils';

export async function seedBussdev(prisma: PrismaClient) {
  console.log('🌱 Seeding Bussdev Data...');

  const staffs = await prisma.bussdevStaff.findMany();
  const categories = await prisma.masterCategory.findMany({ where: { type: 'CUSTOMER' } });
  
  if (staffs.length === 0) throw new Error('Bussdev staff must be seeded first');

  const sources = Object.values(LeadSource);
  const statuses = Object.values(WorkflowStatus);
  const productCategories = Object.values(ProductCategory);

  for (let i = 0; i < 50; i++) {
    const staff = randomElement(staffs);
    const status = randomElement(statuses);
    
    const lead = await prisma.salesLead.create({
      data: {
        clientName: faker.company.name(),
        brandName: faker.commerce.productName(),
        brandCode: `BRD-${faker.string.alphanumeric(4).toUpperCase()}`,
        contactInfo: faker.phone.number(),
        email: faker.internet.email(),
        source: randomElement(sources),
        productInterest: faker.commerce.product(),
        estimatedValue: randomDecimal(10000000, 500000000),
        status,
        picId: staff.id,
        categoryEnum: randomElement(productCategories),
        categoryId: randomElement(categories)?.id,
        province: faker.location.state(),
        city: faker.location.city(),
        isHighValue: Math.random() > 0.8,
        hkiMode: randomElement(Object.values(HkiMode)),
        paymentType: randomElement(Object.values(PaymentType)),
        createdAt: new Date(2026, 3, randomInt(1, 30)),
      }
    });

    // Activities for each lead
    const activityCount = randomInt(1, 5);
    for (let j = 0; j < activityCount; j++) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          activityType: randomElement(['CHAT', 'CALL', 'MEETING_OFFLINE']),
          notes: faker.lorem.sentence(),
          createdAt: randomAprilDate(),
        } as any
      });
    }
  }

  console.log('✅ Bussdev Data Seeded.');
}
