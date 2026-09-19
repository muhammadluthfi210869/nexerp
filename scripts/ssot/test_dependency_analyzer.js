#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const analyzers = require('./lib/p05_analyzers');

const ROOT = path.resolve(__dirname, '../..');

let passed = 0;
let failed = 0;
const tests = [];

function test(desc, fn) {
  tests.push({ desc, fn });
}

console.log('--- Dependency & Architecture Analyzer Tests ---');

// 1. Clean control: base repository has 0 forbidden domain edges and 0 direct cross-domain persistence
test('Clean control: dependency graph derivation succeeds', () => {
  const graph = analyzers.deriveDependencyGraph({ root: ROOT });
  assert(graph.nodes.length >= 25, `Expected >= 25 nodes, got ${graph.nodes.length}`);
  assert(graph.edges.length > 0, `Expected > 0 edges, got ${graph.edges.length}`);
  assert(graph.baseline_digest && graph.candidate_digest, 'Digests present');
});

test('Clean control: zero forbidden domain imports in clean state', () => {
  const graph = analyzers.deriveDependencyGraph({ root: ROOT });
  const forb = analyzers.findForbiddenDomainImports(ROOT, graph);
  assert.strictEqual(forb.count, 0, `Expected 0 forbidden domain imports, got ${forb.count}: ${JSON.stringify(forb.samples)}`);
});

test('Clean control: zero direct cross-domain persistence in clean state', () => {
  const graph = analyzers.deriveDependencyGraph({ root: ROOT });
  const cd = analyzers.findDirectCrossDomainPersistence(ROOT, graph);
  assert.strictEqual(cd.count, 0, `Expected 0 cross-domain persistence, got ${cd.count}: ${JSON.stringify(cd.samples)}`);
});

test('Clean control: zero domain cycles in clean state', async () => {
  const gates = require('./lib/p05_gates');
  const contract = JSON.parse(fs.readFileSync(path.join(__dirname, 'p05_acceptance_contract.json'), 'utf8'));
  const r = await gates.gateCircularDependencyScan({ root: ROOT, candidateSha: contract.phase_base_sha, contract });
  assert.strictEqual(r.domain_cycles, 0, `Expected 0 domain cycles, got ${r.domain_cycles}`);
});

// 2. Allowed public port/interface and shared-kernel primitive
test('Allowed: public port/interface import is permitted', () => {
  const cls = analyzers.classifyImport('../finance/finance.interface', 'backend/src/modules/lead-capture/lead.service.ts', ROOT, 'lead-capture');
  assert.strictEqual(cls.classification, 'allowed', 'Port/interface import should be allowed');
});

test('Allowed: shared-kernel primitive import is permitted', () => {
  const cls = analyzers.classifyImport('../../../shared/encryption.service', 'backend/src/modules/auth/auth.service.ts', ROOT, 'auth');
  assert.strictEqual(cls.classification, 'allowed', 'Shared kernel primitive should be allowed');
});

// 3. Mutation: relative-import cycle
test('Mutation: relative-import cycle is detected', async () => {
  const targetFile = path.join(ROOT, 'backend/src/modules/users/temp_cycle_mut.ts');
  fs.writeFileSync(targetFile, "import { AuthService } from '../auth/auth.service';\nexport class CycleMut {}\n");
  try {
    const gates = require('./lib/p05_gates');
    const contract = JSON.parse(fs.readFileSync(path.join(__dirname, 'p05_acceptance_contract.json'), 'utf8'));
    const r = await gates.gateCircularDependencyScan({ root: ROOT, candidateSha: contract.phase_base_sha, contract });
    assert(r.domain_cycles > 0, `Expected domain cycles > 0, got ${r.domain_cycles}`);
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
});

// 4. Mutation: alias-import / cross-domain service boundary violation
test('Mutation: cross-domain concrete service import is caught by findForbiddenDomainImports', () => {
  const targetFile = path.join(ROOT, 'backend/src/modules/lead-capture/temp_forbidden_mut.ts');
  fs.writeFileSync(targetFile, "import { FinanceService } from '../finance/finance.service';\nconsole.log(FinanceService);\n");
  try {
    const graph = analyzers.deriveDependencyGraph({ root: ROOT });
    const forb = analyzers.findForbiddenDomainImports(ROOT, graph);
    assert(forb.count > 0, `Expected forbidden domain import detected, got ${forb.count}`);
    assert(forb.samples.some(s => s.from === 'lead-capture'), 'Lead capture should be identified as source');
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
});

// 5. Mutation: cross-domain Prisma delegate
test('Mutation: cross-domain Prisma delegate reach-through is caught by findDirectCrossDomainPersistence', () => {
  const targetFile = path.join(ROOT, 'backend/src/modules/crm/temp_cross_persist.ts');
  fs.writeFileSync(targetFile, "export function cross(prisma: any) { return prisma.warehouseStock.create({}); }\n");
  try {
    const cd = analyzers.findDirectCrossDomainPersistence(ROOT);
    assert(cd.count > 0, `Expected direct cross-domain persistence detected, got ${cd.count}`);
    assert(cd.samples.some(s => s.callerModule === 'crm' && s.delegate === 'warehouseStock'), 'CRM accessing warehouseStock should be flagged');
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
});

// 6. Mutation: shared dumping ground
test('Mutation: shared dumping ground is caught by findSharedDumpingGround', () => {
  const targetFile = path.join(ROOT, 'backend/src/shared/temp_dumping_ground.ts');
  fs.writeFileSync(targetFile, "export class OrderWorkflowStateMachine { processOrder() {} }\n");
  try {
    const dg = analyzers.findSharedDumpingGround(ROOT);
    assert(dg.count > 0, `Expected shared dumping ground detected, got ${dg.count}`);
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
});

// 7. Mutation: orphan provider
test('Mutation: orphan provider is caught by findOrphanProviders', () => {
  const targetFile = path.join(ROOT, 'backend/src/modules/auth/temp_orphan_provider.ts');
  fs.writeFileSync(targetFile, "import { Injectable } from '@nestjs/common';\n@Injectable()\nexport class OrphanProviderMut {}\n");
  try {
    const orphans = analyzers.findOrphanProviders(ROOT);
    assert(orphans.count > 0, `Expected orphan provider detected, got ${orphans.count}`);
    assert(orphans.samples.some(s => s.class === 'OrphanProviderMut'), 'OrphanProviderMut should be flagged');
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
});

(async () => {
  for (const { desc, fn } of tests) {
    try {
      await fn();
      passed++;
      console.log(`  PASS: ${desc}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL: ${desc} -> ${err.stack || err.message}`);
    }
  }
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
