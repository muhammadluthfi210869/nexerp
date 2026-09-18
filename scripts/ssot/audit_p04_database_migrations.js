#!/usr/bin/env node
'use strict';

/**
 * NEX ERP — Phase P04 Database & Migration Audit Runner (Refactored)
 *
 * Replaces the legacy fixed-database audit with the unified target-safety
 * library and certification runner.
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { certifyP04 } = require('./lib/p04_certification');

const ROOT = path.resolve(__dirname, '../..');
const CONTRACT_PATH = path.join(__dirname, 'p04_acceptance_contract.json');

async function main() {
  console.log('===================================================================');
  console.log('NEX ERP — Phase P04 Database & Migration Audit Suite');
  console.log('===================================================================\n');

  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
  const candidateSha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();

  const result = await certifyP04({ root: ROOT, contract, candidateSha });

  console.log('\n===================================================================');
  console.log(`TOTAL CHECKS: ${result.checks.length}/${contract.required_checks.length} passed`);
  console.log(`MUTATIONS: ${result.mutations.length}/${contract.required_mutations.length} passed`);
  console.log(`OVERALL PHASE P04 VERDICT: ${result.verdict}`);
  console.log('===================================================================\n');

  if (result.verdict !== 'PASS') {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal audit runner error:', err);
    process.exit(1);
  });
}

module.exports = { main };
