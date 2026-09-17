/**
 * NEX ERP — Phase P03 Architecture Gates & CI Certification Suite
 * Validates all 21 required tests and 7 required gates of Phase P03.
 *
 * Uses real AST and static analyzers from scripts/ssot/lib/p03_analyzers.js.
 */

const fs = require('fs');
const path = require('path');
const analyzers = require('./lib/p03_analyzers');

const ROOT = path.resolve(__dirname, '../..');
const VERIFY = path.join(ROOT, 'docs/legacy-erp/verification');

function runAudit(options = {}) {
  const root = options.root || ROOT;
  const results = {};

  const testDefinitions = [
    { id: 'clean_checkout_build', fn: () => analyzers.checkCleanCheckoutBuild(root, options.clean_checkout_build) },
    { id: 'typecheck', fn: () => analyzers.checkTypecheck(root, options.typecheck) },
    { id: 'lint', fn: () => analyzers.checkLint(root, options.lint) },
    { id: 'unit_smoke', fn: () => analyzers.checkUnitSmoke(root, options.unit_smoke) },
    { id: 'container_build', fn: () => analyzers.checkContainerBuild(root, options.container_build) },
    { id: 'ci_required_check_test', fn: () => analyzers.checkCiRequiredChecks(root, options.ci_required_check_test) },
    { id: 'module_boundary_test', fn: () => analyzers.checkModuleBoundaries(root, options.module_boundary_test) },
    { id: 'dependency_direction_test', fn: () => analyzers.checkDependencyDirection(root, options.dependency_direction_test) },
    { id: 'circular_dependency_scan', fn: () => analyzers.detectCircularDependencies(root, options.circular_dependency_scan) },
    { id: 'unused_export_dependency_scan', fn: () => analyzers.checkUnusedProductionDependencies(root, options.unused_export_dependency_scan) },
    { id: 'orphan_object_scan', fn: () => analyzers.checkOrphanObjects(root, options.orphan_object_scan) },
    { id: 'duplicate_code_scan', fn: () => analyzers.checkDuplicateCode(root, options.duplicate_code_scan) },
    { id: 'changed_complexity_check', fn: () => analyzers.checkCyclomaticComplexity(root, options.changed_complexity_check) },
    { id: 'dna_import_boundary_ast', fn: () => analyzers.checkDnaImportBoundary(root, options.dna_import_boundary_ast) },
    { id: 'dna_native_interactive_scan', fn: () => analyzers.checkDnaNativeInteractive(root, options.dna_native_interactive_scan) },
    { id: 'dna_primitive_duplication_scan', fn: () => analyzers.checkDnaPrimitiveDuplication(root, options.dna_primitive_duplication_scan) },
    { id: 'dna_hardcoded_visual_scan', fn: () => analyzers.checkDnaHardcodedVisual(root, options.dna_hardcoded_visual_scan) },
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
  const audit = runAudit({
    typecheck: isFast ? { skipSubprocess: true } : {},
    lint: isFast ? { skipSubprocess: true } : {},
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

module.exports = { runAudit };
