#!/usr/bin/env node
'use strict';

// Fast P03 phase gate. Heavy clean-room, Docker runtime, deployed E2E, load,
// browser-matrix and DR certification are intentionally deferred to checkpoints
// and P20-P22. There is no certifying fast/skip option because this is already
// the bounded phase-level command.

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { runProductionAudit } = require('./audit_p03_architecture_gates');
const auditOptions = require('./p03_audit_options');
const { parseBackendTestResult, parseFrontendTestResult, parseEslintResult } = require('./lib/test_result_parser');

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
  'BB-DNA-EXCEPTED-FILE-SECOND-OCCURRENCE',
  'BB-DIFF-BASE-STALE',
  'BB-STALE-SCOPE-LEDGER',
  'BB-ZERO-APPLICABLE-SCOPE',
  'BB-CHANGED-LINT-WARNING',
  'BB-BROAD-DNA-EXCEPTION',
  'BB-UNEXPECTED-TEST-SKIP',
  'BB-CI-GENERATED-DIRTY',
  'BB-SUBPROCESS-RESULT-SUBSTITUTION',
  'BB-NODE-ENGINE-MISMATCH',
  'BB-PRISMA-VERSION-MISMATCH',
  'BB-DNA-SUBPATH-IMPORT'
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
  failure: null,
  metrics: null
};

const FULL_LOG_LIMIT = 1024 * 1024; // 1 MiB cap for raw output capture
const EVIDENCE_LOG_LIMIT = 4096;     // concise summary preserved in evidence

