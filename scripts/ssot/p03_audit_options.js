/**
 * NEX ERP -- Phase P03 Production Audit Options Builder
 *
 * Single source of truth for the option bundle that production
 * `runAudit()` invocations must use so that scope validation, duplication,
 * complexity, and every DNA gate run against the same strict ledger/SHA pair.
 *
 * Negative/integration tests MUST import this builder rather than assemble a
 * partial option object inline. The production mutation tests reference this
 * module so that no test-only option can sneak a relaxed invariant past CI.
 */

const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const FALLBACK_PHASE_BASE_SHA = '9229478d4d0f037ddb269fc3d5e7fc7e0dd796fb';

function isValidCommitSha(ref) {
  if (!ref || typeof ref !== 'string') return false;
  try {
    const fullSha = execSync(`git rev-parse --verify ${ref.trim()}^{commit}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    return fullSha.length === 40 ? fullSha : false;
  } catch (_) {
    return false;
  }
}

function resolvePhaseBaseSha() {
  if (process.env.P03_BASE_SHA) {
    const verified = isValidCommitSha(process.env.P03_BASE_SHA);
    if (verified) return verified;
  }
  try {
    const mb = execSync('git merge-base origin/main HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    const verified = isValidCommitSha(mb);
    if (verified) return verified;
  } catch (_) {}
  try {
    const mb = execSync('git merge-base main HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    const verified = isValidCommitSha(mb);
    if (verified) return verified;
  } catch (_) {}
  return FALLBACK_PHASE_BASE_SHA;
}

const LEDGER_PATH = path.join(ROOT, 'docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_LEDGER.md');
const MANIFEST_PATH = path.join(ROOT, 'docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_MANIFEST.json');

/**
 * Exact set of generated SSOT/P02/P03 evidence files that the runner
 * rewrites during execution. Files outside this allowlist must NEVER be
 * modified by the runner; any modification means a run contract violation
 * and is strictly rejected by the runner's pre/post source-integrity check.
 *
 * The same set is consumed by `.github/workflows/ci.yml` in the
 * "Post-Run Source Integrity Check" step so that local and CI agree
 * byte-for-byte on what is allowed to change in a single run.
 */
const GENERATED_OUTPUT_ALLOWLIST = [
  'docs/legacy-erp/verification/_SSOT_VALIDATION_REPORT.md',
  'docs/legacy-erp/verification/_ssot_validation.json',
  'docs/legacy-erp/verification/_p02_test_results.json',
  'docs/legacy-erp/verification/_p03_test_results.json',
  'docs/legacy-erp/verification/_clean_checkout_build_evidence.json',
  'docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_MANIFEST.json',
  'docs/legacy-erp/verification/evidence/P03_CHANGE_SCOPE_LEDGER.md',
  'docs/legacy-erp/verification/evidence/P03_PHASE_CERTIFICATION_RESULT.json',
  'docs/legacy-erp/generated/INPUT_OUTPUT_LINEAGE.md'
];

function gitRev(args) {
  // Do NOT trim -- git porcelain's leading status column (e.g. ` M ` for unstaged-only)
  // contains whitespace that would be stripped, shifting the path column and
  // misidentifying generated-output files as dirty source.
  const p = execSync(`git ${args.join(' ')}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  return p.toString().replace(/\r\n/g, '\n').replace(/\n$/, '');
}

function readGitDiffFiles(baseSha) {
  const base = baseSha || resolvePhaseBaseSha();
  const out = gitRev(['diff', '--name-only', base, 'HEAD']);
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

function isCodeFile(filePath) {
  if (!filePath) return false;
  const p = filePath.replace(/\\/g, '/');
  if (p.endsWith('.d.ts')) return false;
  if (p.includes('/test/') || p.includes('/__tests__/') || p.includes('.test.') || p.includes('.spec.') || p.includes('-spec.') || p.includes('-test.')) return false;
  return p.endsWith('.ts') || p.endsWith('.tsx');
}

function readChangedCodeFiles(baseSha) {
  return readGitDiffFiles(baseSha).filter(isCodeFile);
}

/**
 * Build the production audit option bundle. Every option consumer of `runAudit`
 * that runs outside the test sandbox MUST go through this function so that the
 * strict scope invariants (`baseSha`, `requireValidLedger`, `changedFiles`)
 * cannot be silently relaxed.
 *
 * @param {object} [overrides] Optional surgical overrides for tests that need
 *                              to inject synthetic data (e.g., negative suite).
 *                              Overrides are NOT applied to production calls.
 */
function buildP03AuditOptions(overrides = {}) {
  const base = overrides.baseSha || resolvePhaseBaseSha();
  const diffFiles = overrides.changedFiles || readGitDiffFiles(base);
  // filtered: only .ts/.tsx (excluding test/spec/d.ts) so audit gates that
  // scan changed source code (`checkDuplicateCode`, `checkCyclomaticComplexity`,
  // and any gate that defaults to changedFiles) operate on real source code
  // rather than dragged in .js seed files or scripts/ssot/ infrastructure.
  const codeFiles = (overrides.codeFiles || readChangedCodeFiles(base));

  const options = {
    root: ROOT,
    baseSha: base,
    requireValidLedger: true,
    changedFiles: diffFiles,
    codeFiles: codeFiles,
    ledgerPath: LEDGER_PATH,
    manifestPath: MANIFEST_PATH
  };

  if (overrides.allowListOverride && Array.isArray(overrides.allowListOverride)) {
    options.allowListOverride = overrides.allowListOverride;
  }
  if (overrides.skipSubprocess === true) {
    options.skipSubprocess = true;
  }
  return options;
}

function readTrackedAllowlist() {
  return GENERATED_OUTPUT_ALLOWLIST.slice();
}

/**
 * Validate that the working tree contains no tracked-file modifications
 * outside the generated-output allowlist. Used by the runner pre-flight
 * (to detect leftover dirty state) and post-run (to detect unintentional
 * source changes). On any dirty path outside the allowlist, returns the
 * list of offending relative paths so the runner can fail closed.
 */
function findDisallowedTrackedDirty() {
  const porcelain = gitRev(['status', '--porcelain']);
  const allow = new Set(GENERATED_OUTPUT_ALLOWLIST);
  const offenders = [];
  for (const line of porcelain.split('\n')) {
    if (!line.trim()) continue;
    const status = line.slice(0, 2);
    const file = line.slice(3).trim().replace(/^"|"$/g, '');
    if (status.includes('?')) continue; // untracked, not source-integrity failure
    if (!file) continue;
    if (allow.has(file.replace(/\\/g, '/'))) continue;
    offenders.push(file);
  }
  return offenders;
}

module.exports = {
  get PHASE_BASE_SHA() {
    return resolvePhaseBaseSha();
  },
  resolvePhaseBaseSha,
  LEDGER_PATH,
  MANIFEST_PATH,
  GENERATED_OUTPUT_ALLOWLIST,
  buildP03AuditOptions,
  findDisallowedTrackedDirty,
  readGitDiffFiles,
  readTrackedAllowlist
};
