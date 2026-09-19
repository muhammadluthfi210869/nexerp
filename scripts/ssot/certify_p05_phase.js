#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const CONTRACT_PATH = path.join(__dirname, 'p05_acceptance_contract.json');
const IMPLEMENTATION_PATH = path.join(__dirname, 'lib/p05_certification.js');
const OUT = path.join(ROOT, 'docs/legacy-erp/verification/evidence/P05_PHASE_CERTIFICATION_RESULT.json');

function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0) throw new Error(String(r.stderr || r.stdout || `git ${args.join(' ')} failed`));
  return String(r.stdout || '').replace(/[\r\n]+$/, '');
}

function normalize(v) { return String(v || '').replace(/\\/g, '/'); }
function assert(ok, message) { if (!ok) throw new Error(message); }

function parsePorcelainLine(line) {
  if (!line || line.length < 4) return null;
  const status = line.slice(0, 2);
  let file = line.slice(3);
  if (file.includes(' -> ')) {
    file = file.split(' -> ').pop();
  }
  file = normalize(file.replace(/^"|"$/g, ''));
  return { status, file };
}

function dirtyOutsideAllowlist(contract) {
  const allow = new Set(contract.generated_output_allowlist.map(normalize));
  return git(['status', '--porcelain']).split(/\r?\n/).filter(Boolean).map(parsePorcelainLine).filter(x => x && x.file && !allow.has(x.file));
}

function containsCredentialMaterial(value) {
  const raw = JSON.stringify(value || {});
  return /postgres(?:ql)?:\/\//i.test(raw) || /:\/\/[^@/\s]+@/.test(raw);
}

function validateResult(contract, result, candidateSha) {
  assert(result && typeof result === 'object', 'P05 returned no structured result');
  assert(result.phase === 'P05' && result.level === 'PHASE_GATE', 'Invalid P05 identity/level');
  assert(result.phase_base_sha === contract.phase_base_sha, 'P05 phase base mismatch');
  assert(result.candidate_sha === candidateSha, 'P05 candidate SHA mismatch');
  assert(result.verdict === 'PASS' && result.synthetic !== true && result.skipped_count === 0, 'P05 result is skipped/synthetic/not PASS');
  assert(!containsCredentialMaterial(result), 'P05 evidence contains a connection URL or URL user-info');

  const checks = new Map((result.checks || []).map(x => [x.id, x]));
  assert(checks.size === contract.required_checks.length, 'P05 check count mismatch or duplicate IDs');
  for (const id of contract.required_checks) {
    const c = checks.get(id);
    assert(c, `Missing P05 check: ${id}`);
    assert(c.status === 'PASS' && c.executed === true && c.synthetic !== true && c.skipped !== true, `P05 check not honestly executed: ${id}`);
    assert(c.phase_base_sha === contract.phase_base_sha && c.candidate_sha === candidateSha, `Stale check evidence: ${id}`);
    assert(Number.isFinite(c.duration_ms) && c.duration_ms >= 0, `Missing duration: ${id}`);
    assert(Array.isArray(c.commands) && c.commands.length > 0 && c.commands.every(x => x && x.exit_code === 0 && typeof x.command === 'string'), `Missing/failing commands: ${id}`);
    assert(Number.isInteger(c.target_count) && c.target_count > 0, `Zero/unparseable targets: ${id}`);
  }

  const mutations = new Map((result.mutations || []).map(x => [x.id, x]));
  assert(mutations.size === contract.required_mutations.length, 'P05 mutation count mismatch or duplicate IDs');
  for (const id of contract.required_mutations) {
    const m = mutations.get(id);
    assert(m && m.status === 'PASS' && m.production_path === true, `P05 mutation did not prove production-path rejection: ${id}`);
    assert(typeof m.gate_function === 'string' && m.gate_function.length > 0, `Missing gate_function: ${id}`);
    assert(typeof m.mutated_target === 'string' && m.mutated_target.length > 0, `Missing mutated_target: ${id}`);
    assert(typeof m.gate_id === 'string' && typeof m.reason_code === 'string', `Missing structured rejection: ${id}`);
  }

  for (const [key, expected] of Object.entries(contract.exact_thresholds)) {
    assert(result.metrics && result.metrics[key] === expected, `Exact threshold failed: ${key}`);
  }
  for (const [key, max] of Object.entries(contract.maximum_thresholds)) {
    assert(Number.isFinite(result.metrics && result.metrics[key]) && result.metrics[key] <= max, `Maximum threshold failed: ${key}`);
  }
  for (const [key, min] of Object.entries(contract.minimum_thresholds)) {
    assert(Number.isFinite(result.metrics && result.metrics[key]) && result.metrics[key] >= min, `Minimum threshold failed: ${key}`);
  }

  assert(result.safety && result.safety.source_integrity_preserved === true, 'Source integrity proof missing');
  assert(Array.isArray(result.safety.created_databases) && Array.isArray(result.safety.dropped_databases), 'P05 DB inventory missing');
  assert(result.safety.created_databases.every(x => /^nex_p05_[a-z0-9_]+$/.test(x) && result.safety.dropped_databases.includes(x)), 'Unsafe or uncleared P05 database');
  assert(result.evidence && result.evidence.scope_manifest_sha256 && result.evidence.ownership_manifest_sha256 && result.evidence.dependency_graph_sha256 && result.evidence.control_matrix_sha256, 'P05 evidence manifest digests missing');
}

