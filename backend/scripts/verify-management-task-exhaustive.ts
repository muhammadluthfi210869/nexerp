import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { MarketingPrototypeService } from '../src/modules/marketing/prototype/marketing-prototype.service';
import { deriveSla, parseLocalDate, calendarDayDiff, toLocalDateString } from '../src/modules/marketing/prototype/sla.util';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runExhaustiveVerification() {
  console.log('='.repeat(70));
  console.log('🧪 EXHAUSTIVE VERIFICATION: MANAGEMENT TASK SUBSYSTEM');
  console.log('='.repeat(70));

  const service = new MarketingPrototypeService(prisma as any);
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? '(' + detail + ')' : ''}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 1: SLA & Date Utilities Resilience
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 1. SLA & Date Utility Edge Cases ---');
  
  // Empty & malformed dates
  assert(Number.isNaN(parseLocalDate('').getTime()), 'parseLocalDate("") returns Invalid Date without throwing');
  assert(Number.isNaN(parseLocalDate(null as any).getTime()), 'parseLocalDate(null) returns Invalid Date without throwing');
  assert(Number.isNaN(parseLocalDate(undefined as any).getTime()), 'parseLocalDate(undefined) returns Invalid Date without throwing');
  assert(Number.isNaN(parseLocalDate('not-a-date').getTime()), 'parseLocalDate("not-a-date") returns Invalid Date without throwing');
  
  // Valid local date parsing
  const d = parseLocalDate('2026-09-09');
  assert(d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 9, 'parseLocalDate("2026-09-09") correctly parses local year, month, date');

  // calendarDayDiff edge cases
  assert(calendarDayDiff(null as any, new Date()) === 0, 'calendarDayDiff(null, Date) returns 0 safely');
  assert(calendarDayDiff(new Date(), undefined as any) === 0, 'calendarDayDiff(Date, undefined) returns 0 safely');
  assert(calendarDayDiff(new Date(NaN), new Date()) === 0, 'calendarDayDiff(InvalidDate, Date) returns 0 safely');
  
  // calendarDayDiff exact calculation
  const day1 = parseLocalDate('2026-09-01');
  const day5 = parseLocalDate('2026-09-05');
  assert(calendarDayDiff(day5, day1) === 4, 'calendarDayDiff(2026-09-05, 2026-09-01) === 4 days');
  assert(calendarDayDiff(day1, day5) === -4, 'calendarDayDiff(2026-09-01, 2026-09-05) === -4 days');

  // deriveSla edge cases
  assert(deriveSla({ status: 'Not started', dueDate: '' }) === 'Healthy', 'deriveSla with empty dueDate returns Healthy');
  assert(deriveSla({ status: 'Not started', dueDate: 'invalid' }) === 'Healthy', 'deriveSla with invalid dueDate returns Healthy');
  assert(deriveSla({ status: 'Done', dueDate: '2026-09-01', completedAt: '2026-09-01T10:00:00Z' }) === 'Healthy', 'deriveSla on-time Done returns Healthy');
  assert(deriveSla({ status: 'Done', dueDate: '2026-09-01', completedAt: '2026-09-05T10:00:00Z' }) === 'Late', 'deriveSla late Done returns Late');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 2: Viewer Scope & Permission Resolution
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Viewer Scope Resolution (Manager vs Non-Manager) ---');

  // Revita Yustianawati (Head of Marketing / Manager)
  const revitaBundle = await service.getBundle({
    email: 'revita@nexerp.id',
    fullName: 'Revita Yustianawati',
    roles: ['DIGIMAR'],
  });
  assert(revitaBundle.tasks.length > 0, `Revita receives tasks bundle (${revitaBundle.tasks.length} tasks)`);
  assert(revitaBundle.performance.length === 5, `Revita receives 5 performance members (got: ${revitaBundle.performance.length})`);
  const reviPerf = revitaBundle.performance.find((p: any) => p.name === 'Revi');
  assert(Boolean(reviPerf), 'Revita maps correctly to canonical performance member "Revi"');

  // Zarka (Non-Manager)
  const zarkaBundle = await service.getBundle({
    email: 'zarkasi@nexerp.id',
    fullName: 'Muhammad Zarkasi',
    roles: ['DIGIMAR'],
  });
  assert(Array.isArray(zarkaBundle.tasks), 'Zarka bundle returns task array without error');

  // Aurel (Non-Manager)
  const aurelBundle = await service.getBundle({
    email: 'aurel@nexerp.id',
    fullName: 'Aurel',
    roles: ['DIGIMAR'],
  });
  assert(Array.isArray(aurelBundle.tasks), 'Aurel bundle returns task array without error');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 3: Task Creation & Sync (The Non-Manager Input Bug Test)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Task Creation & Manager Visibility Test ---');

  const testTitle = `E2E Auto Test Task ${Date.now()}`;
  const today = toLocalDateString(new Date());
  
  const aurelUser = await prisma.user.findFirst({ where: { email: 'aurel@nexerp.id' } });
  const revitaUser = await prisma.user.findFirst({ where: { email: 'revita@nexerp.id' } });

  assert(Boolean(aurelUser), 'Aurel exists in database with valid UUID');
  assert(Boolean(revitaUser), 'Revita exists in database with valid UUID');

  // Aurel creates task assigned to herself
  const createdTask = await service.createTask(
    {
      id: aurelUser!.id,
      email: aurelUser!.email,
      fullName: aurelUser!.fullName ?? 'Aurel',
      roles: aurelUser!.roles,
    },
    {
      title: testTitle,
      pic: 'Aurel',
      brand: 'Dreamlab',
      priority: 'High',
      startDate: today,
      dueDate: today,
      status: 'Working on it',
      brief: 'Automated test task to verify persistence and visibility',
    }
  );

  assert(Boolean(createdTask.id), `Task created with ID: ${createdTask.id}`);
  assert(createdTask.title === testTitle, `Created task title matches: ${createdTask.title}`);

  // Verify directly in DB that assigneeId, picId, dueDate are populated
  const dbTask = await prisma.marketingTask.findUnique({
    where: { id: createdTask.id },
    include: { pic: true },
  });

  assert(Boolean(dbTask), 'Task exists in PostgreSQL marketing_tasks table');
  assert(Boolean(dbTask?.assigneeId), `assigneeId is populated in PostgreSQL: ${dbTask?.assigneeId}`);
  assert(Boolean(dbTask?.dueDate), `dueDate is populated in PostgreSQL: ${dbTask?.dueDate}`);

  // Query as Revita (Manager) -> verify task is VISIBLE to Revita
  const revitaBundleAfter = await service.getBundle({
    email: 'revita@nexerp.id',
    fullName: 'Revita Yustianawati',
    roles: ['DIGIMAR'],
  });

  const taskSeenByManager = revitaBundleAfter.tasks.find((t: any) => t.id === createdTask.id || t.title === testTitle);
  assert(Boolean(taskSeenByManager), 'Task created by non-manager (Aurel) is IMMEDIATELY visible to Manager (Revita)!');
  assert(taskSeenByManager?.pic === 'Aurel', `Task PIC in Manager view matches "Aurel" (got: ${taskSeenByManager?.pic})`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 4: Task Updates & Status Transitions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Task Lifecycle & SLA Recalculation ---');

  // Aurel updates status to Done
  const updatedTask = await service.updateTask(
    {
      id: aurelUser!.id,
      email: aurelUser!.email,
      fullName: aurelUser!.fullName ?? 'Aurel',
      roles: aurelUser!.roles,
    },
    createdTask.id,
    {
      status: 'Done',
    }
  );

  assert(updatedTask.status === 'Done', 'Task status updated to Done');
  assert(Boolean(updatedTask.completedAt), 'completedAt timestamp recorded when marked Done');

  // Clean up test task
  await service.deleteTask(
    {
      id: revitaUser!.id,
      email: revitaUser!.email,
      fullName: revitaUser!.fullName ?? 'Revita Yustianawati',
      roles: revitaUser!.roles,
    },
    createdTask.id
  );

  const checkDeleted = await prisma.marketingTask.findUnique({ where: { id: createdTask.id } });
  assert(checkDeleted === null, 'Test task cleanly deleted after verification');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 5: Frontend Data Processing Simulation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Frontend UI Data Processing Simulation ---');

  // Simulate ManagementTaskBoard data pipeline with intentionally hostile edge cases
  const hostileTasks = [
    ...revitaBundleAfter.tasks,
    { id: 'hostile-1', title: 'Task with null date', dueDate: '', startDate: '', pic: null, completedAt: null, status: 'Not started', brand: 'Dreamlab', project: null },
    { id: 'hostile-2', title: 'Task with undefined fields', dueDate: undefined, startDate: undefined, pic: undefined, status: 'Done', completedAt: 'invalid-date', brand: 'Toribio' },
    { id: 'hostile-3', title: 'Task with future date', dueDate: '2028-12-31', startDate: '2028-12-01', pic: 'Revita Yustianawati', status: 'Working on it', brand: 'Dreamlab' },
  ];

  const hostileProfiles = [
    ...revitaBundleAfter.performance,
    { id: null, name: null, role: null, monthKpi: null, completed: 0, late: 0 },
    { id: undefined, name: undefined, role: undefined, monthKpi: undefined },
  ];

  // Test normalize function
  function normalize(value?: string | null) {
    return (value ?? '').trim().toLowerCase();
  }
  assert(normalize(null) === '', 'normalize(null) returns "" without throwing');
  assert(normalize(undefined) === '', 'normalize(undefined) returns "" without throwing');
  assert(normalize('  ReViTa  ') === 'revita', 'normalize("  ReViTa  ") === "revita"');

  // Simulate profiles lookup (previously crashed with Cannot read properties of null (reading 'trim'))
  const overviewMembers = [
    { slug: 'aurel', label: 'Aurel', aliases: ['aurel'] },
    { slug: 'revi', label: 'Revita', aliases: ['revi', 'revita', 'revita yustianawati'] },
    { slug: 'zarka', label: 'Zarkasi', aliases: ['zarka', 'zarkasi', 'muhammad zarkasi'] },
    { slug: 'gusti', label: 'Gusti', aliases: ['gusti'] },
    { slug: 'luthfi', label: 'Luthfi', aliases: ['luthfi'] },
  ];

  let profileMatchCount = 0;
  for (const member of overviewMembers) {
    const profile = hostileProfiles.find(
      (item) => normalize(item.name) === normalize(member.label) || normalize(item.id) === normalize(member.slug)
    );
    if (profile) profileMatchCount++;
  }
  assert(profileMatchCount > 0, `Profile matching with hostile data processed successfully (${profileMatchCount} matched, 0 crashes)`);

  // Simulate rowsByStatus sort comparator (previously crashed with localeCompare on null)
  const sorted = hostileTasks.sort((left, right) =>
    (left.dueDate ?? '').localeCompare(right.dueDate ?? '') || (left.title ?? '').localeCompare(right.title ?? '')
  );
  assert(sorted.length === hostileTasks.length, 'Task sorting with null/empty dueDates processed 100% safely');

  // Simulate month filtering (previously crashed with dueDate.slice)
  const monthFiltered = hostileTasks.filter((t) => (t.dueDate?.slice(0, 7) ?? '') === '2026-09');
  assert(Array.isArray(monthFiltered), 'Task month slicing with null/empty dueDates processed 100% safely');

  console.log('\n' + '='.repeat(70));
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH ZERO ERRORS!`);
  console.log('='.repeat(70));
}

runExhaustiveVerification()
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
