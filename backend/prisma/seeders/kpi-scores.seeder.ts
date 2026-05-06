import { PrismaClient, Division } from '@prisma/client';

interface KpiData {
  employeeEmail: string;
  division: Division;
  avgScore: number; // 0-100
  discipline: number; // 0-100
  output: 'EXCEED' | 'NORMAL' | 'LOW';
  attitude: number; // 0-5
}

// Realistic KPI data based on actual HRDashboardClient hardcoded values
const KPI_DATA: KpiData[] = [
  { employeeEmail: 'irma@dreamlab.com', division: Division.FINANCE, avgScore: 94, discipline: 99, output: 'EXCEED', attitude: 4.9 },
  { employeeEmail: 'tika@dreamlab.com', division: Division.FINANCE, avgScore: 88, discipline: 96, output: 'NORMAL', attitude: 4.5 },
  { employeeEmail: 'salsa@dreamlab.com', division: Division.MANAGEMENT, avgScore: 82, discipline: 95, output: 'NORMAL', attitude: 4.2 },
  { employeeEmail: 'bagir@dreamlab.com', division: Division.MANAGEMENT, avgScore: 91, discipline: 98, output: 'EXCEED', attitude: 4.8 },
  { employeeEmail: 'amira@dreamlab.com', division: Division.LEGAL, avgScore: 89, discipline: 97, output: 'EXCEED', attitude: 4.6 },
  { employeeEmail: 'ciptaning@dreamlab.com', division: Division.LEGAL, avgScore: 85, discipline: 94, output: 'NORMAL', attitude: 4.4 },
  { employeeEmail: 'yulia@dreamlab.com', division: Division.MANAGEMENT, avgScore: 96, discipline: 100, output: 'EXCEED', attitude: 5.0 },
  { employeeEmail: 'diaz@dreamlab.com', division: Division.MANAGEMENT, avgScore: 78, discipline: 92, output: 'NORMAL', attitude: 4.1 },
  { employeeEmail: 'bagus@dreamlab.com', division: Division.SYSTEM, avgScore: 90, discipline: 98, output: 'EXCEED', attitude: 4.8 },
  { employeeEmail: 'revita@dreamlab.com', division: Division.CREATIVE, avgScore: 82, discipline: 94, output: 'NORMAL', attitude: 4.3 },
  { employeeEmail: 'gusti@dreamlab.com', division: Division.CREATIVE, avgScore: 88, discipline: 96, output: 'NORMAL', attitude: 4.7 },
  { employeeEmail: 'zarkasi@dreamlab.com', division: Division.CREATIVE, avgScore: 75, discipline: 90, output: 'NORMAL', attitude: 4.0 },
  { employeeEmail: 'nisa@dreamlab.com', division: Division.BD, avgScore: 81, discipline: 93, output: 'NORMAL', attitude: 4.1 },
  { employeeEmail: 'diva@dreamlab.com', division: Division.BD, avgScore: 79, discipline: 91, output: 'NORMAL', attitude: 4.0 },
  { employeeEmail: 'edi@dreamlab.com', division: Division.RND, avgScore: 92, discipline: 98, output: 'EXCEED', attitude: 4.9 },
  { employeeEmail: 'panca@dreamlab.com', division: Division.RND, avgScore: 84, discipline: 95, output: 'NORMAL', attitude: 4.4 },
  { employeeEmail: 'muhammad@dreamlab.com', division: Division.PRODUCTION, avgScore: 92, discipline: 98, output: 'EXCEED', attitude: 4.8 },
  { employeeEmail: 'lila@dreamlab.com', division: Division.PRODUCTION, avgScore: 88, discipline: 96, output: 'NORMAL', attitude: 4.5 },
  { employeeEmail: 'hasyim@dreamlab.com', division: Division.PRODUCTION, avgScore: 85, discipline: 94, output: 'NORMAL', attitude: 4.2 },
  { employeeEmail: 'agus@dreamlab.com', division: Division.PRODUCTION, avgScore: 78, discipline: 90, output: 'LOW', attitude: 3.8 },
  { employeeEmail: 'makhmud@dreamlab.com', division: Division.PRODUCTION, avgScore: 80, discipline: 92, output: 'NORMAL', attitude: 4.0 },
  { employeeEmail: 'ribut@dreamlab.com', division: Division.QC, avgScore: 91, discipline: 98, output: 'EXCEED', attitude: 4.7 },
  { employeeEmail: 'rudi@dreamlab.com', division: Division.PRODUCTION, avgScore: 86, discipline: 95, output: 'NORMAL', attitude: 4.4 },
  { employeeEmail: 'ghufran@dreamlab.com', division: Division.WAREHOUSE, avgScore: 94, discipline: 99, output: 'EXCEED', attitude: 4.9 },
  { employeeEmail: 'raka@dreamlab.com', division: Division.WAREHOUSE, avgScore: 82, discipline: 95, output: 'NORMAL', attitude: 4.3 },
  { employeeEmail: 'zaki@dreamlab.com', division: Division.MANAGEMENT, avgScore: 98, discipline: 100, output: 'EXCEED', attitude: 5.0 },
  { employeeEmail: 'fadhilah@dreamlab.com', division: Division.MANAGEMENT, avgScore: 90, discipline: 97, output: 'EXCEED', attitude: 4.7 },
];

