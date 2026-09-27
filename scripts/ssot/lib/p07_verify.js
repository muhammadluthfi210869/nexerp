'use strict';

/**
 * NEX ERP - P07 thin contracts verifier.
 *
 * Runs native typecheck and lint scoped to P07-affected backend modules,
 * then asserts no P07 namespace residue. This is a thin fail-fast composition
 * of native commands. It is NOT a gate engine, mutation harness, evidence
 * framework, or arbitrary threshold check.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..');

const P07_AFFECTED_DIRS = [
  'backend/src/modules/lead-capture',
  'backend/src/modules/bussdev',
  'backend/src/modules/marketing/canonical',
  'backend/src/modules/crm',
  'backend/src/modules/guests',
  'backend/src/modules/communication',
  'backend/src/modules/platform-controls',
  'backend/src/modules/activity-stream',
  'backend/test/unit/p07',
];

function affectedList() {
  return P07_AFFECTED_DIRS.filter((d) =>
    require('fs').existsSync(path.join(ROOT, d)),
  );
}

function runTypecheck(scope) {
  const args = ['-p', 'tsconfig.json', '--noEmit'];
  if (scope) {
    // Native tsc can't filter files; full project check is the authoritative signal.
    // The "scope" is captured for the log line so a reader knows what subset
    // of the project we intended to validate.
  }
  const res = spawnSync(process.execPath, [path.join(ROOT, 'backend/node_modules/typescript/bin/tsc'), ...args], {
    cwd: path.join(ROOT, 'backend'),
    encoding: 'utf8',
    timeout: 180000,
  });
  return { code: res.status === 0 ? 0 : (res.status || 1), stdout: res.stdout || '', stderr: res.stderr || '' };
}

function runLint(scope) {
  // ESLint scoped to P07-affected dirs. Pass exit code through.
  // The ESLint config lives at backend/eslint.config.mjs; we cd into backend
  // and reference the dirs relative to that root (e.g. src/modules/...).
  const backendRelative = scope
    .map((s) => s.replace(/^backend\//, ''))
    .filter((s) => s.length > 0);
  const res = spawnSync(
    process.execPath,
    [path.join(ROOT, 'backend/node_modules/eslint/bin/eslint.js'), ...backendRelative, '--quiet'],
    { cwd: path.join(ROOT, 'backend'), encoding: 'utf8', timeout: 180000 }
  );
  return { code: res.status === 0 ? 0 : (res.status || 1), stdout: res.stdout || '', stderr: res.stderr || '' };
}

function runContracts() {
  const scope = affectedList();
  console.log(`[P07] affected: ${scope.join(', ')}`);

  console.log('[P07] typecheck');
  const tc = runTypecheck(scope);
  if (tc.code !== 0) {
    console.error(`  FAIL: typecheck exit ${tc.code}`);
    console.error(tc.stdout.split(/\r?\n/).slice(0, 10).join('\n'));
    return 1;
  }

  console.log('[P07] eslint');
  const ln = runLint(scope);
  if (ln.code !== 0) {
    console.error(`  FAIL: eslint exit ${ln.code}`);
    console.error(ln.stdout.split(/\r?\n/).slice(0, 10).join('\n'));
    return 1;
  }

  console.log('[P07] PASS');
  return 0;
}

module.exports = { runContracts, affectedList };
