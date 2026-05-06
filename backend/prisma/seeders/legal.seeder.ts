
import { PrismaClient, HkiStage, BpomStage, LegalStatus, AuditRiskLevel, RegType, RegStage, ClaimRisk } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomElement, randomInt, randomDecimal } from './utils';

export async function seedLegal(prisma: PrismaClient) {
  console.log('🌱 Seeding Legal & Regulatory Data...');

  // 1. Legal Staff
  const staffNames = ['Arif Legal', 'Santi Regulatory', 'Budi Compliance'];
  for (const name of staffNames) {
    await prisma.legalStaff.create({
      data: {
        name,
        role: name.includes('Regulatory') ? 'REGULATORY_OFFICER' : 'LEGAL_OFFICER',
      }
    });
  }
  const legalStaffs = await prisma.legalStaff.findMany();
  const users = await prisma.user.findMany();
  const legalUser = users.find(u => u.roles.includes('COMPLIANCE')) || users[0];

  // 2. HKI Records
  for (let i = 0; i < 20; i++) {
    await prisma.hkiRecord.create({
      data: {
        hkiId: `HKI-${faker.string.alphanumeric(10).toUpperCase()}`,
        brandName: faker.commerce.productName(),
        type: randomElement(['TRADEMARK', 'COPYRIGHT', 'PATENT']),
        clientName: faker.company.name(),
        picId: randomElement(legalStaffs).id,
        applicationDate: faker.date.past(),
        stage: randomElement(Object.values(HkiStage)),
        status: randomElement(Object.values(LegalStatus)),
        auditRisk: randomElement(Object.values(AuditRiskLevel)),
      }
    });
  }

  // 3. Regulatory Pipeline
  const leads = await prisma.salesLead.findMany({ take: 20 });
  for (const lead of leads) {
    const pipeline = await prisma.regulatoryPipeline.create({
      data: {
        leadId: lead.id,
        type: randomElement(Object.values(RegType)),
        currentStage: randomElement(Object.values(RegStage)),
        legalPicId: legalUser.id,
        registrationNo: `BPOM-${faker.string.numeric(12)}`,
        pnbpStatus: Math.random() > 0.5,
      }
    });

    // PNBP Request
    await prisma.pNBPRequest.create({
      data: {
        pipelineId: pipeline.id,
        amount: randomDecimal(1000000, 5000000),
        billingCode: faker.string.numeric(15),
        isPaid: pipeline.pnbpStatus,
      }
    });

    // Artwork Review
    await prisma.artworkReview.create({
      data: {
        pipelineId: pipeline.id,
        designerPicId: users[0].id,
        artworkUrl: faker.image.url(),
        claimRisk: randomElement(Object.values(ClaimRisk)),
        isApproved: Math.random() > 0.5,
      }
    });
  }

  console.log('✅ Legal Data Seeded.');
}