function stripAnsi(value) {
  return String(value || '').replace(/\[[0-9;]*m/g, '');
}

function short(value, limit = EVIDENCE_LOG_LIMIT) {
  const text = stripAnsi(value);
  return text.length <= limit ? text : `${text.slice(0, limit)}\n...[truncated ${text.length - limit} chars]`;
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
    maxBuffer: FULL_LOG_LIMIT
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

/**
 * Regenerate the scope manifest + ledger at runner startup using the actual
 * git diff between the declared P03 phase base and HEAD. The contract is:
 *   - `base_commit_sha` equals the declared phase base.
 *   - `candidate_commit_sha` equals HEAD.
 *   - `total_changed_paths` equals the path list length, which must be the
 *     byte-for-byte `git diff --name-only` of that range.
 */
function regenerateManifestAndLedger(headSha) {
  const phaseBase = auditOptions.PHASE_BASE_SHA;
  const diffText = git(['diff', '--name-only', phaseBase, 'HEAD']);
  const diffFiles = diffText.split('\n').map(s => s.trim()).filter(Boolean);

  const manifest = {
    manifest_version: '1.0.0',
    generated_at: new Date().toISOString(),
    base_commit_sha: phaseBase,
    candidate_commit_sha: headSha,
    total_changed_paths: diffFiles.length,
    paths: diffFiles.map(p => ({ path: p, applicable_analyzers: [] }))
  };
  fs.writeFileSync(
    path.join(ROOT, 'docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_MANIFEST.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  );

  // The path-level scope ledger mirrors the same numbers and references the candidate SHA.
  const ledgerLines = [];
  ledgerLines.push('# NEX ERP — Phase P03 Path-Level Scope Ledger');
  ledgerLines.push('');
  ledgerLines.push('## Scope Ledger Metadata');
  ledgerLines.push('');
  ledgerLines.push(`- **Base Commit SHA:** \`${phaseBase}\``);
  ledgerLines.push(`- **Candidate Commit SHA:** \`${headSha}\``);
  ledgerLines.push(`- **Total Changed Paths in Git Diff:** ${diffFiles.length}`);
  ledgerLines.push(`- **Generated At:** ${new Date().toISOString()}`);
  ledgerLines.push('');
  ledgerLines.push('## Path Index');
  ledgerLines.push('');
  for (let i = 0; i < diffFiles.length; i++) {
    const f = diffFiles[i];
    const id = String(i + 1).padStart(3, '0');
    ledgerLines.push(`| ${id} | \`${f}\` | P03 | Generated Manifest Path | YES |`);
  }
  ledgerLines.push('');
  ledgerLines.push('## Scope Attribution & Architecture Ratchet Truth');
  ledgerLines.push('');
  ledgerLines.push(`Immutable diff authority is strictly enforced between Base \`${phaseBase}\` and candidate \`HEAD\`. No changed source files are excluded from examination using manual ledger classifications.`);
  ledgerLines.push('');
  fs.writeFileSync(
    path.join(ROOT, 'docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_LEDGER.md'),
    ledgerLines.join('\n'),
    'utf8'
  );

  return { count: diffFiles.length, manifest };
}

async function main() {
  const major = Number(process.versions.node.split('.')[0]);
  assertCheck('supported_node', major >= 22, { observed: process.version, accepted: '>=22' });

  const backendPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'backend/package.json'), 'utf8'));
  const prismaDep = backendPkg.devDependencies?.prisma || backendPkg.dependencies?.prisma;
  const clientDep = backendPkg.dependencies?.['@prisma/client'];
  assertCheck('prisma_toolchain_pinned', Boolean(prismaDep && clientDep && prismaDep === clientDep && !prismaDep.startsWith('^') && !prismaDep.startsWith('~')), {
    prisma: prismaDep,
    client: clientDep
  });

  result.candidate_sha = git(['rev-parse', 'HEAD']);

  // R5-B3 + R5-B1: pre-flight source integrity + manifest regeneration.
  // Disallow tracked file changes outside the canonical generated-output allowlist,
  // so the runner cannot be invoked on a half-merged tree.
  const preDisallowed = auditOptions.findDisallowedTrackedDirty();
  assertCheck('pre_run_source_integrity', preDisallowed.length === 0, { disallowed: preDisallowed });

  const regen = regenerateManifestAndLedger(result.candidate_sha);
  assertCheck('manifest_regenerated', regen.manifest.candidate_commit_sha === result.candidate_sha && regen.manifest.base_commit_sha === auditOptions.PHASE_BASE_SHA, {
    candidate: regen.manifest.candidate_commit_sha,
    base: regen.manifest.base_commit_sha,
    count: regen.count
  });

  assertCheck('runner_committed', git(['ls-files', '--', 'scripts/ssot/certify_p03_phase.js']) === 'scripts/ssot/certify_p03_phase.js',
    'Commit the phase runner before certification');

  const verifier = fs.readFileSync(path.join(ROOT, 'scripts/ssot/verify_clean_checkout_build.js'), 'utf8');
  assertCheck('unsafe_verifier_removed',
    !/symlinkSync\s*\(|['"]junction['"]|Boolean\(process\.env\.CI\)/.test(verifier),
    'No shared node_modules junction or CI artifact bypass may remain');
  const ci = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8');
  assertCheck('ci_uses_phase_gate', ci.includes('node scripts/ssot/certify_p03_phase.js'),
    'CI must call the same P03 phase command');
  // R5-B3: CI must consume the same allowlist as the runner.
  const allowlist = auditOptions.GENERATED_OUTPUT_ALLOWLIST;
  assertCheck('ci_uses_generated_output_allowlist',
    allowlist.every(p => ci.includes(`':(exclude)${p}'`)),
    `CI must use the canonical generated-output allowlist (${allowlist.length} paths)`);

  // Lockfile reproducibility without reinstalling the entire tree on every phase attempt.
  await Promise.all([
    runAsync('root_lock_dry_run', 'npm', ['ci', '--dry-run', '--ignore-scripts', '--no-audit']),
    runAsync('backend_lock_dry_run', 'npm', ['--prefix', 'backend', 'ci', '--dry-run', '--ignore-scripts', '--no-audit']),
    runAsync('frontend_lock_dry_run', 'npm', ['--prefix', 'frontend', 'ci', '--dry-run', '--ignore-scripts', '--no-audit'])
  ]);

  // R5-B5: Read installed @prisma/client package.json, not stdout "mismatch" regex.
  const installedPrismaPath = path.join(ROOT, 'backend/node_modules/@prisma/client/package.json');
  let installedClientVersion = null;
  let prismaClientParseable = false;
  if (fs.existsSync(installedPrismaPath)) {
    try {
      const installed = JSON.parse(fs.readFileSync(installedPrismaPath, 'utf8'));
      if (typeof installed.version === 'string' && installed.version.trim() !== '') {
        installedClientVersion = installed.version.trim();
        prismaClientParseable = true;
      }
    } catch (_) {
      prismaClientParseable = false;
    }
  }
  const cliOutput = run('prisma_version_check', 'npm', ['--prefix', 'backend', 'exec', '--', 'prisma', '-v']);
  // Extract CLI version strictly from the `prisma               : X.Y.Z` line
  const cliLines = stripAnsi(cliOutput.stdout).split('\n');
  let cliVersion = null;
  for (const line of cliLines) {
    const m = line.match(/^\s*prisma\s*:\s*(\d+\.\d+\.\d+)/);
    if (m) { cliVersion = m[1]; break; }
  }
  // Hard-fail if the CLI itself reports "Not found" for installed pieces.
  const cliMissingFragment = /@prisma\/client\s*:\s*Not found/i.test(stripAnsi(cliOutput.stdout));
  assertCheck('prisma_toolchain_match',
    !cliMissingFragment &&
    Boolean(prismaClientParseable && installedClientVersion && cliVersion && cliVersion === installedClientVersion),
    {
      installed_client_version: installedClientVersion,
      cli_version: cliVersion,
      parseable: prismaClientParseable,
      cli_reported_missing: cliMissingFragment
    });

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
  const lintOutputs = await Promise.all([
    runAsync('backend_lint', 'npm', ['--prefix', 'backend', 'run', 'lint']),
    runAsync('frontend_lint', 'npm', ['--prefix', 'frontend', 'run', 'lint'])
  ]);
  const unitOutputs = await Promise.all([
    runAsync('backend_unit', 'npm', ['--prefix', 'backend', 'run', 'test:unit']),
    runAsync('frontend_unit', 'npm', ['--prefix', 'frontend', 'run', 'test'])
  ]);
  await Promise.all([
    runAsync('backend_build', 'npm', ['--prefix', 'backend', 'run', 'build']),
    runAsync('frontend_build', 'npm', ['--prefix', 'frontend', 'run', 'build'])
  ]);

  // R5-B4: machine-readable result parsing — captures truthful counts before any truncation.
  const metrics = {
    backend_jest: parseBackendTestResult(unitOutputs[0].stdout, unitOutputs[0].exit_code),
    frontend_vitest: parseFrontendTestResult(unitOutputs[1].stdout, unitOutputs[1].exit_code),
    backend_eslint: parseEslintResult(lintOutputs[0].stdout, lintOutputs[0].exit_code),
    frontend_eslint: parseEslintResult(lintOutputs[1].stdout, lintOutputs[1].exit_code)
  };
  result.metrics = metrics;
  assertCheck('metrics_present', Boolean(metrics.backend_jest && metrics.frontend_vitest && metrics.frontend_eslint && metrics.backend_eslint),
    'Full machine-readable backend/frontend test+lint metrics must parse from raw output');
  assertCheck('backend_tests_have_real_counts',
    metrics.backend_jest && metrics.backend_jest.passed > 0 && metrics.backend_jest.suites_passed > 0,
    metrics.backend_jest);

  const auditStarted = Date.now();
  // R5-B2: production audit MUST go through runProductionAudit so the strict
  // scope/ledger/allowlist options wired in p03_audit_options.js reach every
  // DNA gate, duplication, and complexity analyzer.
  const audit = runProductionAudit({
    typecheck: {
      backend: result.checks.find(c => c.id === 'backend_typecheck'),
      frontend: result.checks.find(c => c.id === 'frontend_typecheck')
    },
    lint: {
      backend: lintOutputs[0],
      frontend: lintOutputs[1]
    },
    unit_smoke: {
      backend: unitOutputs[0],
      frontend: unitOutputs[1]
    }
  });
  record('p03_static_architecture_dna', 'runProductionAudit after real type/lint/unit/build', audit.verdict === 'PASS' ? 0 : 1,
    auditStarted, JSON.stringify({ passed: audit.passed_tests, total: audit.total_tests }), JSON.stringify(audit.results));
  assertCheck('p03_21_of_21', audit.verdict === 'PASS' && audit.passed_tests === 21, audit);

  const negative = run('p03_adversarial', 'node', ['scripts/ssot/test_p03_architecture_gates_negative.js']);
  const output = `${negative.stdout}\n${negative.stderr}`;
  const missing = REQUIRED_MUTATIONS.filter(id => !output.includes(id));
  assertCheck('required_mutations_present', missing.length === 0, { missing });

  // R5-B3: post-run source integrity. Same allowlist used by `.github/workflows/ci.yml`.
  const postDisallowed = auditOptions.findDisallowedTrackedDirty();
  assertCheck('post_run_source_integrity', postDisallowed.length === 0, { disallowed: postDisallowed });

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
