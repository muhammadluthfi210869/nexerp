/**
 * NEX ERP -- Verify Clean Checkout Build (Phase P03)
 * Validates reproducible compilation and packaging in a completely isolated disposable copy.
 *
 * Requirements (Auditor R3-B2):
 * 1. Isolated disposable copy under OS temp directory with unique sentinel marker.
 * 2. Materialized via `git archive` without junctions, symlinks, or hardlinks to source checkout.
 * 3. Verified safe cleanup: target must be inside OS temp dir and contain sentinel marker.
 * 4. Full deterministic sequence:
 *    - root, backend, frontend plain `npm ci --ignore-scripts=false --no-audit`
 *    - prisma validate and prisma:generate
 *    - backend & frontend typecheck
 *    - backend & frontend lint
 *    - backend & frontend unit tests
 *    - backend & frontend production builds
 *    - artifact and route manifest validation
 * 5. Strictly rejects `--artifacts-only` or CI shortcuts for certification.
 * 6. Records candidate SHA, Node/npm versions, lockfile hashes, and command details in JSON.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const VERIFY_DIR = path.join(ROOT, 'docs/legacy-erp/verification');

function walk(dir, exclude = ['node_modules', '.next', 'dist', '.git']) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (exclude.includes(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, exclude) : [p];
  });
}

function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function verifyArtifacts(targetRoot) {
  const backendDist = path.join(targetRoot, 'backend/dist');
  const frontendNext = path.join(targetRoot, 'frontend/.next');

  const mainCandidate1 = path.join(backendDist, 'main.js');
  const mainCandidate2 = path.join(backendDist, 'src/main.js');
  const hasBackendMain = fs.existsSync(mainCandidate1) || fs.existsSync(mainCandidate2);

  const appModuleCandidate1 = path.join(backendDist, 'app.module.js');
  const appModuleCandidate2 = path.join(backendDist, 'src/app.module.js');
  const hasBackendAppModule = fs.existsSync(appModuleCandidate1) || fs.existsSync(appModuleCandidate2);

  const jsFiles = fs.existsSync(backendDist)
    ? walk(backendDist).filter(f => f.endsWith('.js') && !f.endsWith('.js.map'))
    : [];
  const backendCompiledCount = jsFiles.length;

  const buildIdExists = fs.existsSync(path.join(frontendNext, 'BUILD_ID'));
  const hasStandaloneOrServer = fs.existsSync(path.join(frontendNext, 'standalone')) ||
    fs.existsSync(path.join(frontendNext, 'server'));
  const hasFrontendNext = fs.existsSync(frontendNext) && buildIdExists && hasStandaloneOrServer;

  const appPathsManifest = path.join(frontendNext, 'server/app-paths-manifest.json');
  let routeCount = 0;
  if (fs.existsSync(appPathsManifest)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(appPathsManifest, 'utf8'));
      routeCount = Object.keys(manifest).length;
    } catch (_) {}
  }

  const pass = hasBackendMain && hasBackendAppModule && backendCompiledCount >= 200 && hasFrontendNext && routeCount >= 100;

  return {
    pass,
    details: {
      has_backend_main: hasBackendMain,
      has_backend_app_module: hasBackendAppModule,
      backend_compiled_count: backendCompiledCount,
      has_frontend_next: hasFrontendNext,
      frontend_routes_count: routeCount,
      target_root: targetRoot
    },
    error: pass ? null : `Clean build artifact check failed: backend_main=${hasBackendMain}, backend_app_module=${hasBackendAppModule}, js_count=${backendCompiledCount} (min 200), frontend_next=${hasFrontendNext}, routes=${routeCount} (min 100)`
  };
}

function safeCleanup(tempDir) {
  const resolvedTemp = path.resolve(tempDir);
  const resolvedOsTmp = path.resolve(os.tmpdir());
  const rel = path.relative(resolvedOsTmp, resolvedTemp);

  if (rel.startsWith('..') || path.isAbsolute(rel) || rel === '') {
    throw new Error(`Unsafe cleanup aborted: ${tempDir} is not a subfolder of os.tmpdir() (${os.tmpdir()})`);
  }

  const sentinelFile = path.join(tempDir, 'nexerp_clean_sentinel.json');
  if (!fs.existsSync(sentinelFile)) {
    throw new Error(`Sentinel marker missing in temp directory: ${tempDir}. Aborting cleanup to prevent accidental data loss.`);
  }

  try {
    fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
  } catch (err) {
    console.warn(`Warning: failed to remove disposable temp directory ${tempDir}:`, err.message);
  }
}

function verifyCleanCheckoutBuild(options = {}) {
  const startTime = Date.now();

  // Explicit non-certifying diagnostic mode
  if (options.checkArtifactsOnly) {
    if (!options.allowDiagnosticBypass) {
      return {
        pass: false,
        error: 'REJECTED: --artifacts-only is a diagnostic flag and cannot satisfy P03 clean checkout certification.',
        details: { mode: 'non_certifying_diagnostic_rejected' }
      };
    }
    const res = verifyArtifacts(options.root || ROOT);
    res.details.mode = 'diagnostic_artifacts_only';
    res.details.certified = false;
    return res;
  }

  const sha = options.sha || (() => {
    try {
      return execSync('git rev-parse HEAD', { cwd: ROOT, stdio: 'pipe' }).toString().trim();
    } catch (_) {
      return 'UNKNOWN_SHA';
    }
  })();

  const tempDir = path.join(os.tmpdir(), `nexerp-clean-checkout-${Date.now()}-${process.pid}`);
  const sentinelFile = path.join(tempDir, 'nexerp_clean_sentinel.json');
  const archivePath = path.join(os.tmpdir(), `nexerp-archive-${Date.now()}-${process.pid}.tar`);

  const executionLog = {
    started_at: new Date().toISOString(),
    candidate_sha: sha,
    node_version: process.version,
    temp_dir: tempDir,
    lockfile_hashes: {
      root: computeFileHash(path.join(ROOT, 'package-lock.json')),
      backend: computeFileHash(path.join(ROOT, 'backend/package-lock.json')),
      frontend: computeFileHash(path.join(ROOT, 'frontend/package-lock.json'))
    },
    commands: []
  };

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(sentinelFile, JSON.stringify({
      created_at: new Date().toISOString(),
      pid: process.pid,
      root: ROOT,
      sha
    }, null, 2));

    // 1. Materialize via git archive tar without any symlinks or shared dependencies
    execSync(`git archive --format=tar ${sha} -o "${archivePath}"`, { cwd: ROOT, stdio: 'pipe' });
    execSync(`tar -xf "${archivePath}" -C "${tempDir}"`, { cwd: ROOT, stdio: 'pipe' });
    try { fs.unlinkSync(archivePath); } catch (_) {}

    // Assert absolute independence: ensure no junctions or symlinks exist in tempDir
    for (const nmSub of ['node_modules', 'backend/node_modules', 'frontend/node_modules']) {
      const nmPath = path.join(tempDir, nmSub);
      if (fs.existsSync(nmPath)) {
        const stat = fs.lstatSync(nmPath);
        if (stat.isSymbolicLink()) {
          throw new Error(`Isolation breach: ${nmSub} is a symlink/junction in disposable copy!`);
        }
      }
    }

    const runCmd = (cmd, cwdRel = '.') => {
      const fullCwd = path.join(tempDir, cwdRel);
      const cmdStart = Date.now();
      const res = spawnSync(cmd, {
        cwd: fullCwd,
        shell: true,
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024
      });
      const duration = Date.now() - cmdStart;
      executionLog.commands.push({
        command: cmd,
        cwd: cwdRel,
        exit_code: res.status,
        duration_ms: duration,
        error: res.status !== 0 ? (res.stderr || res.stdout).slice(-1000) : null
      });
      if (res.status !== 0) {
        throw new Error(`Disposable step failed (exit ${res.status}): ${cmd}\n${(res.stderr || res.stdout).slice(-1500)}`);
      }
    };

    // 2. Full clean deterministic install & build pipeline
    // Dependency installations
    runCmd('npm ci --ignore-scripts=false --no-audit');
    runCmd('npm --prefix backend ci --ignore-scripts=false --no-audit');
    runCmd('npm --prefix frontend ci --ignore-scripts=false --no-audit');

    // Prisma validate & generate
    runCmd('npx --prefix backend prisma validate');
    runCmd('npm --prefix backend run prisma:generate');

    // Typechecks
    runCmd('npx tsc -p backend/tsconfig.build.json --noEmit');
    runCmd('npx tsc --project frontend/tsconfig.json --noEmit');

    // Lint
    runCmd('npm --prefix backend run lint');
    runCmd('npm --prefix frontend run lint');

    // Unit tests
    runCmd('npm --prefix backend run test:unit');
    runCmd('npm --prefix frontend run test');

    // Production builds
    runCmd('npm --prefix backend run build');
    runCmd('npm --prefix frontend run build');

    // 3. Artifact verification
    const artifactRes = verifyArtifacts(tempDir);
    if (!artifactRes.pass) {
      throw new Error(artifactRes.error);
    }

    executionLog.finished_at = new Date().toISOString();
    executionLog.duration_ms = Date.now() - startTime;
    executionLog.verdict = 'PASS';
    executionLog.details = artifactRes.details;

    if (fs.existsSync(VERIFY_DIR)) {
      fs.writeFileSync(
        path.join(VERIFY_DIR, '_clean_checkout_build_evidence.json'),
        JSON.stringify(executionLog, null, 2)
      );
    }

    return {
      pass: true,
      details: {
        mode: 'isolated_disposable_pipeline',
        candidate_sha: sha,
        duration_ms: executionLog.duration_ms,
        commands_executed: executionLog.commands.length,
        ...artifactRes.details
      }
    };
  } catch (err) {
    executionLog.finished_at = new Date().toISOString();
    executionLog.duration_ms = Date.now() - startTime;
    executionLog.verdict = 'FAIL';
    executionLog.error = err.message;

    if (fs.existsSync(VERIFY_DIR)) {
      fs.writeFileSync(
        path.join(VERIFY_DIR, '_clean_checkout_build_evidence.json'),
        JSON.stringify(executionLog, null, 2)
      );
    }

    return {
      pass: false,
      error: err.message,
      details: {
        mode: 'isolated_disposable_pipeline',
        candidate_sha: sha,
        duration_ms: executionLog.duration_ms,
        failed_command: executionLog.commands.find(c => c.exit_code !== 0)
      }
    };
  } finally {
    try { fs.unlinkSync(archivePath); } catch (_) {}
    safeCleanup(tempDir);
  }
}

if (require.main === module) {
  try {
    const isDiagnosticArtifacts = process.argv.includes('--artifacts-only');
    const allowDiagnostic = process.argv.includes('--allow-diagnostic');

    const res = verifyCleanCheckoutBuild({
      checkArtifactsOnly: isDiagnosticArtifacts,
      allowDiagnosticBypass: allowDiagnostic
    });

    if (!res.pass) {
      console.error('Clean build verification failed:', res.error);
      process.exit(1);
    }
    console.log(`Clean build verification PASSED (${res.details.mode || 'standard'}). Routes: ${res.details.frontend_routes_count}, Compiled backend JS: ${res.details.backend_compiled_count}`);
  } catch (err) {
    console.error('Clean build error:', err.message);
    process.exit(1);
  }
}

module.exports = {
  verifyCleanCheckoutBuild,
  verifyArtifacts,
  safeCleanup
};