async function main() {
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
  const candidateSha = git(['rev-parse', 'HEAD']);
  const evidence = { phase: 'P05', level: 'PHASE_GATE', contract_version: contract.contract_version, phase_base_sha: contract.phase_base_sha, candidate_sha: candidateSha, started_at: new Date().toISOString(), completed_at: null, verdict: 'FAIL', token: null, result: null, failure: null };

  try {
    assert(process.argv.length === 2, 'P05 certification accepts no arguments, skip, fast, or cached mode');
    assert(git(['merge-base', contract.phase_base_sha, candidateSha]) === contract.phase_base_sha, 'Candidate does not descend from P05 frozen base');
    const registry = fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml'), 'utf8');
    assert(/- id: P04[\s\S]*?status: PASS[\s\S]*?candidate_sha: 5195fa2aaa838ebb7faea2a3b207f27689b7ed4a/.test(registry), 'P04 exact predecessor PASS is required');
    const dirty = dirtyOutsideAllowlist(contract);
    assert(dirty.length === 0, `Dirty files outside P05 generated allowlist: ${JSON.stringify(dirty)}`);
    assert(fs.existsSync(IMPLEMENTATION_PATH), 'Create scripts/ssot/lib/p05_certification.js; no implementation exists yet');

    const implementation = require(IMPLEMENTATION_PATH);
    assert(typeof implementation.certifyP05 === 'function', 'p05_certification.js must export certifyP05');
    const result = await implementation.certifyP05({ root: ROOT, contract, candidateSha });
    evidence.result = result;
    validateResult(contract, result, candidateSha);
    const postDirty = dirtyOutsideAllowlist(contract);
    assert(postDirty.length === 0, `P05 certification dirtied source files: ${JSON.stringify(postDirty)}`);
    evidence.verdict = 'PHASE_PASS';
    evidence.token = `P05:${candidateSha}:PHASE_PASS`;
  } catch (error) {
    evidence.failure = String(error && (error.stack || error.message) || error).slice(0, 12000);
    process.exitCode = 1;
  } finally {
    evidence.completed_at = new Date().toISOString();
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.writeFileSync(OUT, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
        break;
      } catch (err) {
        if (attempt === 4) throw err;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
      }
    }
    console.log(JSON.stringify({ phase: evidence.phase, candidate_sha: evidence.candidate_sha, verdict: evidence.verdict, token: evidence.token, evidence: normalize(path.relative(ROOT, OUT)), failure: evidence.failure }, null, 2));
    if (evidence.verdict !== 'PHASE_PASS') process.exitCode = 1;
  }
}

main();

