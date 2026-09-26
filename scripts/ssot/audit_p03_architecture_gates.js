/**
 * NEX ERP — Phase P03 Architecture Gates & CI Certification Suite
 * Validates all 21 required tests and 7 required gates of Phase P03.
 *
 * Uses real AST and static analyzers from scripts/ssot/lib/p03_analyzers.js.
 */

const fs = require('fs');
const path = require('path');
const analyzers = require('./lib/p03_analyzers');
const { buildP03AuditOptions } = require('./p03_audit_options');

const ROOT = path.resolve(__dirname, '../..');
const VERIFY = path.join(ROOT, 'docs/legacy-erp/verification');

function runAudit(options = {}) {
  // R5-B2: Production audit call assembles a strict bundle from the canonical
  // builder. Callers (including the runner and production diagnostics) cannot
  // silently skip scope/ledger/allowlist options.
  const baseSha = options.baseSha;
  const requireValidLedger = options.requireValidLedger;
  const changedFiles = options.changedFiles;
  const codeFiles = options.codeFiles;
  const ledgerPath = options.ledgerPath;
  const root = options.root || ROOT;

  // Wire the strict scope fields through to every gate that accepts them.
  // Code-scanning gates (duplicate, complexity) prefer `codeFiles` (filtered to
  // .ts/.tsx) so .js seed files and scripts/ssot/ infrastructure do not get
  // pulled into source-code analysis.
  const strict = (gateOpts = {}, kind = 'code') => {
    const base = {
      ...gateOpts,
      ...(baseSha !== undefined ? { baseSha } : {}),
      ...(ledgerPath !== undefined ? { ledgerPath } : {}),
      ...(requireValidLedger !== undefined ? { requireValidLedger } : {})
    };
    if (kind === 'code' && codeFiles !== undefined) base.changedFiles = codeFiles;
    else if (changedFiles !== undefined) base.changedFiles = changedFiles;
    return base;
  };

  const results = {};

  const testDefinitions = [
    { id: 'clean_checkout_build', fn: () => analyzers.checkCleanCheckoutBuild(root, options.clean_checkout_build) },
    { id: 'typecheck', fn: () => analyzers.checkTypecheck(root, options.typecheck) },
    { id: 'lint', fn: () => analyzers.checkLint(root, strict(options.lint, 'scope')) },
    { id: 'unit_smoke', fn: () => analyzers.checkUnitSmoke(root, options.unit_smoke) },
    { id: 'container_build', fn: () => analyzers.checkContainerBuild(root, options.container_build) },
    { id: 'ci_required_check_test', fn: () => analyzers.checkCiRequiredChecks(root, options.ci_required_check_test) },
    { id: 'module_boundary_test', fn: () => analyzers.checkModuleBoundaries(root, options.module_boundary_test) },
    { id: 'dependency_direction_test', fn: () => analyzers.checkDependencyDirection(root, options.dependency_direction_test) },
    { id: 'circular_dependency_scan', fn: () => analyzers.detectCircularDependencies(root, options.circular_dependency_scan) },
    { id: 'unused_export_dependency_scan', fn: () => analyzers.checkUnusedProductionDependencies(root, options.unused_export_dependency_scan) },
    { id: 'orphan_object_scan', fn: () => analyzers.checkOrphanObjects(root, options.orphan_object_scan) },
    { id: 'duplicate_code_scan', fn: () => analyzers.checkDuplicateCode(root, strict(options.duplicate_code_scan, 'code')) },
    { id: 'changed_complexity_check', fn: () => analyzers.checkCyclomaticComplexity(root, strict(options.changed_complexity_check, 'code')) },
    { id: 'dna_import_boundary_ast', fn: () => analyzers.checkDnaImportBoundary(root, strict(options.dna_import_boundary_ast, 'scope')) },
    { id: 'dna_native_interactive_scan', fn: () => analyzers.checkDnaNativeInteractive(root, strict(options.dna_native_interactive_scan, 'scope')) },
    { id: 'dna_primitive_duplication_scan', fn: () => analyzers.checkDnaPrimitiveDuplication(root, strict(options.dna_primitive_duplication_scan, 'scope')) },
    { id: 'dna_hardcoded_visual_scan', fn: () => analyzers.checkDnaHardcodedVisual(root, strict(options.dna_hardcoded_visual_scan, 'scope')) },
    { id: 'dna_barrel_integrity', fn: () => analyzers.checkDnaBarrelIntegrity(root, options.dna_barrel_integrity) },
    { id: 'dna_reference_route_and_composition', fn: () => analyzers.checkDnaReferenceRoutes(root, options.dna_reference_route_and_composition) },
    { id: 'dna_screen_coverage_manifest', fn: () => analyzers.checkDnaScreenCoverageManifest(root, options.dna_screen_coverage_manifest) },
    { id: 'dna_exception_registry_validation', fn: () => analyzers.checkDnaExceptionRegistry(root, options.dna_exception_registry_validation) },
  ];

  for (const t of testDefinitions) {
    try {
      const res = t.fn();
      results[t.id] = {
        status: res.pass ? 'PASS' : 'FAIL',
        details: res.details || {},
        error: res.error || null
      };
    } catch (err) {
      results[t.id] = {
        status: 'FAIL',
        error: err.message,
        details: { exception: err.stack }
      };
    }
  }

  const passedCount = Object.values(results).filter(r => r.status === 'PASS').length;
  const totalCount = testDefinitions.length;
  const allPass = passedCount === totalCount;

  return {
    phase: 'P03',
    generated_at: new Date().toISOString(),
    verdict: allPass ? 'PASS' : 'FAIL',
    passed_tests: passedCount,
    total_tests: totalCount,
    results
  };
}

