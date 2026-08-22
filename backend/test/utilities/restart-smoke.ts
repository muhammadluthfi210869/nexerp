/**
 * Smoke script: seed minimal Golden Record + verify against harness HTTP.
 * Run from /backend with:
 *   DATABASE_URL=... npx ts-node --transpile-only test/utilities/restart-smoke.ts
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

async function main() {
  const url =
    process.env.DATABASE_URL ||
    'postgresql://postgres:66luthfi29@localhost:5432/erp_db_test?schema=public';
  if (!url.includes('erp_db_test')) {
    throw new Error('SAFETY: must run against erp_db_test');
  }
  const prisma = new PrismaClient();
  try {
    // Clean prior smoke data
    await prisma.salesOrderAmendment.deleteMany({});
    await prisma.salesOrderItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.regulatoryPipeline.deleteMany({});
    await prisma.formulaItem.deleteMany({});
    await prisma.formulaPhase.deleteMany({});
    await prisma.qCParameter.deleteMany({});
    await prisma.formula.deleteMany({ where: { formulaCode: { startsWith: 'F-SMOKE-' } } });
    await prisma.sampleStageLog.deleteMany({});
    await prisma.sampleRequest.deleteMany({ where: { sampleCode: { startsWith: 'SMP-SMOKE-' } } });
    await prisma.salesLead.deleteMany({ where: { clientName: { startsWith: 'Smoke' } } });

    const userId = randomUUID();
    const picId = randomUUID();
    const leadId = randomUUID();
    const sampleId = randomUUID();
    const formulaId = randomUUID();

    await prisma.user.create({
      data: {
        id: userId,
        email: `smoke-${userId.slice(0, 8)}@nexerp.id`,
        fullName: 'Smoke Actor',
        roles: ['SUPER_ADMIN', 'RND', 'COMMERCIAL', 'COMPLIANCE'],
        passwordHash: 'x',
      },
    });
    await prisma.bussdevStaff.create({ data: { id: picId, name: 'Smoke PIC', userId } });
    await prisma.salesLead.create({
      data: {
        id: leadId,
        clientName: 'Smoke Client',
        brandName: 'Smoke Brand',
        contactInfo: 'smoke@b3.id',
        source: 'TEST',
        productInterest: 'Smoke Product',
        picId,
        status: 'SAMPLE_APPROVED',
      },
    });
    await prisma.sampleRequest.create({
      data: {
        id: sampleId,
        sampleCode: `SMP-SMOKE-${randomUUID().slice(0, 6)}`,
        leadId,
        productName: 'Smoke Product',
        targetFunction: 't',
        textureReq: 't',
        colorReq: 't',
        aromaReq: 't',
        stage: 'APPROVED',
        rndId: userId,
      },
    });
    await prisma.formula.create({
      data: {
        id: formulaId,
        formulaCode: `F-SMOKE-V1-${randomUUID().slice(0, 6)}`,
        sampleRequestId: sampleId,
        version: 1,
        status: 'PRODUCTION_LOCKED',
        phases: { create: [{ prefix: 'A', customName: 'Phase A', order: 1 }] },
      },
    });

    console.log('SMOKE_FIXTURE_IDS=', JSON.stringify({ userId, picId, leadId, sampleId, formulaId }));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
