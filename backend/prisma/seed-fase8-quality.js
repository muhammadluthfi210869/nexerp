const fs = require('fs');
const path = require('path');

const rootDir = 'c:/GAWE/Web Dev/Porto Aureon/ERP FROM ZERO';
const envText = fs.readFileSync(path.join(rootDir, 'backend/.env'), 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const { Pool } = require(path.join(rootDir, 'backend/node_modules/pg'));
const { PrismaPg } = require(path.join(rootDir, 'backend/node_modules/@prisma/adapter-pg'));
const { PrismaClient } = require(path.join(rootDir, 'backend/node_modules/@prisma/client'));

async function main() {
  console.log('🌱 Seeding Fase 8 Quality Control & Checklist Data...');
  console.log('Target DB:', env.DATABASE_URL);

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Fetch reference User
    const users = await prisma.user.findMany({ select: { id: true, email: true, fullName: true, roles: true } });
    const qcUser = users.find(u => (u.roles || []).includes('QC') || (u.roles || []).includes('SUPER_ADMIN')) || users[0];
    console.log(`Using QC User: ${qcUser.fullName} (${qcUser.id})`);

    // 2. Fetch or ensure Production Plan & Formula
    const formulas = await prisma.formula.findMany({ take: 3 });
    const plans = await prisma.productionPlan.findMany({ take: 3 });

    // 3. Seed QC Parameter if formula exists
    if (formulas.length > 0) {
      for (const formula of formulas) {
        await prisma.qCParameter.upsert({
          where: { formulaId: formula.id },
          update: {
            targetPh: '5.0 - 5.8',
            targetViscosity: '3200 - 4500 cPs',
            targetColor: 'Putih Mutiara Semi-Transparan',
            targetAroma: 'Fresh Floral Chamomile Hypoallergenic',
            appearance: 'Emulsi Gel Homogen Bebas Partikel Asing'
          },
          create: {
            formulaId: formula.id,
            targetPh: '5.0 - 5.8',
            targetViscosity: '3200 - 4500 cPs',
            targetColor: 'Putih Mutiara Semi-Transparan',
            targetAroma: 'Fresh Floral Chamomile Hypoallergenic',
            appearance: 'Emulsi Gel Homogen Bebas Partikel Asing'
          }
        });
      }
      console.log('✅ QC Threshold Parameters verified for R&D Formulas.');
    }

    // 4. Seed QCAudits across all 4 stages
    // Clean old dummy audits for idempotent re-seed
    await prisma.qCAudit.deleteMany({
      where: {
        notes: {
          contains: '[SEED_FASE8]'
        }
      }
    });

    // Stage 1: Inbound QC (Passed)
    await prisma.qCAudit.create({
      data: {
        qcId: qcUser.id,
        phase: 'INBOUND',
        status: 'GOOD',
        coaVerified: true,
        sealingCheck: true,
        labelingCheck: true,
        expDateCheck: true,
        materialBatchNo: 'LOT-RAW-2609-081',
        notes: '[SEED_FASE8] Bahan aktif Niacinamide 99.8% lolos verifikasi Certificate of Analysis dan segel pabrik intact.'
      }
    });

    // Stage 1: Inbound QC (Rejected - Karantina)
    await prisma.qCAudit.create({
      data: {
        qcId: qcUser.id,
        phase: 'INBOUND',
        status: 'QUARANTINE',
        coaVerified: false,
        sealingCheck: false,
        defectCategory: 'KEMASAN',
        defectType: 'Botol Kaca Retak & Bocor',
        defectLocation: 'Pallet B-03 Baris 2',
        defectCause: 'Benturan handling saat transit ekspedisi',
        severity: 'MAJOR',
        disposition: 'SCRAP',
        materialBatchNo: 'LOT-KMS-2609-012',
        notes: '[SEED_FASE8] 50 Unit botol kaca pecah/retak rembes ke master box. Dipindahkan ke Gudang Karantina.'
      }
    });

    // Stage 2: Bulk Mixing IPC (Passed)
    await prisma.qCAudit.create({
      data: {
        qcId: qcUser.id,
        phase: 'MIXING',
        status: 'GOOD',
        phValue: 5.45,
        viscosityValue: 3850,
        organoleptic: true,
        densityValue: 1.0285,
        homogenityPass: true,
        materialBatchNo: 'BATCH-MIX-2609-001',
        notes: '[SEED_FASE8] Ruahan Day Cream Batch 001 pH 5.45 (spek 5.0-5.8), Viskositas 3850 cPs. Released to Filling Line.'
      }
    });

    // Stage 3: Filling Line QC (Passed)
    await prisma.qCAudit.create({
      data: {
        qcId: qcUser.id,
        phase: 'FILLING',
        status: 'GOOD',
        samplingVolume: 30.15,
        sealingCheck: true,
        leakTestPass: true,
        torqueValue: 18,
        materialBatchNo: 'BATCH-FIL-2609-001',
        notes: '[SEED_FASE8] Sampling 25 botol pada menit 10, 30, 60. Rata-rata netto 30.15 gr (spek 30.0 ± 0.5 gr). Torque tutup botol rapat 18 Ncm.'
      }
    });

    // Stage 4: Final Packaging QC & Rilis (Passed)
    await prisma.qCAudit.create({
      data: {
        qcId: qcUser.id,
        phase: 'FINAL',
        status: 'GOOD',
        inkjetCheck: true,
        expDateCheck: true,
        dimensionCheck: true,
        halalStatus: true,
        materialBatchNo: 'BATCH-FIN-2609-001',
        notes: '[SEED_FASE8] Cetak Exp Date (09/2028) dan Kode Produksi tajam terbaca. Segel hologram utuh. Siap otorisasi APJ Release.'
      }
    });

    console.log('✅ 5 QC Audit records (4-Tahap: Inbound, Bulk, Filling, Final) seeded.');

    // 5. Seed QC Checklists (1 SO = 1 Checklist Utama Kronologis)
    await prisma.qCChecklist.deleteMany({
      where: {
        title: {
          contains: '[SEED_FASE8]'
        }
      }
    });

    const checklistItems = [
      { step: 1, category: 'Desain Logo', pic: 'Edi (Creative)', durationDays: 7, status: 'DONE', completedAt: '2026-08-10' },
      { step: 2, category: 'HKI & Merek', pic: 'Cipta (Legal)', durationDays: 14, status: 'DONE', completedAt: '2026-08-24' },
      { step: 3, category: 'BPOM NA Notifikasi', pic: 'Cipta (Legal)', durationDays: 30, status: 'DONE', bpomNo: 'NA18260109281', completedAt: '2026-09-01' },
      { step: 4, category: 'Bahan Baku & Kemas', pic: 'Nike (SCM)', durationDays: 14, status: 'DONE', completedAt: '2026-09-05' },
      { step: 5, category: 'Mixing Produksi', pic: 'Nur Kholilah (Produksi)', durationDays: 7, status: 'DONE', completedAt: '2026-09-07' },
      { step: 6, category: 'Filling & Sealing', pic: 'Nur Kholilah (Produksi)', durationDays: 5, status: 'IN_PROGRESS', notes: '6.500 dari 10.000 tube terisi' },
      { step: 7, category: 'Packaging & Dus', pic: 'Budi Santoso (Gudang)', durationDays: 3, status: 'PENDING', notes: 'Menunggu filling selesai 100%' },
      { step: 8, category: 'Delivery Logistik', pic: 'Agus Pratama (Logistik)', durationDays: 2, status: 'PENDING' },
    ];

    await prisma.qCChecklist.create({
      data: {
        title: '[SEED_FASE8] Checklist Operasional SO-2026-0512 (Sunscreen Gel SPF 50 30ml)',
        createdById: qcUser.id,
        status: 'IN_PROGRESS',
        items: checklistItems,
        completedItems: checklistItems.filter(i => i.status === 'DONE'),
        notes: 'Checklist Terintegrasi Maklon PT Glow Skin Global (Target rilis 15 September 2026).'
      }
    });

    console.log('✅ QCChecklist 1 SO = 1 Checklist Utama seeded.');

    // 6. Seed Reject Execution (Resolusi Karantina Scrap)
    if (plans.length > 0) {
      const plan = plans[0];
      const lossAccount = await prisma.account.findFirst({ where: { code: { startsWith: '5' } } });

      await prisma.rejectExecution.deleteMany({
        where: { planId: plan.id }
      });

      await prisma.rejectExecution.create({
        data: {
          planId: plan.id,
          qty: 50,
          action: 'Pemusnahan (Disposal)',
          lossAccountId: lossAccount ? lossAccount.id : null,
          evidenceUrl: 'https://storage.kil.co.id/qc/berita-acara-disposal-2609.pdf'
        }
      });
      console.log('✅ Reject Execution (Resolusi Karantina) seeded.');
    }

    console.log('🎉 Fase 8 Quality Control & Checklist Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