if (require.main === module) {
  const isFast = process.argv.includes('--fast') || process.argv.includes('--skip-subprocess');
  console.log(`Running Phase P03 Reproducible Build, Architecture Gates & CI Certification Suite${isFast ? ' (Fast Mode)' : ''}...\n`);
  // runProductionAudit, not runAudit: `runAudit` leaves `baseSha` unset, so
  // checkDuplicateCode falls back to `resolveDiffBase` -> HEAD~1 -> a diff of one
  // commit. On 2026-09-26 that made this CLI report 21/21 PASS with
  // `changed_files_scanned: 0` and a 0% duplication figure while the runner
  // (`certify_p03_phase.js`) measured 595 files at 27.04% against the phase base
  // and failed. The module's own doc calls this the production entrypoint; it now
  // assembles the same strict bundle CI does.
  const audit = runProductionAudit({
    typecheck: isFast ? { skipSubprocess: true } : {},
    lint: isFast ? { skipSubprocess: true } : {},
    unit_smoke: isFast ? { skipSubprocess: true } : {},
  });

  console.log('=======================================================');
  console.log(`PHASE P03 TEST RESULTS (${audit.passed_tests}/${audit.total_tests} REQUIRED TESTS)`);
  console.log('=======================================================');

  for (const [testName, result] of Object.entries(audit.results)) {
    const badge = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`${badge} | ${testName}`);
    if (result.status !== 'PASS') {
      if (result.error) console.log('   Error:', result.error);
      if (result.details) console.log('   Details:', JSON.stringify(result.details));
    }
  }

  console.log('=======================================================');
  console.log(`TOTAL: ${audit.passed_tests}/${audit.total_tests} tests passed.`);
  console.log(`OVERALL PHASE P03 VERDICT: ${audit.verdict}`);
  console.log('=======================================================\n');

  fs.writeFileSync(path.join(VERIFY, '_p03_test_results.json'), JSON.stringify(audit, null, 2));

  if (audit.verdict !== 'PASS') {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

module.exports = { runAudit, runProductionAudit };

/**
 * Production-only audit entrypoint. Assembles options via the canonical
 * builder so the runner and any external automation always exercise the
 * strict scope path. Test code (negative suite, sandbox ts) must call
 * `runAudit` directly with intentionally-weakened options; doing so is
 * forbidden by the negative suite (see `test_p03_architecture_gates_negative.js`).
 *
 * @param {object} [callOptions] Per-gate options forwarded to `runAudit` (e.g.,
 *                              typecheck/lint/unit_smoke result bundles).
 */
function runProductionAudit(callOptions = {}) {
  const strict = buildP03AuditOptions();
  // Per-gate result bundles (typecheck/lint/unit_smoke) are passed through verbatim.
  return runAudit({
    ...strict,
    ...callOptions
  });
}
