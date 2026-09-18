#!/usr/bin/env node
'use strict';

// Fast P03 phase gate. Heavy clean-room, Docker runtime, deployed E2E, load,
// browser-matrix and DR certification are intentionally deferred to checkpoints
// and P20-P22. There is no certifying fast/skip option because this is already
// the bounded phase-level command.

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { runAudit } = require('./audit_p03_architecture_gates');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/legacy-erp/verification/evidence/P03_PHASE_CERTIFICATION_RESULT.json');
const REQUIRED_MUTATIONS = [
  'BB-LOCK-MISMATCH',
  'BB-UNIT-COMMAND-FAILURE',
  'BB-CHANGED-DUP-6PLUS',
  'BB-CHANGED-COMPLEXITY-6PLUS',
  'BB-STALE-REGISTRY',
  'BB-DNA-CHILD-COMPONENT',
  'BB-DNA-ALIAS-REEXPORT',
  'BB-DNA-EXCEPTED-FILE-SECOND-OCCURRENCE'
];

if (process.argv.length > 2) {
  console.error('P03 phase certification accepts no arguments.');
  process.exit(2);
}

const result = {
  phase: 'P03',
  level: 'PHASE_GATE',
  heavy_checks_deferred_to: ['INTEGRATION_CHECKPOINT', 'P20', 'P21', 'P22'],
  candidate_sha: null,
  verdict: 'FAIL',
  token: null,
  started_at: new Date().toISOString(),
  completed_at: null,
  checks: [],
  failure: null
};

function short(value, limit = 8000) {
  const text = String(value || '').replace(/\u001b\[[0-9;]*m/g, '');
  return text.length <= limit ? text : `${text.slice(0, limit)}\n...[truncated]`;
}

function record(id, command, code, started, stdout, stderr) {
  const entry = {
    id, command, exit_code: code, duration_ms: Date.now() - started,
    stdout: short(stdout), stderr: short(stderr)
  };
  result.checks.push(entry);
  return entry;
}

function run(id, command, args, timeout = 15 * 60 * 1000) {
  const started = Date.now();
  const p = spawnSync(command, args, {
    cwd: ROOT, env: { ...process.env, CI: 'true', NODE_OPTIONS: '--max-old-space-size=8192' },
    encoding: 'utf8', shell: process.platform === 'win32', timeout,
    maxBuffer: 100 * 1024 * 1024
  });
  const entry = record(id, [command, ...args].join(' '), p.status, started, p.stdout, p.stderr);
  if (p.error || p.status !== 0) throw new Error(`${id} failed: ${p.error?.message || entry.stderr || entry.stdout}`);
  return entry;
}

function runAsync(id, command, args, timeout = 15 * 60 * 1000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const p = spawn(command, args, {
      cwd: ROOT, env: { ...process.env, CI: 'true', NODE_OPTIONS: '--max-old-space-size=8192' },
      shell: process.platform === 'win32'
    });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', d => { stdout += d; });
    p.stderr.on('data', d => { stderr += d; });
    const timer = setTimeout(() => p.kill(), timeout);
    p.on('error', error => {
      clearTimeout(timer);
      record(id, [command, ...args].join(' '), null, started, stdout, `${stderr}\n${error.message}`);
      reject(error);
    });
    p.on('close', code => {
      clearTimeout(timer);
      const entry = record(id, [command, ...args].join(' '), code, started, stdout, stderr);
      if (code !== 0) reject(new Error(`${id} failed: ${entry.stderr || entry.stdout}`));
      else resolve(entry);
    });
  });
}

function assertCheck(id, ok, details) {
  result.checks.push({ id, exit_code: ok ? 0 : 1, duration_ms: 0, details });
  if (!ok) throw new Error(`${id} failed: ${JSON.stringify(details)}`);
}

function git(args) {
  const p = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  if (p.status !== 0) throw new Error(p.stderr || `git ${args.join(' ')} failed`);
  return String(p.stdout || '').trim();
}

