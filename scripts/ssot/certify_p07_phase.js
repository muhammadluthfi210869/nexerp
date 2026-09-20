#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const CONTRACT_PATH = path.join(__dirname, 'p07_acceptance_contract.json');
const IMPLEMENTATION_PATH = path.join(__dirname, 'lib/p07_certification.js');
const OUT = path.join(ROOT, 'docs/legacy-erp/verification/evidence/P07_PHASE_CERTIFICATION_RESULT.json');

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error(String(result.stderr || result.stdout || `git ${args.join(' ')} failed`));
  return String(result.stdout || '').replace(/[\r\n]+$/, '');
}

function normalize(value) { return String(value || '').replace(/\\/g, '/'); }
function assert(condition, message) { if (!condition) throw new Error(message); }

function parsePorcelainLine(line) {
  if (!line || line.length < 4) return null;
  const status = line.slice(0, 2);
  let file = line.slice(3);
  if (file.includes(' -> ')) file = file.split(' -> ').pop();
  return { status, file: normalize(file.replace(/^"|"$/g, '')) };
}

function dirtyOutsideAllowlist(contract) {
  const allow = new Set(contract.generated_output_allowlist.map(normalize));
  return git(['status', '--porcelain'])
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parsePorcelainLine)
    .filter(item => item && item.file && !allow.has(item.file));
}

function containsCredentialMaterial(value) {
  const raw = JSON.stringify(value || {});
  return /postgres(?:ql)?:\/\//i.test(raw) || /:\/\/[^@/\s]+@/.test(raw) || /(?:password|secret|token)\s*[=:]\s*[^\s"']{8,}/i.test(raw);
}

function exactMap(items, expectedIds, label) {
  assert(Array.isArray(items), `${label} must be an array`);
  const map = new Map(items.map(item => [item.id, item]));
  assert(map.size === expectedIds.length && items.length === expectedIds.length, `${label} count mismatch or duplicate IDs`);
  for (const id of expectedIds) assert(map.has(id), `Missing ${label}: ${id}`);
  return map;
}

function validateResult(contract, result, candidateSha) {
  assert(result && typeof result === 'object', 'P07 returned no structured result');
  assert(result.phase === 'P07' && result.level === 'PHASE_GATE', 'Invalid P07 identity/level');
  assert(result.phase_base_sha === contract.phase_base_sha, 'P07 phase base mismatch');
  assert(result.candidate_sha === candidateSha, 'P07 candidate SHA mismatch');
  assert(result.verdict === 'PASS' && result.synthetic === false && result.skipped_count === 0, 'P07 result is skipped/synthetic/not PASS');
  assert(!containsCredentialMaterial(result), 'P07 evidence contains credential material');

  const checks = exactMap(result.checks, contract.required_checks, 'check');
  for (const id of contract.required_checks) {
    const check = checks.get(id);
    assert(check.status === 'PASS' && check.executed === true && check.synthetic === false && check.skipped === false, `P07 check not honestly executed: ${id}`);
    assert(check.phase_base_sha === contract.phase_base_sha && check.candidate_sha === candidateSha, `Stale check evidence: ${id}`);
    assert(Number.isFinite(check.duration_ms) && check.duration_ms >= 0, `Missing duration: ${id}`);
    assert(Number.isInteger(check.target_count) && check.target_count > 0, `Zero/unparseable targets: ${id}`);
    assert(Array.isArray(check.commands) && check.commands.length > 0 && check.commands.every(command => command && command.exit_code === 0 && typeof command.command === 'string'), `Missing/failing commands: ${id}`);
  }

  const mutations = exactMap(result.mutations, contract.required_mutations, 'mutation');
  for (const id of contract.required_mutations) {
    const mutation = mutations.get(id);
    assert(mutation.status === 'PASS' && mutation.production_path === true, `P07 mutation did not prove production-path rejection: ${id}`);
    assert(mutation.expected_gate_id && mutation.observed_gate_id === mutation.expected_gate_id, `P07 mutation gate mismatch: ${id}`);
    assert(mutation.expected_reason_code && mutation.observed_reason_code === mutation.expected_reason_code, `P07 mutation reason mismatch: ${id}`);
    assert(typeof mutation.gate_function === 'string' && mutation.gate_function.length > 0, `Missing gate function: ${id}`);
    assert(typeof mutation.mutated_target === 'string' && mutation.mutated_target.length > 0, `Missing mutated target: ${id}`);
  }

  const subphases = exactMap(result.subphases, contract.required_subphases, 'subphase');
  for (const id of contract.required_subphases) {
    const subphase = subphases.get(id);
    assert(subphase.status === 'PASS' && subphase.executed === true, `Subphase not green: ${id}`);
    assert(Array.isArray(subphase.test_ids) && subphase.test_ids.length > 0, `Subphase has no tests: ${id}`);
  }

  const seams = exactMap(result.seams, contract.required_seams, 'seam');
  for (const id of contract.required_seams) {
    const seam = seams.get(id);
    assert(seam.status === 'PASS' && seam.executed === true && seam.target_count > 0, `Seam not green: ${id}`);
    assert(Array.isArray(seam.positive_test_ids) && seam.positive_test_ids.length > 0, `Seam missing positive proof: ${id}`);
    assert(Array.isArray(seam.failure_test_ids) && seam.failure_test_ids.length > 0, `Seam missing failure proof: ${id}`);
  }

  for (const [key, expected] of Object.entries(contract.exact_thresholds)) {
    assert(result.metrics && result.metrics[key] === expected, `Exact threshold failed: ${key}`);
  }
  for (const [key, maximum] of Object.entries(contract.maximum_thresholds)) {
    assert(Number.isFinite(result.metrics && result.metrics[key]) && result.metrics[key] <= maximum, `Maximum threshold failed: ${key}`);
  }
  for (const [key, minimum] of Object.entries(contract.minimum_thresholds)) {
    assert(Number.isFinite(result.metrics && result.metrics[key]) && result.metrics[key] >= minimum, `Minimum threshold failed: ${key}`);
  }

  assert(result.safety && result.safety.source_integrity_preserved === true, 'Source integrity proof missing');
  assert(Array.isArray(result.safety.created_databases) && result.safety.created_databases.length > 0, 'Created database inventory missing');
  assert(Array.isArray(result.safety.dropped_databases) && result.safety.created_databases.length === result.safety.dropped_databases.length, 'P07 database cleanup imbalance');
  assert(result.safety.created_databases.every(name => /^nex_p07_[a-z0-9_]+$/.test(name) && result.safety.dropped_databases.includes(name)), 'Unsafe or uncleared P07 database');
  assert(result.evidence && result.evidence.canonical_inventory_sha256 && result.evidence.subphase_result_sha256 && result.evidence.seam_matrix_sha256 && result.evidence.scope_manifest_sha256, 'P07 evidence digests missing');
}

