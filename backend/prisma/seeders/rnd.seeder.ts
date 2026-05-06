
import { PrismaClient, SampleStage, FormulaStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomElement, randomInt, generateSequence, randomAprilDate } from './utils';

export async function seedRnD(prisma: PrismaClient) {
  console.log('🌱 Seeding RnD Data...');

  const leads = await prisma.salesLead.findMany({
    where: { status: { in: ['SAMPLE_REQUESTED', 'SAMPLE_SENT', 'SAMPLE_APPROVED', 'WON_DEAL'] } }
  });
  const materials = await prisma.materialItem.findMany({
    where: { type: 'RAW_MATERIAL' }
  });

  const stages = Object.values(SampleStage);

  for (const lead of leads) {
    const sample = await prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-${faker.string.alphanumeric(6).toUpperCase()}`,
        leadId: lead.id,
        productName: lead.productInterest || faker.commerce.productName(),
        targetFunction: 'Cleansing & Moisturizing',
        textureReq: 'Gel',
        colorReq: 'Transparent',
        aromaReq: 'Luxury Floral',
        stage: randomElement(stages),
        requestedAt: randomAprilDate(),
      }
    });

    // Create Formula for approved/sent samples
    if (['SAMPLE_SENT', 'SAMPLE_APPROVED', 'WON_DEAL'].includes(sample.stage)) {
      const formula = await prisma.formula.create({
        data: {
          formulaCode: `FOR-${faker.string.alphanumeric(6).toUpperCase()}`,
          sampleRequestId: sample.id,
          status: FormulaStatus.PRODUCTION_LOCKED,
          version: 1,
        }
      });

      // Add Phases and Items to formula
      const phaseCount = randomInt(1, 3);
      for (let p = 0; p < phaseCount; p++) {
        const phase = await prisma.formulaPhase.create({
          data: {
            formulaId: formula.id,
            prefix: String.fromCharCode(65 + p), // A, B, C
            order: p + 1,
            instructions: faker.lorem.paragraph(),
          }
        });

        const itemCount = randomInt(2, 5);
        for (let i = 0; i < itemCount; i++) {
          await prisma.formulaItem.create({
            data: {
              phaseId: phase.id,
              materialId: randomElement(materials).id,
              dosagePercentage: 100 / (phaseCount * itemCount), // Simplified dosage
            }
          });
        }
      }
    }
  }

  console.log('✅ RnD Data Seeded.');
}
