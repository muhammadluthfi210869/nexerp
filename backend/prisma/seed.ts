// @ts-nocheck
import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 RESETTING DATABASE (Production Light)...');

  // Cleanup — hanya tabel yang masih ada di skema aktif
  // (tabel marketing dihapus dari skema, jangan di-truncate)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    users, employees, employee_role_mappings, kpi_point_logs, kpi_scores,
    kpi_metric_definitions, attendances, payroll_items, payrolls, tickets,
    rnd_daily_tasks, rnd_projects, rnd_weekly_performances,
    rnd_failed_trials, rnd_head_trackers, rnd_monthly_kpis
  RESTART IDENTITY CASCADE`);

  console.log('');
  console.log('🌱 Seeding Users...');
  const PASSWORD = await bcrypt.hash('password123', 10);
  const users = [
    // ── SUPER ADMIN ──
    { email: 'admin@nexerp.id', fullName: 'Super Admin', roles: [UserRole.SUPER_ADMIN] },
    { email: 'admin@dreamlab.com', fullName: 'Super Admin', roles: [UserRole.SUPER_ADMIN] },
    { email: 'zaki@nexerp.id', fullName: 'Zaki', roles: [UserRole.SUPER_ADMIN] },
    { email: 'zaki@dreamlab.com', fullName: 'Zaki', roles: [UserRole.SUPER_ADMIN] },

    // ── DIGITAL MARKETING / DIGIMAR ──
    { email: 'revita@nexerp.id', fullName: 'Revita', roles: [UserRole.MARKETING, UserRole.DIGIMAR] },
    { email: 'revita@dreamlab.com', fullName: 'Revita', roles: [UserRole.MARKETING, UserRole.DIGIMAR] },
    // ── DIGITAL MARKETING / DIGIMAR (non-manager) ──
    // Hanya punya role DIGIMAR → bisa lihat task sendiri, ganti startDate saja
    { email: 'zarkasi@nexerp.id', fullName: 'Zarkasi', roles: [UserRole.DIGIMAR] },
    { email: 'zarkasi@dreamlab.com', fullName: 'Zarkasi', roles: [UserRole.DIGIMAR] },
    { email: 'gusti@nexerp.id', fullName: 'Gusti', roles: [UserRole.DIGIMAR] },
    { email: 'gusti@dreamlab.com', fullName: 'Gusti', roles: [UserRole.DIGIMAR] },
    { email: 'aurel@nexerp.id', fullName: 'Aurel', roles: [UserRole.DIGIMAR] },
    { email: 'aurel@dreamlab.com', fullName: 'Aurel', roles: [UserRole.DIGIMAR] },
    { email: 'edy@nexerp.id', fullName: 'Edy', roles: [UserRole.DIGIMAR] },
    { email: 'edy@dreamlab.com', fullName: 'Edy', roles: [UserRole.DIGIMAR] },
    { email: 'luthfi@nexerp.id', fullName: 'Luthfi', roles: [UserRole.DIGIMAR] },
    { email: 'luthfi@dreamlab.com', fullName: 'Luthfi', roles: [UserRole.DIGIMAR] },
    { email: 'rahmat@nexerp.id', fullName: 'Rahmat', roles: [UserRole.DIGIMAR] },
    { email: 'rahmat@dreamlab.com', fullName: 'Rahmat', roles: [UserRole.DIGIMAR] },
    { email: 'nisa@nexerp.id', fullName: 'Nisa', roles: [UserRole.MARKETING] },
    { email: 'nisa@dreamlab.com', fullName: 'Nisa', roles: [UserRole.MARKETING] },
    { email: 'marketing@nexerp.id', fullName: 'Marketing User', roles: [UserRole.MARKETING, UserRole.DIGIMAR] },
    { email: 'marketing@dreamlab.com', fullName: 'Marketing User', roles: [UserRole.MARKETING, UserRole.DIGIMAR] },

    // ── RESEARCH & DEV ──
    // Amira = RND Head → isRndHeadAccount = true, isRndLockedAccount = true
    { email: 'amira@nexerp.id', fullName: 'Amira', roles: [UserRole.RND] },
    { email: 'amira@dreamlab.com', fullName: 'Amira', roles: [UserRole.RND] },
    // Panca = RND → isRndHeadAccount = false, isRndLockedAccount = true
    { email: 'panca@nexerp.id', fullName: 'Panca', roles: [UserRole.RND] },
    { email: 'panca@dreamlab.com', fullName: 'Panca', roles: [UserRole.RND] },
    // Yaya = RND → isRndHeadAccount = false, isRndLockedAccount = true
    { email: 'yaya@nexerp.id', fullName: 'Yaya', roles: [UserRole.RND] },
    { email: 'yaya@dreamlab.com', fullName: 'Yaya', roles: [UserRole.RND] },
    { email: 'rnd@nexerp.id', fullName: 'RND User', roles: [UserRole.RND] },
    { email: 'rnd@dreamlab.com', fullName: 'RND User', roles: [UserRole.RND] },

    // ── HR ──
    { email: 'hr@nexerp.id', fullName: 'HR User', roles: [UserRole.HR] },
    { email: 'hr@dreamlab.com', fullName: 'HR User', roles: [UserRole.HR] },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { roles: u.roles },
      create: { email: u.email, fullName: u.fullName, passwordHash: PASSWORD, roles: u.roles },
    });
    console.log(`  ✅ ${u.fullName} (${u.email})`);
  }

  console.log('');
  console.log('🌱 Seeding RND Daily Tasks...');
  const dailyTasks = [
    { date: '2026-07-15', pic: 'Amira',  projectName: 'Formulasi Sabun Cair Anti Bacteria',      category: 'New Sample',   status: 'Done',          progress: 100, targetSampleCount: 5,  tanggalMasuk: '2026-07-01', deadline: '2026-07-15', task: 'Finalisasi formula dan uji stabilitas' },
    { date: '2026-07-10', pic: 'Amira',  projectName: 'Stabilitas Ekstrak Daun Sirsak',           category: 'Stability',    status: 'Done',          progress: 100, targetSampleCount: 3,  tanggalMasuk: '2026-06-20', deadline: '2026-07-10', task: 'Evaluasi stabilitas dipercepat 30 hari' },
    { date: '2026-07-20', pic: 'Amira',  projectName: 'Varian Fragrance Baru',                    category: 'New Sample',   status: 'On Progress',   progress: 60,  targetSampleCount: 4,  tanggalMasuk: '2026-07-05', deadline: '2026-07-28', task: 'Uji coba 3 varian fragrance' },
    { date: '2026-07-22', pic: 'Amira',  projectName: 'Optimasi Viskositas Lotion SPF',            category: 'Revision',    status: 'On Progress',   progress: 40,  targetSampleCount: 3,  tanggalMasuk: '2026-07-10', deadline: '2026-08-05', task: 'Adjust rheology modifier' },
    { date: '2026-07-05', pic: 'Amira',  projectName: 'Validasi Metode Analisis Asam Hialuronat',  category: 'Analytical',  status: 'Done',          progress: 100, targetSampleCount: 2,  tanggalMasuk: '2026-06-15', deadline: '2026-07-05', task: 'Validasi HPLC method' },
    { date: '2026-06-28', pic: 'Amira',  projectName: 'Pengembangan Cleansing Oil',               category: 'New Sample',   status: 'Done',          progress: 100, targetSampleCount: 4,  tanggalMasuk: '2026-06-01', deadline: '2026-06-28', task: 'Formulasi base cleansing oil' },
    { date: '2026-06-15', pic: 'Amira',  projectName: 'Evaluasi Sensori Hand Cream',              category: 'New Sample',   status: 'Done',          progress: 100, targetSampleCount: 3,  tanggalMasuk: '2026-05-25', deadline: '2026-06-15', task: 'Panel test 20 responden' },
    { date: '2026-07-12', pic: 'Panca',  projectName: 'Formulasi Cream Malam Retinol',            category: 'New Sample',   status: 'Done',          progress: 100, targetSampleCount: 4,  tanggalMasuk: '2026-06-20', deadline: '2026-07-12', task: 'Formulasi retinol 0.3% dan 0.5%' },
    { date: '2026-07-18', pic: 'Panca',  projectName: 'Uji Stabilitas Emulsi Sunscreen',          category: 'Stability',    status: 'On Progress',   progress: 70,  targetSampleCount: 3,  tanggalMasuk: '2026-07-01', deadline: '2026-07-30', task: 'Uji freeze-thaw 5 siklus' },
    { date: '2026-07-08', pic: 'Panca',  projectName: 'Reformulasi Serum Vitamin C',              category: 'Revision',    status: 'Failed Trial', progress: 80,  targetSampleCount: 3,  tanggalMasuk: '2026-06-25', deadline: '2026-07-08', task: 'Stabilisasi ascorbic acid' },
    { date: '2026-07-23', pic: 'Panca',  projectName: 'Base Foundation Oil-Free',                 category: 'New Sample',   status: 'On Progress',   progress: 30,  targetSampleCount: 5,  tanggalMasuk: '2026-07-10', deadline: '2026-08-10', task: 'Formulasi base dengan silica' },
    { date: '2026-07-03', pic: 'Panca',  projectName: 'Analisis Mikrobiologi Batch 2026-07',       category: 'Analytical',  status: 'Done',          progress: 100, targetSampleCount: 6,  tanggalMasuk: '2026-07-01', deadline: '2026-07-03', task: 'Total plate count & yeast mold' },
    { date: '2026-06-25', pic: 'Panca',  projectName: 'Formulasi Masker Clay Organik',            category: 'New Sample',   status: 'Done',          progress: 100, targetSampleCount: 3,  tanggalMasuk: '2026-06-05', deadline: '2026-06-25', task: 'Formulasi 3 varian clay' },
    { date: '2026-07-24', pic: 'Panca',  projectName: 'Validasi Metode Uji Logam Berat',          category: 'Analytical',  status: 'On Progress',   progress: 45,  targetSampleCount: 2,  tanggalMasuk: '2026-07-10', deadline: '2026-08-07', task: 'Validasi ICP-MS method' },
    { date: '2026-07-19', pic: 'Yaya',   projectName: 'Formulasi Body Butter Shea',               category: 'New Sample',   status: 'On Progress',   progress: 50,  targetSampleCount: 3,  tanggalMasuk: '2026-07-05', deadline: '2026-08-01', task: 'Formulasi 3 varian shea butter' },
    { date: '2026-07-14', pic: 'Yaya',   projectName: 'Uji Coba Pewarna Natural',                 category: 'New Sample',   status: 'Done',          progress: 100, targetSampleCount: 4,  tanggalMasuk: '2026-06-28', deadline: '2026-07-14', task: 'Uji stabilitas warna natural' },
    { date: '2026-07-21', pic: 'Yaya',   projectName: 'Stabilitas pH Toner Facial',               category: 'Stability',    status: 'On Progress',   progress: 75,  targetSampleCount: 2,  tanggalMasuk: '2026-07-01', deadline: '2026-07-28', task: 'Monitoring pH 30 hari' },
    { date: '2026-07-25', pic: 'Yaya',   projectName: 'Shampoo Sulfate-Free',                    category: 'New Sample',   status: 'On Hold',       progress: 25,  targetSampleCount: 3,  tanggalMasuk: '2026-07-10', deadline: '2026-08-15', task: 'Menunggu approval bahan baku' },
    { date: '2026-06-20', pic: 'Yaya',   projectName: 'Uji Stabilitas Lip Tint',                  category: 'Stability',    status: 'Failed Trial', progress: 85,  targetSampleCount: 3,  tanggalMasuk: '2026-06-01', deadline: '2026-06-20', task: 'Uji stabilitas warna 30°C' },
    { date: '2026-07-26', pic: 'Yaya',   projectName: 'Formulasi Hair Serum Keratin',             category: 'New Sample',   status: 'On Progress',   progress: 35,  targetSampleCount: 3,  tanggalMasuk: '2026-07-12', deadline: '2026-08-12', task: 'Optimasi rasio keratin' },
  ];
  for (const t of dailyTasks) {
    await prisma.rndDailyTask.create({ data: { ...t, date: new Date(t.date), deadline: new Date(t.deadline), tanggalMasuk: new Date(t.tanggalMasuk) } });
  }
  console.log(`  ✅ ${dailyTasks.length} daily tasks`);

  console.log('');
  console.log('🌱 Seeding RND Projects...');
  const projects = [
    { projectName: 'Sabun Cair Anti Bacteria Series',     pic: 'Amira', client: 'In-House Brand',  category: 'Personal Care', status: 'Done',        startDate: '2026-06-01', deadline: '2026-07-15', totalDays: 45,  revisionCount: 1, trialCount: 3,  notes: 'Produksi batch pertama已完成' },
    { projectName: 'Ekstrak Daun Sirsak Series',          pic: 'Amira', client: 'Herbal Line',     category: 'Active Ingredient', status: 'In progress', startDate: '2026-06-15', deadline: '2026-08-15', totalDays: 60, revisionCount: 2, trialCount: 5,  notes: 'Menunggu hasil stabilitas' },
    { projectName: 'Sunscreen SPF 50 PA++++',             pic: 'Panca', client: 'SunCare Co',       category: 'Sunscreen', status: 'In progress',   startDate: '2026-06-01', deadline: '2026-08-01', totalDays: 60, revisionCount: 3, trialCount: 8,  notes: 'Uji in vivo SPF bulan depan' },
    { projectName: 'Retinol Anti Aging Series',           pic: 'Panca', client: 'Premium Skincare', category: 'Anti Aging',  status: 'Done',       startDate: '2026-05-01', deadline: '2026-07-12', totalDays: 72, revisionCount: 2, trialCount: 6,  notes: 'Produksi batch pilot' },
    { projectName: 'Body Butter Premium Line',            pic: 'Yaya',  client: 'Body Care Co',     category: 'Body Care',   status: 'In progress', startDate: '2026-07-01', deadline: '2026-09-01', totalDays: 60, revisionCount: 0, trialCount: 2,  notes: 'Fase formulasi' },
    { projectName: 'Sulfate-Free Hair Care',              pic: 'Yaya',  client: 'Hair Pro',         category: 'Hair Care',   status: 'On hold',     startDate: '2026-06-15', deadline: '2026-09-15', totalDays: 90, revisionCount: 1, trialCount: 4,  notes: 'Menunggu审批 bahan baku' },
  ];
  for (const p of projects) {
    await prisma.rndProject.create({ data: { ...p, startDate: new Date(p.startDate), deadline: new Date(p.deadline) } });
  }
  console.log(`  ✅ ${projects.length} projects`);

  console.log('');
  console.log('🌱 Seeding RND Weekly Performance...');
  const weeklyData = [
    { pic: 'Amira', weekLabel: 'W1 Jul', weekStart: '2026-07-01', weekEnd: '2026-07-05', totalTask: 4, doneCount: 2, delayedCount: 0, failedTrial: 0, revisionCount: 1, ontimePct: 100, trialSuccessRate: 100, initiativeScore: 90, weeklyScore: 95 },
    { pic: 'Amira', weekLabel: 'W2 Jul', weekStart: '2026-07-06', weekEnd: '2026-07-12', totalTask: 5, doneCount: 3, delayedCount: 0, failedTrial: 0, revisionCount: 0, ontimePct: 100, trialSuccessRate: 100, initiativeScore: 85, weeklyScore: 93 },
    { pic: 'Amira', weekLabel: 'W3 Jul', weekStart: '2026-07-13', weekEnd: '2026-07-19', totalTask: 4, doneCount: 2, delayedCount: 1, failedTrial: 0, revisionCount: 1, ontimePct: 75,  trialSuccessRate: 100, initiativeScore: 80, weeklyScore: 85 },
    { pic: 'Panca', weekLabel: 'W1 Jul', weekStart: '2026-07-01', weekEnd: '2026-07-05', totalTask: 3, doneCount: 2, delayedCount: 0, failedTrial: 0, revisionCount: 0, ontimePct: 100, trialSuccessRate: 100, initiativeScore: 75, weeklyScore: 90 },
    { pic: 'Panca', weekLabel: 'W2 Jul', weekStart: '2026-07-06', weekEnd: '2026-07-12', totalTask: 5, doneCount: 2, delayedCount: 1, failedTrial: 1, revisionCount: 2, ontimePct: 60,  trialSuccessRate: 70,  initiativeScore: 70, weeklyScore: 72 },
    { pic: 'Panca', weekLabel: 'W3 Jul', weekStart: '2026-07-13', weekEnd: '2026-07-19', totalTask: 4, doneCount: 1, delayedCount: 1, failedTrial: 0, revisionCount: 1, ontimePct: 67,  trialSuccessRate: 100, initiativeScore: 80, weeklyScore: 78 },
    { pic: 'Yaya',  weekLabel: 'W2 Jul', weekStart: '2026-07-06', weekEnd: '2026-07-12', totalTask: 3, doneCount: 2, delayedCount: 0, failedTrial: 0, revisionCount: 0, ontimePct: 100, trialSuccessRate: 100, initiativeScore: 70, weeklyScore: 88 },
    { pic: 'Yaya',  weekLabel: 'W3 Jul', weekStart: '2026-07-13', weekEnd: '2026-07-19', totalTask: 4, doneCount: 1, delayedCount: 1, failedTrial: 1, revisionCount: 0, ontimePct: 50,  trialSuccessRate: 60,  initiativeScore: 65, weeklyScore: 62 },
  ];
  for (const w of weeklyData) {
    await prisma.rndWeeklyPerformance.create({ data: { ...w, weekStart: new Date(w.weekStart), weekEnd: new Date(w.weekEnd) } });
  }
  console.log(`  ✅ ${weeklyData.length} weekly performance records`);

  console.log('');
  console.log('🌱 Seeding RND Failed Trials...');
  const failedTrials = [
    { date: '2026-07-08', projectFormula: 'Serum Vitamin C 15%', pic: 'Panca', problemSymptom: 'Oksidasi terjadi dalam 3 hari pada suhu 40°C', rootCause: 'Konsentrasi antioksidan tidak mencukupi', correctionAttempted: 'Penambahan ferulic acid 0.5% dan vitamin E 1%', solution: 'Gunakan delivery system liposomal untuk ascorbic acid', finalLearning: 'Vitamin C memerlukan sistem enkapsulasi untuk stabilitas jangka panjang', applicableTo: 'Semua formulasi vitamin C' },
    { date: '2026-06-20', projectFormula: 'Lip Tint Natural Dye', pic: 'Yaya',  problemSymptom: 'Perubahan warna signifikan setelah 2 minggu penyimpanan', rootCause: 'Pigmen natural tidak stabil pada pH rendah', correctionAttempted: 'Adjust pH ke 5.5 dan tambah chelating agent', solution: 'Kombinasi pigmen sintetik dan natural dengan ratio 70:30', finalLearning: 'Pigmen natural memerlukan buffer system yang tepat', applicableTo: 'Produk makeup dengan pewarna natural' },
    { date: '2026-07-01', projectFormula: 'Water-in-Oil Emulsion', pic: 'Amira', problemSymptom: 'Emulsi pecah setelah 7 hari pada 45°C', rootCause: 'HLB value emulsifier tidak sesuai', correctionAttempted: 'Kombinasi emulsifier HLB 6 dan 8', solution: 'Gunakan polymeric emulsifier dengan HLB 7', finalLearning: 'Emulsi W/O memerlukan polymeric emulsifier untuk stabilitas termal', applicableTo: 'Semua produk W/O' },
    { date: '2026-06-10', projectFormula: 'Peptide Anti Aging Serum', pic: 'Panca', problemSymptom: 'Aktivitas peptide turun 60% setelah 1 bulan', rootCause: 'Hidrolisis peptide pada pH formulasi', correctionAttempted: 'Turunkan pH ke 4.5 dan tambah inhibitor enzim', solution: 'Gunakan peptide terstabilisasi dengan cyclodextrin', finalLearning: 'Peptide memerlukan teknologi stabilisasi untuk shelf life panjang', applicableTo: 'Produk anti aging' },
  ];
  for (const f of failedTrials) {
    await prisma.rndFailedTrial.create({ data: { ...f, date: new Date(f.date) } });
  }
  console.log(`  ✅ ${failedTrials.length} failed trials`);

  console.log('');
  console.log('🌱 Seeding RND Head Tracker...');
  const headTrackers = [
    { date: '2026-07-15', strategicTask: 'Review pipeline produk Q3 2026 bersama tim RND', teamSupport: 'Koordinasi jadwal produksi dengan PPIC', approvalGiven: 'Approval formulasi sabun cair anti bacteria', innovationConcept: 'Konsep produk sunscreen spray untuk atlet', escalationHandled: 'Masalah delay serum vitamin C — reschedule timeline' },
    { date: '2026-07-22', strategicTask: 'Evaluasi budget bulanan RND', teamSupport: 'Mentoring Panca untuk validasi metode logam berat', approvalGiven: 'Approval pembelian raw material ekstrak sirsak', innovationConcept: 'Ide formula cream BB dengan SPF built-in', escalationHandled: '—' },
    { date: '2026-07-08', strategicTask: 'Persiapan presentasi klien SunCare Co', teamSupport: 'Review hasil stabilitas sunscreen dengan Yaya', approvalGiven: 'Approval sample lotion SPF untuk uji in vivo', innovationConcept: 'Teknologi microencapsulation untuk fragrance tahan lama', escalationHandled: 'Konflik jadwal alat HPLC — resolved' },
  ];
  for (const h of headTrackers) {
    await prisma.rndHeadTracker.create({ data: { ...h, date: new Date(h.date) } });
  }
  console.log(`  ✅ ${headTrackers.length} head tracker entries`);

  console.log('');
  console.log('🌱 Seeding RND Monthly KPIs...');
  const monthlyKpis = [
    { month: '2026-06', pic: 'Amira', ontimePct: 95, trialSuccessRate: 88, revisionRate: 12, initiativeScore: 90, knowledgeContribution: 85, compositeScore: 90, grade: 'A' },
    { month: '2026-06', pic: 'Panca', ontimePct: 82, trialSuccessRate: 70, revisionRate: 25, initiativeScore: 75, knowledgeContribution: 80, compositeScore: 78, grade: 'B+' },
    { month: '2026-06', pic: 'Yaya',  ontimePct: 78, trialSuccessRate: 68, revisionRate: 20, initiativeScore: 70, knowledgeContribution: 75, compositeScore: 74, grade: 'B' },
    { month: '2026-07', pic: 'Amira', ontimePct: 92, trialSuccessRate: 90, revisionRate: 10, initiativeScore: 88, knowledgeContribution: 90, compositeScore: 90, grade: 'A' },
    { month: '2026-07', pic: 'Panca', ontimePct: 70, trialSuccessRate: 65, revisionRate: 30, initiativeScore: 72, knowledgeContribution: 78, compositeScore: 72, grade: 'B' },
    { month: '2026-07', pic: 'Yaya',  ontimePct: 75, trialSuccessRate: 60, revisionRate: 22, initiativeScore: 68, knowledgeContribution: 72, compositeScore: 70, grade: 'B' },
  ];
  for (const k of monthlyKpis) {
    await prisma.rndMonthlyKpi.create({ data: k });
  }
  console.log(`  ✅ ${monthlyKpis.length} monthly KPI records`);

  console.log('');
  console.log('🌱 Seeding Round Robin Agents (Lead Capture)...');
  const agents = [
    { name: 'Aurel', phoneNumber: '087712232389', orderIndex: 0, isActive: true, totalLeads: 0 },
    { name: 'Revita', phoneNumber: '081952417051', orderIndex: 1, isActive: true, totalLeads: 0 },
    { name: 'Zarkasi', phoneNumber: '087776550657', orderIndex: 2, isActive: true, totalLeads: 0 },
  ];
  for (const a of agents) {
    await prisma.roundRobinAgent.create({ data: a });
  }
  console.log(`  ✅ ${agents.length} round robin agents`);

  // Reset RoundRobinState
  await prisma.roundRobinState.upsert({
    where: { id: 'singleton' },
    update: { currentIndex: 0 },
    create: { id: 'singleton', currentIndex: 0 },
  });
  console.log('  ✅ RoundRobinState initialized');

  console.log('');
  console.log('💎 SEEDING COMPLETE.');
  console.log('   🔐 Password untuk semua akun: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
