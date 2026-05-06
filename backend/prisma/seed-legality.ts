import { PrismaClient, LegalStatus, HkiStage, BpomStage, AuditRiskLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- LEGALITY WATCHDOG SEEDING START ---');

  // 1. Create Staff
  const staff = await prisma.legalStaff.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' }, // Dummy UUID for consistency
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Siti Auditor',
      role: 'LEGAL_COMPLIANCE_HEAD'
    }
  });

  const now = new Date();

  // Helper for Date Math
  const subDays = (d: number) => {
      const date = new Date();
      date.setDate(now.getDate() - d);
      return date;
  };
  const addDays = (d: number) => {
      const date = new Date();
      date.setDate(now.getDate() + d);
      return date;
  };
  const addYears = (y: number) => {
      const date = new Date();
      date.setFullYear(now.getFullYear() + y);
      return date;
  };

  // 2. Scenario 1: SAFE (HKI Asset)
  await prisma.hkiRecord.upsert({
    where: { hkiId: 'HKI-SAFE-001' },
    update: {},
    create: {
        hkiId: 'HKI-SAFE-001',
        brandName: 'Dreamlab Alpha Brand',
        type: 'Merek Dagang',
        clientName: 'Internal R&D',
        picId: staff.id,
        applicationDate: subDays(15),
        expiryDate: addYears(3),
        stage: HkiStage.PUBLISHED,
        status: LegalStatus.DONE,
        auditRisk: AuditRiskLevel.OK
    }
  });

  // 3. Scenario 2: WARNING (BPOM Expiry)
  await prisma.bpomRecord.upsert({
    where: { bpomId: 'BPOM-WARN-002' },
    update: {},
    create: {
        bpomId: 'BPOM-WARN-002',
        productName: 'Dreamlab Serum Pro',
        category: 'Kosmetik',
        clientName: 'Beauty Corp',
        picId: staff.id,
        applicationDate: subDays(365),
        expiryDate: addDays(45), // ENTER CRITICAL ZONE (<= 90 days)
        stage: BpomStage.EVALUATION,
        status: LegalStatus.IN_PROGRESS,
        auditRisk: AuditRiskLevel.DELAY_AUDIT
    }
  });

  // 4. Scenario 3: CRITICAL (BPOM Expired)
  await prisma.bpomRecord.upsert({
    where: { bpomId: 'BPOM-CRIT-003' },
    update: {},
    create: {
        bpomId: 'BPOM-CRIT-003',
        productName: 'Dreamlab Cleanser X',
        category: 'Kosmetik',
        clientName: 'Legacy Lab',
        picId: staff.id,
        applicationDate: subDays(730),
        expiryDate: subDays(5), // ALREADY EXPIRED!
        stage: BpomStage.PUBLISHED,
        status: LegalStatus.REJECTED,
        auditRisk: AuditRiskLevel.CRITICAL
    }
  });

  // 5. Scenario 4: BOTTLENECK (HKI Stalled)
  await prisma.hkiRecord.upsert({
    where: { hkiId: 'HKI-STALL-004' },
    update: {},
    create: {
        hkiId: 'HKI-STALL-004',
        brandName: 'Quantum Logo',
        type: 'Desain Industri',
        clientName: 'Startup Hub',
        picId: staff.id,
        applicationDate: subDays(150),
        expiryDate: null,
        stage: HkiStage.SUBMITTED,
        status: LegalStatus.IN_PROGRESS,
        auditRisk: AuditRiskLevel.DELAY_AUDIT
    }
  });

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  console.log('Cases Injected: SAFE, WARNING (45d), CRITICAL (-5d), BOTTLENECK (150d Age)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