function getOutputValue(label: string): 'EXCEED' | 'NORMAL' | 'LOW' {
  return label as 'EXCEED' | 'NORMAL' | 'LOW';
}

export async function seedKpiScores(prisma: PrismaClient) {
  console.log('🌱 Seeding KPI Historical Scores...');

  // Ensure FinancialPeriods exist for the last 6 months
  const periodNames = [
    '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04',
  ];

  const periods: { id: string; name: string }[] = [];
  for (const pName of periodNames) {
    const [yyyy, mm] = pName.split('-').map(Number);
    const start = new Date(yyyy, mm - 1, 1);
    const end = new Date(yyyy, mm, 0, 23, 59, 59);

    const period = await prisma.financialPeriod.upsert({
      where: { name: pName },
      update: { startDate: start, endDate: end },
      create: {
        name: pName,
        startDate: start,
        endDate: end,
        status: mm < 4 ? 'CLOSED' as any : 'OPEN' as any,
      },
    });
    periods.push(period);
  }

  // Create attendance records for all employees (last 30 days)
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: { user: true },
  });

  const today = new Date();
  const attendanceStatuses = ['ON_TIME', 'LATE', 'OUTSIDE_GEOFENCE'] as const;

  for (const emp of employees) {
    // Delete existing old attendances for this employee
    await prisma.attendance.deleteMany({
      where: { employeeId: emp.id, createdAt: { gte: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000) } },
    });

    const kpiData = KPI_DATA.find((k) => k.employeeEmail === emp.user?.email);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Weighted random: 80% ON_TIME, 15% LATE, 5% OUTSIDE_GEOFENCE
      const rand = Math.random();
      let status: string;
      if (rand < 0.80) status = 'ON_TIME';
      else if (rand < 0.95) status = 'LATE';
      else status = 'OUTSIDE_GEOFENCE';

      // If we have KPI data, adjust discipline accordingly
      if (kpiData && kpiData.discipline >= 95) {
        status = rand < 0.95 ? 'ON_TIME' : (rand < 0.98 ? 'LATE' : 'OUTSIDE_GEOFENCE');
      } else if (kpiData && kpiData.discipline <= 85) {
        status = rand < 0.70 ? 'ON_TIME' : (rand < 0.85 ? 'LATE' : 'OUTSIDE_GEOFENCE');
      }

      const clockInHour = status === 'LATE' ? 8 + Math.floor(Math.random() * 2) + 1 : 8;
      const clockInMin = status === 'LATE' ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 15);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          clockIn: new Date(date.getFullYear(), date.getMonth(), date.getDate(), clockInHour, clockInMin, 0),
          clockOut: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, Math.floor(Math.random() * 30), 0),
          lat: -6.2 + (Math.random() - 0.5) * 0.01,
          lng: 106.8 + (Math.random() - 0.5) * 0.01,
          distanceFromFactory: status === 'OUTSIDE_GEOFENCE' ? 500 + Math.random() * 2000 : Math.random() * 48,
          status: status as any,
        },
      });
    }

    // Create KPI Scores for each period
    for (const period of periods) {
      const existing = await prisma.kpiScore.findFirst({
        where: { employeeId: emp.id, periodId: period.id },
      });
      if (existing) continue;

      if (kpiData) {
        // Add some random variance per period
        const variance = (Math.random() - 0.5) * 10;
        const score = Math.min(100, Math.max(50, kpiData.avgScore + variance));
        const objectiveScore = score * 0.7;
        const subjectiveScore = score * 0.3;

        await prisma.kpiScore.create({
          data: {
            employeeId: emp.id,
            periodId: period.id,
            finalScore: Math.round(score * 10) / 10,
            objectiveScore: Math.round(objectiveScore * 10) / 10,
            subjectiveScore: Math.round(subjectiveScore * 10) / 10,
            metricsData: {
              output: kpiData.output,
              discipline: kpiData.discipline,
              attitude: kpiData.attitude,
              period: period.name,
            },
          },
        });
      } else {
        // Fallback for employees without KPI data
        const base = 70 + Math.floor(Math.random() * 20);
        await prisma.kpiScore.create({
          data: {
            employeeId: emp.id,
            periodId: period.id,
            finalScore: base,
            objectiveScore: base * 0.7,
            subjectiveScore: base * 0.3,
            metricsData: {
              output: base > 85 ? 'EXCEED' : base > 70 ? 'NORMAL' : 'LOW',
              discipline: 90 + Math.floor(Math.random() * 10),
              attitude: 3.5 + Math.random() * 1.5,
              period: period.name,
            },
          },
        });
      }
    }

    if (kpiData) {
      console.log(`  ✅ KPI Scores for ${emp.name} (avg: ${kpiData.avgScore})`);
    }
  }

  console.log('✅ KPI Scores & Attendance Seeded.');
}
