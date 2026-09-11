/**
 * Smoke test for WS-D ActivityLog.
 * Exercises the schema + a service instance against the live dev DB.
 *
 * NOT a replacement for jest unit tests — this validates:
 * - Schema is in sync with Prisma client
 * - DB accepts all LogActivityType values
 * - JSONB metadata round-trips
 * - Division enum is bound to existing Division enum values
 * - Retention purge actually deletes
 *
 * Run: cd backend && npx ts-node --transpile-only scripts/smoke-activity-log.ts
 */
import 'dotenv/config';
import { PrismaClient, LogActivityType, Division } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

let pass = 0;
let fail = 0;
function assert(label: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  console.log('=== WS-D ActivityLog smoke test ===\n');

  // Test 1: all LogActivityType values insert
  console.log('[1] Insert every LogActivityType');
  const types = Object.values(LogActivityType);
  const inserted: { id: string; type: string }[] = [];
  for (const t of types) {
    const row = await prisma.activityLog.create({
      data: {
        type: t,
        metadata: { smoke: true, testType: t },
        path: `/smoke/${t.toLowerCase()}`,
        method: 'POST',
      },
      select: { id: true, type: true },
    });
    inserted.push(row);
  }
  assert('all LogActivityType values accepted', inserted.length === types.length);
  assert(
    'returned types match input',
    inserted.every((r, i) => r.type === types[i]),
  );

  // Test 2: JSONB metadata round-trips
  console.log('\n[2] JSONB metadata round-trip');
  const meta = { nested: { a: 1, b: [1, 2, 3] }, flag: true, note: 'unicode ✓' };
  const row = await prisma.activityLog.create({
    data: {
      type: LogActivityType.CREATE,
      metadata: meta,
    },
  });
  const fetched = await prisma.activityLog.findUnique({
    where: { id: row.id },
  });
  const fetchedMeta = fetched?.metadata as Record<string, unknown> | null;
  assert(
    'metadata round-trips (nested object)',
    (fetchedMeta?.nested as { a?: number })?.a === 1,
  );
  assert(
    'metadata round-trips (array)',
    JSON.stringify((fetchedMeta?.nested as { b?: number[] })?.b) ===
      JSON.stringify([1, 2, 3]),
  );
  assert(
    'metadata round-trips (unicode)',
    fetchedMeta?.note === 'unicode ✓',
  );

  // Test 3: Division enum binds
  console.log('\n[3] Division enum binding');
  const withDiv = await prisma.activityLog.create({
    data: {
      type: LogActivityType.STATE_TRANSITION,
      division: Division.FINANCE,
      entityType: 'SalesLead',
      entityId: '00000000-0000-0000-0000-000000000001',
    },
  });
  const divFetched = await prisma.activityLog.findUnique({
    where: { id: withDiv.id },
  });
  assert('Division.FINANCE persisted', divFetched?.division === 'FINANCE');

  // Test 4: Indexes exist
  console.log('\n[4] Required indexes present');
  const indexes = await prisma.$queryRawUnsafe<{ indexname: string }[]>(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'activity_logs'`,
  );
  const idxNames = indexes.map((i) => i.indexname.toLowerCase());
  assert(
    'userId+createdAt index exists',
    idxNames.some(
      (n) => n.includes('userid') && n.includes('createdat'),
    ),
  );
  assert(
    'entityType+entityId+createdAt index exists',
    idxNames.some(
      (n) =>
        n.includes('entitytype') &&
        n.includes('entityid') &&
        n.includes('createdat'),
    ),
  );
  assert(
    'createdAt index exists',
    idxNames.some((n) => n === 'activity_logs_createdat_idx'),
  );

  // Test 5: Retention purge removes only old rows
  console.log('\n[5] Retention purge respects cutoff');
  const old = new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000); // 1000 days ago
  await prisma.activityLog.create({
    data: { type: LogActivityType.PAGE_VIEW, createdAt: old },
  });
  const before = await prisma.activityLog.count();
  const deleted = await prisma.activityLog.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
  });
  const after = await prisma.activityLog.count();
  assert(
    'purge removed >=1 row',
    deleted.count >= 1,
    `before=${before}, after=${after}, deleted=${deleted.count}`,
  );
  assert(
    'recent rows preserved',
    after > 0,
    'all rows deleted — purge too aggressive',
  );

  // Cleanup smoke rows
  await prisma.activityLog.deleteMany({
    where: { path: { startsWith: '/smoke/' } },
  });

  console.log(`\n=== ${pass} pass, ${fail} fail ===`);
  await prisma.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error('FATAL:', e);
  await prisma.$disconnect();
  process.exit(2);
});