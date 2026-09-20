#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const CONTRACT_PATH = path.join(__dirname, 'p07_acceptance_contract.json');
const IMPLEMENTATION_PATH = path.join(__dirname, 'lib/p07_certification.js');

function fail(message) {
  console.error(JSON.stringify({ phase: 'P07', verdict: 'NON_CERTIFYING', status: 'FAIL', error: message }, null, 2));
  process.exit(1);
}

function parseSelector(argv) {
  if (argv.length === 1 && argv[0] === '--list') return { type: 'list' };
  if (argv.length === 1 && argv[0] === '--changed') return { type: 'changed' };
  if (argv.length === 1 && argv[0] === '--preflight') return { type: 'preflight' };
  if (argv.length === 2 && ['--subphase', '--seam', '--gate', '--mutation'].includes(argv[0])) {
    return { type: argv[0].slice(2), id: argv[1] };
  }
  fail('Use --list, --changed, --subphase <id>, --seam <id>, --gate <id>, --mutation <id>, or --preflight');
}

function listContract() {
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
  return {
    phase: 'P07', verdict: 'NON_CERTIFYING', status: 'PASS',
    subphases: contract.required_subphases,
    seams: contract.required_seams,
    gates: contract.required_checks,
    mutations: contract.required_mutations,
    next_command: 'node scripts/ssot/diagnose_p07_phase.js --changed'
  };
}

async function main() {
  const selector = parseSelector(process.argv.slice(2));
  if (selector.type === 'list') {
    console.log(JSON.stringify(listContract(), null, 2));
    return;
  }
  if (!fs.existsSync(IMPLEMENTATION_PATH)) fail('Missing shared production-path implementation scripts/ssot/lib/p07_certification.js');
  const implementation = require(IMPLEMENTATION_PATH);
  if (typeof implementation.diagnoseP07 !== 'function') fail('p07_certification.js must export diagnoseP07');
  const started = Date.now();
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
  const result = await implementation.diagnoseP07({ root: ROOT, contract, selector });
  if (!result || typeof result !== 'object') fail('Diagnostic returned no structured result');
  const output = {
    phase: 'P07', verdict: 'NON_CERTIFYING', selector,
    status: result.status === 'PASS' ? 'PASS' : 'FAIL',
    target_count: result.target_count,
    executed_ids: result.executed_ids,
    duration_ms: Date.now() - started,
    reason_code: result.reason_code || (result.status === 'PASS' ? 'PASS' : 'DIAGNOSTIC_FAILED'),
    next_command: result.next_command,
    details: result.details || null
  };
  if (!Number.isInteger(output.target_count) || output.target_count <= 0) fail('Diagnostic selector resolved zero targets');
  console.log(JSON.stringify(output, null, 2));
  if (output.status !== 'PASS') process.exitCode = 1;
}

main().catch(error => fail(String(error && (error.stack || error.message) || error)));