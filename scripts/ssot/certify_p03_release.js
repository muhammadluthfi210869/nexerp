#!/usr/bin/env node
'use strict';

/**
 * NEX ERP P03 — single authoritative certification runner.
 *
 * Contract:
 *   node scripts/ssot/certify_p03_release.js
 *
 * Exit 0 + verdict CERTIFIED_PASS means every P03 criterion below passed for
 * one immutable HEAD. There is intentionally no fast/skip/artifacts-only mode.
 * Diagnostic helpers such as --help and --print-plan never certify and exit 2.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const MARKER = '.nex-p03-owned-temp';
const RESULT_PATH = path.join(
  ROOT,
  'docs/legacy-erp/verification/evidence/P03_CERTIFICATION_RESULT.json'
);
const REQUIRED_P03_TESTS = [
  'clean_checkout_build', 'typecheck', 'lint', 'unit_smoke', 'container_build',
  'ci_required_check_test', 'module_boundary_test', 'dependency_direction_test',
  'circular_dependency_scan', 'unused_export_dependency_scan',
  'orphan_object_scan', 'duplicate_code_scan', 'changed_complexity_check',
  'dna_import_boundary_ast', 'dna_native_interactive_scan',
  'dna_primitive_duplication_scan', 'dna_hardcoded_visual_scan',
  'dna_barrel_integrity', 'dna_reference_route_and_composition',
  'dna_screen_coverage_manifest', 'dna_exception_registry_validation'
];
const REQUIRED_MUTATIONS = [
  'BB-LOCK-MISMATCH',
  'BB-CI-ISOLATION',
  'BB-SENTINEL-SURVIVAL',
  'BB-PRISMA-CLIENT-MISSING',
  'BB-DOCKER-UNAVAILABLE',
  'BB-CHANGED-DUP-6PLUS',
  'BB-CHANGED-COMPLEXITY-6PLUS',
  'BB-CHANGED-LINT-WARNING',
  'BB-STALE-REGISTRY',
  'BB-DNA-CHILD-COMPONENT',
  'BB-DNA-ALIAS-REEXPORT',
  'BB-DNA-NATIVE-SELECT',
  'BB-DNA-CLICK-DIV',
  'BB-DNA-STYLE-OBJECT',
  'BB-DNA-RAW-VISUAL-TOKEN',
  'BB-DNA-RENAMED-PRIMITIVE',
  'BB-DNA-EXCEPTED-FILE-SECOND-OCCURRENCE',
  'BB-CI-ARTIFACT-BYPASS'
];

const plan = [
  'preflight_candidate_and_gate_design',
  'security_and_environment_gate',
  'archive_immutable_head_without_shared_dependencies',
  'root_clean_install', 'backend_clean_install', 'frontend_clean_install',
  'prisma_validate_and_generate', 'ssot_and_p02_regression',
  'backend_and_frontend_typecheck', 'backend_and_frontend_lint',
  'backend_and_frontend_unit', 'backend_and_frontend_production_build',
  'p03_21_gate_audit', 'p03_required_black_box_mutations',
  'compose_validation', 'backend_and_frontend_image_build',
  'empty_postgres_migration_and_backend_health', 'frontend_http_smoke',
  'source_checkout_sentinel_and_git_integrity', 'write_bound_evidence'
];

if (process.argv.includes('--help') || process.argv.includes('--print-plan')) {
  console.log('P03 certifying command: node scripts/ssot/certify_p03_release.js');
  console.log('No fast, skip, cached-artifact, or partial mode can certify.');
  console.log(plan.map((x, i) => `${i + 1}. ${x}`).join('\n'));
  process.exitCode = 2;
  return;
}
if (process.argv.length > 2) {
  console.error(`Unsupported certification argument(s): ${process.argv.slice(2).join(' ')}`);
  process.exit(2);
}

const result = {
  schema_version: 1,
  phase: 'P03',
  verdict: 'FAIL',
  certification_token: null,
  started_at: new Date().toISOString(),
  completed_at: null,
  candidate_sha: null,
  base_sha: null,
  environment: {
    platform: process.platform,
    node: process.version,
    npm: null
  },
  required_tests: REQUIRED_P03_TESTS,
  required_mutations: REQUIRED_MUTATIONS,
  checks: [],
  failure: null
};

let tempRoot = null;
let tarPath = null;
let docker = null;

function compact(text, limit = 12000) {
  const value = String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
  return value.length <= limit ? value : `${value.slice(0, limit)}\n...[truncated]`;
}

function run(id, command, args, options = {}) {
  const started = Date.now();
  const proc = spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: options.timeout || 20 * 60 * 1000,
    maxBuffer: options.maxBuffer || 100 * 1024 * 1024
  });
  const entry = {
    id,
    command: [command, ...args].join(' '),
    cwd: path.relative(ROOT, options.cwd || ROOT) || '.',
    exit_code: proc.status,
    signal: proc.signal || null,
    duration_ms: Date.now() - started,
    stdout: compact(proc.stdout),
    stderr: compact(proc.stderr)
  };
  result.checks.push(entry);
  if (proc.error || proc.status !== 0) {
    throw new Error(`${id} failed (exit ${proc.status}): ${proc.error?.message || entry.stderr || entry.stdout}`);
  }
  return entry;
}

function assertion(id, ok, details) {
  result.checks.push({ id, exit_code: ok ? 0 : 1, duration_ms: 0, details });
  if (!ok) throw new Error(`${id} failed: ${typeof details === 'string' ? details : JSON.stringify(details)}`);
}

function gitText(args) {
  const proc = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  if (proc.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${proc.stderr}`);
  return String(proc.stdout || '').trim();
}

function section(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}`);
  const end = nextFunctionName ? source.indexOf(`function ${nextFunctionName}`, start + 1) : source.length;
  return start >= 0 ? source.slice(start, end >= 0 ? end : source.length) : '';
}

function verifyGateDesign() {
  const verifierPath = path.join(ROOT, 'scripts/ssot/verify_clean_checkout_build.js');
  const analyzerPath = path.join(ROOT, 'scripts/ssot/lib/p03_analyzers.js');
  const ciPath = path.join(ROOT, '.github/workflows/ci.yml');
  const backendDockerPath = path.join(ROOT, 'backend/Dockerfile');
  const frontendDockerPath = path.join(ROOT, 'frontend/Dockerfile');
  for (const required of [verifierPath, analyzerPath, ciPath, backendDockerPath, frontendDockerPath]) {
    assertion(`design_file_${path.basename(required)}`, fs.existsSync(required), required);
  }

  const verifier = fs.readFileSync(verifierPath, 'utf8');
  const analyzer = fs.readFileSync(analyzerPath, 'utf8');
  const ci = fs.readFileSync(ciPath, 'utf8');
  const backendDocker = fs.readFileSync(backendDockerPath, 'utf8');
  const frontendDocker = fs.readFileSync(frontendDockerPath, 'utf8');

  const verifierForbidden = [
    ['shared dependency symlink', /symlinkSync\s*\(/],
    ['Windows junction', /['"]junction['"]/],
    ['CI artifacts-only bypass', /artifacts-only['"]\)\s*\|\|\s*Boolean\(process\.env\.CI\)/],
    ['CI isolation bypass', /const\s+isCI\s*=\s*Boolean\(process\.env\.CI\)/]
  ].filter(([, pattern]) => pattern.test(verifier)).map(([name]) => name);
  assertion('safe_clean_checkout_design', verifierForbidden.length === 0, { verifierForbidden });

  const unitBody = section(analyzer, 'checkUnitSmoke', 'checkContainerBuild');
  assertion(
    'unit_gate_executes_real_suites',
    /spawnSync|execFileSync|execSync/.test(unitBody) && /test:unit/.test(unitBody) && /frontend/.test(unitBody),
    'checkUnitSmoke must execute backend and frontend suites, not count files'
  );
  const containerBody = section(analyzer, 'checkContainerBuild', 'checkCiRequiredChecks');
  assertion(
    'container_gate_fails_closed',
    /docker/.test(containerBody) && /build/.test(containerBody) && /status/.test(containerBody),
    'checkContainerBuild must execute real builds and evaluate subprocess status'
  );
  assertion(
    'no_large_change_threshold_relaxation',
    !/targetFiles\.length\s*>\s*5/.test(analyzer) && !/targetFiles\.length\s*>\s*5/.test(analyzer),
    'changed-code thresholds may not relax when 6+ files change'
  );
  assertion(
    'no_hard_coded_diff_base',
    !/git diff --name-only 7a449e0a/.test(analyzer),
    'derive and record the reviewed merge base'
  );
  assertion(
    'ci_calls_authoritative_runner',
    ci.includes('node scripts/ssot/certify_p03_release.js'),
    'CI must invoke this exact certifying entry point'
  );
  assertion(
    'ci_has_no_install_fallback',
    !/\|\|\s*npm(?:\s+--prefix\s+\w+)?\s+install/.test(ci),
    'npm install fallback is forbidden'
  );
  assertion(
    'ci_enforces_security',
    ci.includes('secret_scan_with_history.js') && ci.includes('validate_env.js'),
    'CI must enforce both history-aware secret scan and environment validation'
  );
  assertion(
    'ci_enforces_scoped_e2e',
    ci.includes('scripts/test-deploy.sh') && ci.includes('Pre-Flight E2E Smoke Tests'),
    'CI must enforce scoped deployed API and pre-flight E2E smoke'
  );
  assertion(
    'dockerfiles_use_clean_install',
    !/RUN\s+npm\s+install(?:\s|$)/m.test(backendDocker) &&
      !/RUN\s+npm\s+install(?:\s|$)/m.test(frontendDocker),
    'Docker build stages must use lockfile-clean npm ci; declare every package in package.json/lockfile'
  );
}

function safeRemoveOwnedTemp(target) {
  if (!target) return;
  const resolved = path.resolve(target);
  const tempBase = path.resolve(os.tmpdir()) + path.sep;
  if (!resolved.startsWith(tempBase) || !fs.existsSync(path.join(resolved, MARKER))) {
    throw new Error(`Refusing unsafe temp cleanup: ${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}

function parseDockerPort(text) {
  const match = String(text).match(/(?:0\.0\.0\.0|127\.0\.0\.1|\[::\]):(\d+)/);
  if (!match) throw new Error(`Unable to parse Docker port: ${text}`);
  return Number(match[1]);
}

function waitHttp(port, pathname, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ hostname: '127.0.0.1', port, path: pathname, timeout: 3000 }, res => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve(res.statusCode);
        retry(new Error(`HTTP ${res.statusCode}`));
      });
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', retry);
    };
    const retry = err => {
      if (Date.now() - started >= timeoutMs) return reject(err);
      setTimeout(attempt, 2000);
    };
    attempt();
  });
}

function dockerCleanup() {
  if (!docker) return;
  for (const name of [docker.frontend, docker.backend, docker.postgres]) {
    if (name) spawnSync('docker', ['rm', '-f', name], { encoding: 'utf8', shell: process.platform === 'win32' });
  }
  if (docker.network) {
    spawnSync('docker', ['network', 'rm', docker.network], { encoding: 'utf8', shell: process.platform === 'win32' });
  }
}

async function certify() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  assertion('node_runtime_matches_ci', nodeMajor === 20, { required: 20, observed: process.version });
  result.environment.npm = run('npm_version', 'npm', ['--version']).stdout.trim();

  if (!process.env.DOCKER_HOST && process.platform === 'win32') {
    try {
      const wslOut = spawnSync('wsl', ['hostname', '-I'], { encoding: 'utf8' }).stdout;
      const ip = (wslOut || '').trim().split(/\s+/)[0];
      if (ip) {
        process.env.DOCKER_HOST = `tcp://${ip}:2375`;
      }
    } catch (_) {}
  }

  result.candidate_sha = gitText(['rev-parse', 'HEAD']);
  result.base_sha = gitText(['merge-base', 'origin/main', 'HEAD']);
  assertion('candidate_sha_is_full', /^[0-9a-f]{40}$/.test(result.candidate_sha), result.candidate_sha);
  assertion('base_sha_is_full', /^[0-9a-f]{40}$/.test(result.base_sha), result.base_sha);
  assertion('tracked_tree_is_clean', gitText(['status', '--porcelain', '--untracked-files=no']) === '',
    'Commit every tracked certification input before running; untracked files are recorded but excluded from HEAD');
  const trackedRunner = gitText(['ls-files', '--', 'scripts/ssot/certify_p03_release.js']);
  assertion('runner_is_committed', trackedRunner === 'scripts/ssot/certify_p03_release.js', trackedRunner);

  verifyGateDesign();
  run('security_secret_history', 'node', ['scripts/security/secret_scan_with_history.js']);
  run('security_environment', 'node', ['scripts/security/validate_env.js']);

  const nonce = `${result.candidate_sha.slice(0, 10)}-${process.pid}`.toLowerCase();
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nex-p03-cert-'));
  fs.writeFileSync(path.join(tempRoot, MARKER), result.candidate_sha, 'utf8');
  const checkout = path.join(tempRoot, 'checkout');
  fs.mkdirSync(checkout);
  tarPath = path.join(tempRoot, 'candidate.tar');
  run('archive_candidate', 'git', ['archive', '--format=tar', '-o', tarPath, result.candidate_sha]);
  run('extract_candidate', 'tar', ['-xf', tarPath, '-C', checkout]);
  for (const nm of ['node_modules', 'backend/node_modules', 'frontend/node_modules']) {
    assertion(`archive_has_no_${nm.replace(/[\\/]/g, '_')}`, !fs.existsSync(path.join(checkout, nm)), nm);
  }

  const certEnv = { CI: 'true', NODE_OPTIONS: '--max-old-space-size=8192' };
  run('root_npm_ci', 'npm', ['ci', '--ignore-scripts=false', '--no-audit'], { cwd: checkout, env: certEnv });
  run('backend_npm_ci', 'npm', ['ci', '--ignore-scripts=false', '--no-audit'], { cwd: path.join(checkout, 'backend'), env: certEnv });
  run('frontend_npm_ci', 'npm', ['ci', '--ignore-scripts=false', '--no-audit'], { cwd: path.join(checkout, 'frontend'), env: certEnv });
  run('prisma_validate', 'npm', ['--prefix', 'backend', 'exec', '--', 'prisma', 'validate'], { cwd: checkout, env: certEnv });
  run('prisma_generate', 'npm', ['--prefix', 'backend', 'run', 'prisma:generate'], { cwd: checkout, env: certEnv });

  run('ssot', 'node', ['scripts/ssot/validate_ssot.js'], { cwd: checkout, env: certEnv });
  run('p02_audit', 'node', ['scripts/ssot/audit_lifecycle_reconciliation.js'], { cwd: checkout, env: certEnv });
  run('p02_negative', 'node', ['scripts/ssot/test_lifecycle_reconciliation_negative.js'], { cwd: checkout, env: certEnv });
  run('backend_typecheck', 'npx', ['tsc', '-p', 'backend/tsconfig.build.json', '--noEmit'], { cwd: checkout, env: certEnv });
  run('frontend_typecheck', 'npx', ['tsc', '--project', 'frontend/tsconfig.json', '--noEmit'], { cwd: checkout, env: certEnv });
  run('backend_lint', 'npm', ['--prefix', 'backend', 'run', 'lint'], { cwd: checkout, env: certEnv });
  run('frontend_lint', 'npm', ['--prefix', 'frontend', 'run', 'lint'], { cwd: checkout, env: certEnv });
  run('backend_unit', 'npm', ['--prefix', 'backend', 'run', 'test:unit'], { cwd: checkout, env: certEnv });
  run('frontend_unit', 'npm', ['--prefix', 'frontend', 'run', 'test'], { cwd: checkout, env: certEnv });
  run('backend_build', 'npm', ['--prefix', 'backend', 'run', 'build'], { cwd: checkout, env: certEnv });
  run('frontend_build', 'npm', ['--prefix', 'frontend', 'run', 'build'], { cwd: checkout, env: certEnv });

  run('p03_audit', 'node', ['scripts/ssot/audit_p03_architecture_gates.js'], { cwd: checkout, env: certEnv });
  const p03ResultPath = path.join(checkout, 'docs/legacy-erp/verification/_p03_test_results.json');
  const p03 = JSON.parse(fs.readFileSync(p03ResultPath, 'utf8'));
  const missingTests = REQUIRED_P03_TESTS.filter(id => p03.results?.[id]?.status !== 'PASS');
  assertion('p03_exact_21_results', p03.verdict === 'PASS' && p03.total_tests === 21 && missingTests.length === 0,
    { verdict: p03.verdict, total: p03.total_tests, missingTests });

  const negative = run('p03_black_box_negative', 'node', ['scripts/ssot/test_p03_architecture_gates_negative.js'], {
    cwd: checkout,
    env: certEnv,
    maxBuffer: 150 * 1024 * 1024
  });
  const negativeOutput = `${negative.stdout}\n${negative.stderr}`;
  const missingMutations = REQUIRED_MUTATIONS.filter(id => !negativeOutput.includes(id));
  assertion('all_r3_mutations_executed', missingMutations.length === 0, { missingMutations });

  run('docker_info', 'docker', ['info']);
  run('compose_config', 'docker', ['compose', 'config', '--quiet'], { cwd: checkout });
  docker = {
    network: `nex-p03-net-${nonce}`,
    postgres: `nex-p03-pg-${nonce}`,
    backend: `nex-p03-be-${nonce}`,
    frontend: `nex-p03-fe-${nonce}`,
    backendImage: `nex-p03-backend:${nonce}`,
    frontendImage: `nex-p03-frontend:${nonce}`
  };
  run('docker_network', 'docker', ['network', 'create', docker.network]);
  run('postgres_empty_start', 'docker', [
    'run', '-d', '--name', docker.postgres, '--network', docker.network,
    '-e', 'POSTGRES_USER=p03_user', '-e', 'POSTGRES_PASSWORD=p03_pass',
    '-e', 'POSTGRES_DB=p03_db', 'postgres:15-alpine'
  ]);
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    const probe = spawnSync('docker', ['exec', docker.postgres, 'pg_isready', '-U', 'p03_user', '-d', 'p03_db'], {
      encoding: 'utf8', shell: process.platform === 'win32'
    });
    ready = probe.status === 0;
    if (!ready) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assertion('empty_postgres_ready', ready, docker.postgres);

  run('backend_image_build', 'docker', ['build', '--pull', '-t', docker.backendImage, 'backend'], { cwd: checkout, timeout: 30 * 60 * 1000 });
  run('frontend_image_build', 'docker', [
    'build', '--pull', '-t', docker.frontendImage,
    '--build-arg', 'NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/v1',
    '--build-arg', 'NEXT_PUBLIC_WA_PHONE=6280000000000',
    '--build-arg', 'JWT_SECRET=p03-certification-secret', 'frontend'
  ], { cwd: checkout, timeout: 30 * 60 * 1000 });
  for (const [id, image] of [['backend_image_nonroot', docker.backendImage], ['frontend_image_nonroot', docker.frontendImage]]) {
    const inspect = run(id, 'docker', ['image', 'inspect', '--format', '{{.Config.User}}', image]);
    const user = inspect.stdout.trim();
    assertion(`${id}_assertion`, Boolean(user) && user !== '0' && user !== 'root', { image, user });
  }

  run('backend_container_start', 'docker', [
    'run', '-d', '--name', docker.backend, '--network', docker.network,
    '-p', '127.0.0.1::3001',
    '-e', 'NODE_ENV=production', '-e', 'PORT=3001',
    '-e', 'DATABASE_URL=postgresql://p03_user:p03_pass@nex-p03-pg-' + nonce + ':5432/p03_db?schema=public',
    '-e', 'JWT_SECRET=p03-certification-secret',
    '-e', 'AES_SECRET_KEY=12345678901234567890123456789012',
    '-e', 'CORS_ORIGIN=http://127.0.0.1:3000', docker.backendImage
  ]);
  const backendPort = parseDockerPort(run('backend_port', 'docker', ['port', docker.backend, '3001/tcp']).stdout);
  const backendStatus = await waitHttp(backendPort, '/v1/health', 180000);
  assertion('backend_health_smoke', backendStatus < 500, { backendPort, backendStatus });
  run('scoped_deployed_api_e2e', 'bash', [
    'scripts/test-deploy.sh', `http://127.0.0.1:${backendPort}/v1`
  ], { cwd: checkout, timeout: 10 * 60 * 1000 });

  run('frontend_container_start', 'docker', [
    'run', '-d', '--name', docker.frontend, '--network', docker.network,
    '-p', '127.0.0.1::3000', '-e', 'JWT_SECRET=p03-certification-secret', docker.frontendImage
  ]);
  const frontendPort = parseDockerPort(run('frontend_port', 'docker', ['port', docker.frontend, '3000/tcp']).stdout);
  const frontendStatus = await waitHttp(frontendPort, '/', 120000);
  assertion('frontend_http_smoke', frontendStatus < 500, { frontendPort, frontendStatus });

  const trackedAfter = gitText(['status', '--porcelain', '--untracked-files=no']);
  assertion('source_checkout_unchanged_after_certification', trackedAfter === '', trackedAfter);
  assertion('source_dependencies_survived',
    fs.existsSync(path.join(ROOT, 'backend/node_modules')) && fs.existsSync(path.join(ROOT, 'frontend/node_modules')),
    'certifier may not modify or delete source checkout dependencies');

  result.verdict = 'CERTIFIED_PASS';
  result.certification_token = `P03:${result.candidate_sha}:CERTIFIED_PASS`;
}

(async () => {
  try {
    await certify();
  } catch (error) {
    result.failure = compact(error.stack || error.message || error);
    process.exitCode = 1;
  } finally {
    try { dockerCleanup(); } catch (error) {
      result.checks.push({ id: 'docker_cleanup', exit_code: 1, details: compact(error.message) });
      result.verdict = 'FAIL';
      result.certification_token = null;
      process.exitCode = 1;
    }
    try { safeRemoveOwnedTemp(tempRoot); } catch (error) {
      result.checks.push({ id: 'safe_temp_cleanup', exit_code: 1, details: compact(error.message) });
      result.verdict = 'FAIL';
      result.certification_token = null;
      process.exitCode = 1;
    }
    result.completed_at = new Date().toISOString();
    fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
    fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({
      phase: result.phase,
      candidate_sha: result.candidate_sha,
      verdict: result.verdict,
      certification_token: result.certification_token,
      failed_at: result.failure ? result.checks[result.checks.length - 1]?.id || 'preflight' : null,
      evidence: path.relative(ROOT, RESULT_PATH).replace(/\\/g, '/')
    }, null, 2));
    if (result.verdict !== 'CERTIFIED_PASS') process.exitCode = 1;
  }
})();
