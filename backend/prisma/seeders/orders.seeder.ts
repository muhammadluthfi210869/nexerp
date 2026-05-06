
import { PrismaClient, SOStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomElement, randomDecimal, randomInt } from './utils';

export async function seedOrders(prisma: PrismaClient) {
  console.log('🌱 Seeding Sales Orders...');

  const samples = await prisma.sampleRequest.findMany({
    where: { stage: { in: ['APPROVED', 'RECEIVED'] } },
    include: { lead: true }
  });

  for (const sample of samples) {
    await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${faker.string.alphanumeric(8).toUpperCase()}`,
        transactionDate: new Date(2026, 3, randomInt(1, 30)),
        leadId: sample.leadId,
        sampleId: sample.id,
        totalAmount: randomDecimal(50000000, 500000000),
        quantity: randomElement([1000, 2000, 5000, 10000]),
        status: randomElement(Object.values(SOStatus)),
        brandName: sample.lead.brandName,
      }
    });
  }

  console.log('✅ Sales Orders Seeded.');
}