async function main() {
  const major = Number(process.versions.node.split('.')[0]);
  assertCheck('supported_node', major >= 20 && major < 23, { observed: process.version, accepted: '20-22' });
  result.candidate_sha = git(['rev-parse', 'HEAD']);
  assertCheck('committed_candidate', git(['status', '--porcelain']) === '',
    'Run from a clean dedicated branch/worktree; certification never includes unstaged or untracked implementation');
  assertCheck('runner_committed', git(['ls-files', '--', 'scripts/ssot/certify_p03_phase.js']) === 'scripts/ssot/certify_p03_phase.js',
    'Commit the phase runner before certification');

  const verifier = fs.readFileSync(path.join(ROOT, 'scripts/ssot/verify_clean_checkout_build.js'), 'utf8');
  assertCheck('unsafe_verifier_removed',
    !/symlinkSync\s*\(|['"]junction['"]|Boolean\(process\.env\.CI\)/.test(verifier),
    'No shared node_modules junction or CI artifact bypass may remain');
  const ci = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8');
  assertCheck('ci_uses_phase_gate', ci.includes('node scripts/ssot/certify_p03_phase.js'),
    'CI must call the same P03 phase command');

  // Lockfile reproducibility without reinstalling the entire tree on every phase attempt.
  await Promise.all([
    runAsync('root_lock_dry_run', 'npm', ['ci', '--dry-run', '--ignore-scripts', '--no-audit']),
    runAsync('backend_lock_dry_run', 'npm', ['--prefix', 'backend', 'ci', '--dry-run', '--ignore-scripts', '--no-audit']),
    runAsync('frontend_lock_dry_run', 'npm', ['--prefix', 'frontend', 'ci', '--dry-run', '--ignore-scripts', '--no-audit'])
  ]);
  run('prisma_generate', 'npm', ['--prefix', 'backend', 'run', 'prisma:generate']);

  await Promise.all([
    runAsync('ssot', 'node', ['scripts/ssot/validate_ssot.js']),
    runAsync('p02', 'node', ['scripts/ssot/audit_lifecycle_reconciliation.js']),
    runAsync('p02_negative', 'node', ['scripts/ssot/test_lifecycle_reconciliation_negative.js'])
  ]);
  await Promise.all([
    runAsync('backend_typecheck', 'npx', ['tsc', '-p', 'backend/tsconfig.build.json', '--noEmit']),
    runAsync('frontend_typecheck', 'npx', ['tsc', '--project', 'frontend/tsconfig.json', '--noEmit'])
  ]);
  await Promise.all([
    runAsync('backend_lint', 'npm', ['--prefix', 'backend', 'run', 'lint']),
    runAsync('frontend_lint', 'npm', ['--prefix', 'frontend', 'run', 'lint'])
  ]);
  await Promise.all([
    runAsync('backend_unit', 'npm', ['--prefix', 'backend', 'run', 'test:unit']),
    runAsync('frontend_unit', 'npm', ['--prefix', 'frontend', 'run', 'test'])
  ]);
  await Promise.all([
    runAsync('backend_build', 'npm', ['--prefix', 'backend', 'run', 'build']),
    runAsync('frontend_build', 'npm', ['--prefix', 'frontend', 'run', 'build'])
  ]);

  const auditStarted = Date.now();
  const audit = runAudit({
    typecheck: { skipSubprocess: true },
    lint: { skipSubprocess: true },
    unit_smoke: { skipSubprocess: true }
  });
  record('p03_static_architecture_dna', 'runAudit after real type/lint/unit/build', audit.verdict === 'PASS' ? 0 : 1,
    auditStarted, JSON.stringify({ passed: audit.passed_tests, total: audit.total_tests }), JSON.stringify(audit.results));
  assertCheck('p03_21_of_21', audit.verdict === 'PASS' && audit.passed_tests === 21, audit);

  const negative = run('p03_adversarial', 'node', ['scripts/ssot/test_p03_architecture_gates_negative.js']);
  const output = `${negative.stdout}\n${negative.stderr}`;
  const missing = REQUIRED_MUTATIONS.filter(id => !output.includes(id));
  assertCheck('required_mutations_present', missing.length === 0, { missing });

  result.verdict = 'PHASE_PASS';
  result.token = `P03:${result.candidate_sha}:PHASE_PASS`;
}

(async () => {
  try {
    await main();
  } catch (error) {
    result.failure = short(error.stack || error.message || error);
    process.exitCode = 1;
  } finally {
    result.completed_at = new Date().toISOString();
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({
      phase: result.phase, level: result.level, candidate_sha: result.candidate_sha,
      verdict: result.verdict, token: result.token,
      evidence: path.relative(ROOT, OUT).replace(/\\/g, '/')
    }, null, 2));
    if (result.verdict !== 'PHASE_PASS') process.exitCode = 1;
  }
})();

