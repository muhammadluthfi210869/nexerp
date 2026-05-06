import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSampleHub() {
  console.log('Seeding samples for the Hub...');
  
  // Find a lead to attach to
  const lead = await prisma.salesLead.findFirst({
    where: { brandName: 'YSL BEAUTY' }
  });

  if (!lead) {
    console.log('Lead not found. Please run baseline seed first.');
    return;
  }

  // Create a sample ready to ship
  await (prisma.sampleRequest as any).upsert({
    where: { leadId: lead.id },
    update: {
      stage: 'READY_TO_SHIP',
      courierName: null,
      trackingNumber: null
    },
    create: {
      leadId: lead.id,
      productName: 'Rose Essence Toner',
      stage: 'READY_TO_SHIP',
      requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    }
  });

  // Create a sample already shipped
  const lead2 = await prisma.salesLead.findFirst({
    where: { brandName: 'GLOW RECIPE' }
  });

  if (lead2) {
    await (prisma.sampleRequest as any).upsert({
      where: { leadId: lead2.id },
      update: {
        stage: 'SHIPPED',
        courierName: 'JNE Express',
        trackingNumber: 'JKT-77889900',
        shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      create: {
        leadId: lead2.id,
        productName: 'Watermelon Glow Serum',
        stage: 'SHIPPED',
        courierName: 'JNE Express',
        trackingNumber: 'JKT-77889900',
        shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }
    });
  }

  console.log('✅ Samples seeded successfully!');
}

seedSampleHub()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