async function main() {
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
  const candidateSha = git(['rev-parse', 'HEAD']);
  const evidence = {
    phase: 'P07', level: 'PHASE_GATE', contract_version: contract.contract_version,
    phase_base_sha: contract.phase_base_sha, candidate_sha: candidateSha,
    started_at: new Date().toISOString(), completed_at: null,
    verdict: 'FAIL', token: null, result: null, failure: null
  };

  try {
    assert(process.argv.length === 2, 'P07 certification accepts no arguments, skip, fast, or cached mode');
    assert(git(['merge-base', contract.phase_base_sha, candidateSha]) === contract.phase_base_sha, 'Candidate does not descend from frozen P07 base');
    const registry = fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml'), 'utf8');
    const predecessorPattern = new RegExp(`- id: P06[\\s\\S]*?status: PASS`);
    assert(predecessorPattern.test(registry), 'P06 exact predecessor PASS is required');
    const dirty = dirtyOutsideAllowlist(contract);
    assert(dirty.length === 0, `Dirty files outside P07 generated allowlist: ${JSON.stringify(dirty)}`);
    assert(fs.existsSync(IMPLEMENTATION_PATH), 'Missing scripts/ssot/lib/p07_certification.js implementation');
    const implementation = require(IMPLEMENTATION_PATH);
    assert(typeof implementation.certifyP07 === 'function', 'p07_certification.js must export certifyP07');
    const result = await implementation.certifyP07({ root: ROOT, contract, candidateSha });
    evidence.result = result;
    validateResult(contract, result, candidateSha);
    const postDirty = dirtyOutsideAllowlist(contract);
    assert(postDirty.length === 0, `P07 certification dirtied source files: ${JSON.stringify(postDirty)}`);
    evidence.verdict = 'PHASE_PASS';
    evidence.token = `P07:${candidateSha}:PHASE_PASS`;
  } catch (error) {
    evidence.failure = String(error && (error.stack || error.message) || error).slice(0, 12000);
    process.exitCode = 1;
  } finally {
    evidence.completed_at = new Date().toISOString();
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({ phase: evidence.phase, candidate_sha: evidence.candidate_sha, verdict: evidence.verdict, token: evidence.token, evidence: normalize(path.relative(ROOT, OUT)), failure: evidence.failure }, null, 2));
    if (evidence.verdict !== 'PHASE_PASS') process.exitCode = 1;
  }
}

main();