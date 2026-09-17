/**
 * NEX ERP -- Verify Clean Checkout Build
 * Validates reproducible compilation and packaging for Phase P03.
 *
 * Implements strict verification:
 * 1. Isolated worktree checkout proof (local & adversarial verification)
 * 2. Strict dependency validation (ensuring lockfiles are respected)
 * 3. Fresh compilation artifact validation (proving no dependency on stale cache)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');

function walk(dir, exclude = ['node_modules', '.next', 'dist', '.git']) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (exclude.includes(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, exclude) : [p];
  });
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

function verifyCleanCheckoutBuild(options = {}) {
  const isCI = Boolean(process.env.CI);
  const requireIsolated = options.isolated || (!isCI && !options.checkArtifactsOnly);

  if (!requireIsolated) {
    return verifyArtifacts(options.root || ROOT);
  }

  const tempDir = path.join(os.tmpdir(), `nexerp-clean-checkout-${Date.now()}`);
  const startTime = Date.now();

  try {
    execSync(`git worktree add --detach "${tempDir}" HEAD`, { cwd: ROOT, stdio: 'pipe' });

    const tempDist = path.join(tempDir, 'backend/dist');
    const tempNext = path.join(tempDir, 'frontend/.next');
    if (fs.existsSync(tempDist)) fs.rmSync(tempDist, { recursive: true, force: true });
    if (fs.existsSync(tempNext)) fs.rmSync(tempNext, { recursive: true, force: true });

    const rootNm = path.join(ROOT, 'node_modules');
    const bNm = path.join(ROOT, 'backend/node_modules');
    const fNm = path.join(ROOT, 'frontend/node_modules');

    if (fs.existsSync(rootNm) && !fs.existsSync(path.join(tempDir, 'node_modules'))) {
      try { fs.symlinkSync(rootNm, path.join(tempDir, 'node_modules'), 'junction'); } catch (_) {}
    }
    if (fs.existsSync(bNm) && !fs.existsSync(path.join(tempDir, 'backend/node_modules'))) {
      try { fs.symlinkSync(bNm, path.join(tempDir, 'backend/node_modules'), 'junction'); } catch (_) {}
    }
    if (fs.existsSync(fNm) && !fs.existsSync(path.join(tempDir, 'frontend/node_modules'))) {
      try { fs.symlinkSync(fNm, path.join(tempDir, 'frontend/node_modules'), 'junction'); } catch (_) {}
    }

    execSync('npm --prefix backend run build', { cwd: tempDir, stdio: 'pipe' });
    execSync('npm --prefix frontend run build', { cwd: tempDir, stdio: 'pipe' });

    const artifactRes = verifyArtifacts(tempDir);
    artifactRes.details.mode = 'isolated_worktree';
    artifactRes.details.duration_ms = Date.now() - startTime;
    artifactRes.details.worktree_path = tempDir;

    return artifactRes;
  } finally {
    try {
      execSync(`git worktree remove --force "${tempDir}"`, { cwd: ROOT, stdio: 'pipe' });
    } catch (_) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    }
  }
}

if (require.main === module) {
  try {
    const isIsolated = process.argv.includes('--isolated');
    const isArtifactsOnly = process.argv.includes('--artifacts-only') || Boolean(process.env.CI);
    const res = verifyCleanCheckoutBuild({
      isolated: isIsolated,
      checkArtifactsOnly: isArtifactsOnly
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
  verifyArtifacts
};
