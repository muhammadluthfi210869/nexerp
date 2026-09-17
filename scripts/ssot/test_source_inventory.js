/**
 * NEX ERP — Unit Tests for Source Inventory & Registration Graph Helpers
 * Verifies AST extraction, multiset diffing, module metadata parsing, and reachability invariants.
 */

const assert = require('assert');
const path = require('path');
const {
  stableKey,
  toMultiset,
  diffMultiset,
  jobKey,
  eventKey,
  migrationKey,
  barrelFileKey,
  barrelMemberKey,
  controllerKey,
  serviceKey,
  moduleKey,
  scanJobs,
  scanEvents,
  scanMigrations,
  scanBarrels,
  scanControllers,
  scanServices,
  scanModules,
} = require('./lib/source_inventory');
const { buildNestRegistrationGraph } = require('./lib/nest_registration_graph');

const ROOT = path.resolve(__dirname, '../..');

console.log('Running test_source_inventory.js...\n');

let passed = 0;
let total = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ PASS | ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL | ${name}: ${err.message}`);
    throw err;
  }
}

// 1. Multiset tests
it('diffMultiset passes on identical sets', () => {
  const actual = [
    { file: 'a.ts', role: 'PUBLISHER', event: 'ev1' },
    { file: 'b.ts', role: 'SUBSCRIBER', event: 'ev2' },
  ];
  const registered = [
    { file: 'b.ts', role: 'SUBSCRIBER', event: 'ev2' },
    { file: 'a.ts', role: 'PUBLISHER', event: 'ev1' },
  ];
  const diff = diffMultiset(actual, registered, eventKey);
  assert.strictEqual(diff.pass, true);
  assert.strictEqual(diff.missing.length, 0);
  assert.strictEqual(diff.extraneous.length, 0);
});

it('diffMultiset catches same-count substitution', () => {
  const actual = [
    { file: 'a.ts', role: 'PUBLISHER', event: 'ev1' },
    { file: 'b.ts', role: 'SUBSCRIBER', event: 'ev2' },
  ];
  const registered = [
    { file: 'a.ts', role: 'PUBLISHER', event: 'ev1' },
    { file: 'fake.ts', role: 'SUBSCRIBER', event: 'fake_event' },
  ];
  const diff = diffMultiset(actual, registered, eventKey);
  assert.strictEqual(diff.pass, false);
  assert.strictEqual(diff.missing.length, 1);
  assert.strictEqual(diff.extraneous.length, 1);
  assert.ok(diff.missing[0].key.includes('b.ts'));
  assert.ok(diff.extraneous[0].key.includes('fake.ts'));
});

it('diffMultiset catches duplicate replacement while preserving total count', () => {
  const actual = [
    { file: 'a.ts', role: 'PUBLISHER', event: 'ev1' },
    { file: 'b.ts', role: 'SUBSCRIBER', event: 'ev2' },
  ];
  const registered = [
    { file: 'a.ts', role: 'PUBLISHER', event: 'ev1' },
    { file: 'a.ts', role: 'PUBLISHER', event: 'ev1' }, // duplicated, b.ts omitted
  ];
  const diff = diffMultiset(actual, registered, eventKey);
  assert.strictEqual(diff.pass, false);
  assert.strictEqual(diff.missing.length, 1);
  assert.strictEqual(diff.extraneous.length, 1);
  assert.ok(diff.missing[0].key.includes('b.ts'));
});

// 2. AST Jobs Scanner
it('scanJobs discovers exact schedulers from backend source', () => {
  const jobs = scanJobs(ROOT);
  assert.ok(jobs.length >= 3, `Expected at least 3 jobs, found ${jobs.length}`);

  const activityCron = jobs.find(j => j.file.includes('activity-log.service.ts'));
  assert.ok(activityCron, 'activity-log.service.ts cron must be found');
  assert.strictEqual(activityCron.provider_symbol, 'ActivityLogService');
  assert.strictEqual(activityCron.type, 'CRON');
  assert.strictEqual(activityCron.trigger, "'13 3 * * *'");

  const docCron = jobs.find(j => j.file.includes('document-automation.service.ts'));
  assert.ok(docCron, 'document-automation.service.ts cron must be found');
  assert.strictEqual(docCron.provider_symbol, 'DocumentAutomationService');
  assert.strictEqual(docCron.type, 'CRON');

  const kommoInterval = jobs.find(j => j.file.includes('kommo-auto-sync.service.ts'));
  assert.ok(kommoInterval, 'kommo-auto-sync.service.ts interval must be found');
  assert.strictEqual(kommoInterval.provider_symbol, 'KommoAutoSyncService');
  assert.strictEqual(kommoInterval.type, 'INTERVAL');
});

// 3. AST Events Scanner
it('scanEvents discovers subscribers and publishers from backend source', () => {
  const events = scanEvents(ROOT);
  assert.ok(events.length > 100, `Expected > 100 events, found ${events.length}`);

  const sub = events.find(e => e.role === 'SUBSCRIBER' && e.file.includes('activity-log.service.ts'));
  assert.ok(sub, 'ActivityLogService subscriber must be found');
  assert.strictEqual(sub.provider_symbol, 'ActivityLogService');
  assert.strictEqual(sub.event, "'state.transition'");

  const pub = events.find(e => e.role === 'PUBLISHER' && e.file.includes('lead.service.ts'));
  assert.ok(pub, 'lead.service.ts publisher must be found');
  assert.strictEqual(pub.provider_symbol, 'LeadService');
});

// 4. Migrations Scanner
it('scanMigrations discovers all prisma migrations', () => {
  const migrations = scanMigrations(ROOT);
  assert.ok(migrations.length >= 40, `Expected >= 40 migrations, found ${migrations.length}`);
  for (const m of migrations) {
    assert.ok(m.file.startsWith('backend/prisma/migrations/'));
    assert.ok(m.file.endsWith('migration.sql'));
  }
});

// 5. AST Barrels Scanner
it('scanBarrels discovers all frontend barrels deterministically', () => {
  const barrels = scanBarrels(ROOT);
  assert.ok(barrels.length >= 3, `Expected at least 3 barrels, found ${barrels.length}`);

  const barrelFiles = barrels.map(b => b.file);
  assert.ok(barrelFiles.includes('frontend/src/components/dna/index.ts'));
  assert.ok(barrelFiles.includes('frontend/src/components/automation/index.ts'));
  assert.ok(barrelFiles.includes('frontend/src/types/index.ts'));

  const dna = barrels.find(b => b.file === 'frontend/src/components/dna/index.ts');
  assert.ok(dna.members.length > 50, 'DNA barrel should have >50 members');

  const auto = barrels.find(b => b.file === 'frontend/src/components/automation/index.ts');
  assert.ok(auto.members.some(m => m.exported_name === 'AutomationShell'));

  const types = barrels.find(b => b.file === 'frontend/src/types/index.ts');
  assert.ok(types.members.some(m => m.exported_name === 'User'));
});

// 6. NestJS Registration Graph
it('buildNestRegistrationGraph correctly derives reachability from AppModule', () => {
  const graph = buildNestRegistrationGraph(ROOT);

  assert.strictEqual(graph.scheduleEnabled, true, 'ScheduleModule must be enabled');
  assert.strictEqual(graph.eventEmitterEnabled, true, 'EventEmitterModule must be enabled');

  // Active module & provider
  assert.strictEqual(
    graph.isProviderReachable('backend/src/modules/document-automation/services/document-automation.service.ts', 'DocumentAutomationService'),
    true
  );
  assert.strictEqual(
    graph.isJobReachable('backend/src/modules/document-automation/services/document-automation.service.ts', 'DocumentAutomationService', 'CRON'),
    true
  );

  // Dead service & provider
  assert.strictEqual(
    graph.isProviderReachable('backend/src/modules/activity-log/activity-log.service.ts', 'ActivityLogService'),
    false
  );
  assert.strictEqual(
    graph.isJobReachable('backend/src/modules/activity-log/activity-log.service.ts', 'ActivityLogService', 'CRON'),
    false
  );
  assert.strictEqual(
    graph.isSubscriberReachable('backend/src/modules/activity-log/activity-log.service.ts', 'ActivityLogService'),
    false
  );

  // Dead lead.service.ts
  assert.strictEqual(
    graph.isPublisherReachable('backend/src/modules/bussdev/services/lead.service.ts', 'LeadService'),
    false
  );

  // Object provider { provide: APP_GUARD, useClass: ThrottlerGuard }
  assert.strictEqual(
    graph.isProviderReachable('node_modules/@nestjs/throttler', 'ThrottlerGuard') || graph.reachableProviders.has('backend/src/app.module.ts:ThrottlerGuard'),
    true
  );
});

// 7. AST Controllers, Services, Modules Scanners and Multiset diff
it('scanControllers, scanServices, scanModules discover components deterministically', () => {
  const ctrls = scanControllers(ROOT);
  const svcs = scanServices(ROOT);
  const mods = scanModules(ROOT);

  assert.ok(ctrls.length >= 30, `Expected >= 30 controllers, found ${ctrls.length}`);
  assert.ok(svcs.length >= 30, `Expected >= 30 services, found ${svcs.length}`);
  assert.ok(mods.length >= 20, `Expected >= 20 modules, found ${mods.length}`);

  const appCtrl = ctrls.find(c => c.file === 'backend/src/app.controller.ts');
  assert.ok(appCtrl, 'AppController must be found');
  assert.strictEqual(appCtrl.controller_symbol, 'AppController');

  const appSvc = svcs.find(s => s.file === 'backend/src/app.service.ts');
  assert.ok(appSvc, 'AppService must be found');
  assert.strictEqual(appSvc.provider_symbol, 'AppService');

  const appMod = mods.find(m => m.file === 'backend/src/app.module.ts');
  assert.ok(appMod, 'AppModule must be found');
  assert.strictEqual(appMod.module_symbol, 'AppModule');
});

it('diffMultiset catches symbol substitution and duplicate records for controllers/services/modules', () => {
  const actualCtrls = [
    { file: 'backend/src/app.controller.ts', controller_symbol: 'AppController' },
  ];
  const fakeCtrls = [
    { file: 'backend/src/app.controller.ts', controller_symbol: 'FakeController' },
  ];
  const diffFake = diffMultiset(actualCtrls, fakeCtrls, controllerKey);
  assert.strictEqual(diffFake.pass, false);
  assert.strictEqual(diffFake.missing.length, 1);
  assert.strictEqual(diffFake.extraneous.length, 1);

  const dupCtrls = [
    { file: 'backend/src/app.controller.ts', controller_symbol: 'AppController' },
    { file: 'backend/src/app.controller.ts', controller_symbol: 'AppController' },
  ];
  const diffDup = diffMultiset(actualCtrls, dupCtrls, controllerKey);
  assert.strictEqual(diffDup.pass, false);
  assert.strictEqual(diffDup.extraneous.length, 1);
});

console.log(`\n=======================================================`);
console.log(`SOURCE INVENTORY & GRAPH TESTS: ${passed}/${total} PASSED`);
console.log(`=======================================================\n`);
