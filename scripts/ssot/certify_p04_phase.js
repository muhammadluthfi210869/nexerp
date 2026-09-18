#!/usr/bin/env node
'use strict';

/**
 * Frozen P04 certification entrypoint.
 *
 * The implementation owner builds `lib/p04_certification.js` and the P04
 * adversarial suite against the immutable JSON contract. This entrypoint owns
 * token emission and refuses partial, skipped, stale, or synthetic results.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const CONTRACT_PATH = path.join(__dirname, 'p04_acceptance_contract.json');
const IMPLEMENTATION_PATH = path.join(__dirname, 'lib/p04_certification.js');
const OUT = path.join(ROOT, 'docs/legacy-erp/verification/evidence/P04_PHASE_CERTIFICATION_RESULT.json');

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  return String(result.stdout || '').trim();
}

function normalize(value) {
  return String(value || '').replace(/\\/g, '/');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function dirtyOutsideAllowlist(contract) {
  const allow = new Set(contract.generated_output_allowlist.map(normalize));
  return git(['status', '--porcelain']).split(/\r?\n/).filter(Boolean).map(line => {
    const status = line.slice(0, 2);
    const file = normalize(line.slice(3).trim().replace(/^"|"$/g, ''));
    return { status, file };
  }).filter(item => item.file && !allow.has(item.file));
}

function validateResult(contract, result, candidateSha) {
  assert(result && typeof result === 'object', 'P04 implementation returned no structured result');
  assert(result.phase === 'P04', 'Structured result phase must be P04');
  assert(result.level === 'PHASE_GATE', 'Structured result level must be PHASE_GATE');
  assert(result.candidate_sha === candidateSha, 'Result candidate SHA is stale or mismatched');
  assert(result.phase_base_sha === contract.phase_base_sha, 'Result phase base SHA differs from frozen contract');
  assert(result.synthetic !== true, 'Synthetic result cannot certify P04');
  assert(result.skipped_count === 0, 'Unexpected skipped checks are forbidden');

  const checks = new Map((result.checks || []).map(check => [check.id, check]));
  for (const id of contract.required_checks) {
    const check = checks.get(id);
    assert(check, `Missing required P04 check: ${id}`);
    assert(check.status === 'PASS', `Required P04 check did not PASS: ${id}`);
    assert(check.executed === true, `Required P04 check was not executed: ${id}`);
    assert(check.synthetic !== true && check.skipped !== true, `Required P04 check is synthetic/skipped: ${id}`);
  }

  const mutations = new Map((result.mutations || []).map(mutation => [mutation.id, mutation]));
  for (const id of contract.required_mutations) {
    const mutation = mutations.get(id);
    assert(mutation, `Missing required P04 mutation: ${id}`);
    assert(mutation.status === 'PASS' && mutation.production_path === true,
      `P04 mutation did not prove production-path rejection: ${id}`);
  }

  for (const [key, expected] of Object.entries(contract.thresholds)) {
    assert(Object.prototype.hasOwnProperty.call(result.metrics || {}, key), `Missing threshold metric: ${key}`);
    assert(result.metrics[key] === expected,
      `Threshold ${key} mismatch: observed=${result.metrics[key]} expected=${expected}`);
  }

  assert(result.safety && result.safety.source_database_untouched === true,
    'Source database untouched proof is required');
  assert(Array.isArray(result.safety.created_databases), 'Created database inventory is required');
  assert(Array.isArray(result.safety.dropped_databases), 'Dropped database inventory is required');
  assert(result.safety.created_databases.length > 0, 'No isolated P04 database was created');
  assert(result.safety.created_databases.every(name => /^nex_p04_[a-z0-9_]+$/.test(name)),
    'Unsafe temporary database name detected');
  assert(result.safety.created_databases.every(name => result.safety.dropped_databases.includes(name)),
    'Every isolated P04 database must be cleaned up');
  assert(result.verdict === 'PASS', 'P04 implementation verdict is not PASS');
}

async function main() {
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
  const candidateSha = git(['rev-parse', 'HEAD']);
  const evidence = {
    phase: 'P04',
    level: 'PHASE_GATE',
    contract_version: contract.contract_version,
    phase_base_sha: contract.phase_base_sha,
    candidate_sha: candidateSha,
    started_at: new Date().toISOString(),
    completed_at: null,
    verdict: 'FAIL',
    token: null,
    result: null,
    failure: null
  };

  try {
    assert(process.argv.length === 2, 'P04 certification accepts no arguments or skip modes');
    assert(git(['merge-base', contract.phase_base_sha, candidateSha]) === contract.phase_base_sha,
      'Candidate is not descended from the frozen P04 phase base');
    const registry = fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml'), 'utf8');
    assert(/- id: P03[\s\S]*?status: PASS[\s\S]*?candidate_sha: cf8b725d9fec4c808937c50217a3bc45050d271a/.test(registry),
      'P03 predecessor PASS bound to the certified SHA is required');
    const dirty = dirtyOutsideAllowlist(contract);
    assert(dirty.length === 0, `Dirty files outside P04 evidence allowlist: ${JSON.stringify(dirty)}`);
    assert(fs.existsSync(IMPLEMENTATION_PATH),
      'P04 implementation is not present: create scripts/ssot/lib/p04_certification.js from the frozen contract');

    const implementation = require(IMPLEMENTATION_PATH);
    assert(typeof implementation.certifyP04 === 'function', 'p04_certification.js must export certifyP04');
    const result = await implementation.certifyP04({ root: ROOT, contract, candidateSha });
    evidence.result = result;
    validateResult(contract, result, candidateSha);

    const postDirty = dirtyOutsideAllowlist(contract);
    assert(postDirty.length === 0, `Certification modified files outside evidence allowlist: ${JSON.stringify(postDirty)}`);
    evidence.verdict = 'PHASE_PASS';
    evidence.token = `P04:${candidateSha}:PHASE_PASS`;
  } catch (error) {
    evidence.failure = String(error && (error.stack || error.message) || error).slice(0, 12000);
    process.exitCode = 1;
  } finally {
    evidence.completed_at = new Date().toISOString();
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({
      phase: evidence.phase,
      candidate_sha: evidence.candidate_sha,
      verdict: evidence.verdict,
      token: evidence.token,
      evidence: normalize(path.relative(ROOT, OUT)),
      failure: evidence.failure
    }, null, 2));
    if (evidence.verdict !== 'PHASE_PASS') process.exitCode = 1;
  }
}

main();
