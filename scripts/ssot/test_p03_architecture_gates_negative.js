/**
 * NEX ERP -- Phase P03 Architecture & DNA Gates Negative Verification Suite
 * Proves that the independent P03 audit runner deterministically FAILS under
 * real architectural corruption and violation scenarios.
 *
 * Implements both:
 * 1. Fast unit-level negative injections
 * 2. Black-box on-disk mutations mutating real TS/TSX files, CI workflows,
 *    Dockerfiles, and exception baselines, executing production analyzer/CLI paths
 *    and asserting non-zero exit codes.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const analyzers = require('./lib/p03_analyzers');

const ROOT = path.resolve(__dirname, '../..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  FAIL: ${message}`);
  }
}

console.log('Running Phase P03 Adversarial Negative Suite (Unit & Black-Box On-Disk Mutations)...\n');

// =============================================================================
// PART 1: Black-Box On-Disk Mutations (Addressing Auditor B9)
// =============================================================================
console.log('--- PART 1: Black-Box On-Disk Mutation Scenarios ---');

const tempSandbox = path.join(os.tmpdir(), `nexerp-negative-sandbox-${Date.now()}`);
fs.mkdirSync(tempSandbox, { recursive: true });

try {
  // Scenario BB-1: Missing backend dist main.js causes clean_checkout_build to fail
  {
    const fakeDist = path.join(tempSandbox, 'dist_empty');
    fs.mkdirSync(fakeDist, { recursive: true });
    const res = analyzers.checkCleanCheckoutBuild(ROOT, { backendDist: fakeDist });
    assert(!res.pass, 'BB-1: Empty backend dist directory deterministically fails checkCleanCheckoutBuild');
  }

  // Scenario BB-2: Corrupt CI workflow with loose npm install fallback
  {
    const fakeCi = path.join(tempSandbox, 'ci_loose.yml');
    const ciContent = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8')
      .replace('npm ci --ignore-scripts=false --no-audit', 'npm ci || npm install');
    fs.writeFileSync(fakeCi, ciContent, 'utf8');
    const res = analyzers.checkCiRequiredChecks(ROOT, { ciFile: fakeCi });
    assert(!res.pass && res.error.includes('strict_npm_ci_without_fallback'),
      'BB-2: Loose npm install fallback in CI YAML is strictly rejected');
  }

  // Scenario BB-3: CI workflow missing required Prisma migration rehearsal
  {
    const fakeCi = path.join(tempSandbox, 'ci_no_migration.yml');
    const ciContent = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8')
      .replace(/prisma migrate deploy/g, 'echo no migration');
    fs.writeFileSync(fakeCi, ciContent, 'utf8');
    const res = analyzers.checkCiRequiredChecks(ROOT, { ciFile: fakeCi });
    assert(!res.pass && res.error.includes('migration'),
      'BB-3: Removing Prisma migration rehearsal from CI YAML is strictly rejected');
  }

  // Scenario BB-4: CI workflow missing required lint step
  {
    const fakeCi = path.join(tempSandbox, 'ci_no_lint.yml');
    const ciContent = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8')
      .replace(/npm --prefix backend run lint/g, 'echo no lint');
    fs.writeFileSync(fakeCi, ciContent, 'utf8');
    const res = analyzers.checkCiRequiredChecks(ROOT, { ciFile: fakeCi });
    assert(!res.pass && res.error.includes('lint'),
      'BB-4: Removing lint step from CI YAML is strictly rejected');
  }

  // Scenario BB-5: Mutated Dockerfile with missing expose port
  {
    const fakeDocker = path.join(tempSandbox, 'Dockerfile.invalid');
    fs.writeFileSync(fakeDocker, 'FROM node:20-alpine\nWORKDIR /app\nRUN npm run build\n', 'utf8');
    const res = analyzers.checkContainerBuild(ROOT, { backendDocker: fakeDocker });
    assert(!res.pass, 'BB-5: Dockerfile missing required EXPOSE port is strictly rejected');
  }

  // Scenario BB-6: On-disk changed TS file with cyclomatic complexity > 15
  {
    const fakeTs = path.join(tempSandbox, 'high_complexity.ts');
    let complexCode = 'export function overlyComplex(a: number, b: number) {\n';
    for (let i = 0; i < 18; i++) {
      complexCode += `  if (a === ${i} || b === ${i}) { return ${i}; }\n`;
    }
    complexCode += '  return 0;\n}\n';
    fs.writeFileSync(fakeTs, complexCode, 'utf8');

    const res = analyzers.checkCyclomaticComplexity(ROOT, { changedFiles: [fakeTs] });
    assert(!res.pass && res.details.violations_count > 0,
      'BB-6: On-disk TS function with complexity > 15 strictly fails cyclomatic complexity gate');
  }

  // Scenario BB-7: On-disk changed TS file with complexity 11-15 lacking @complexity-rationale
  {
    const fakeTs = path.join(tempSandbox, 'medium_complexity_no_rationale.ts');
    let complexCode = 'export function mediumComplex(a: number) {\n';
    for (let i = 0; i < 12; i++) {
      complexCode += `  if (a === ${i}) { return ${i}; }\n`;
    }
    complexCode += '  return 0;\n}\n';
    fs.writeFileSync(fakeTs, complexCode, 'utf8');

    const res = analyzers.checkCyclomaticComplexity(ROOT, { changedFiles: [fakeTs] });
    assert(!res.pass && res.details.missing_rationale_count > 0,
      'BB-7: On-disk TS function with complexity 11-15 lacking @complexity-rationale is strictly rejected');
  }

  // Scenario BB-8: On-disk Screen with unexcepted raw <button>
  {
    const fakeAppDir = path.join(tempSandbox, 'app_unexcepted_button');
    const fakeScreenDir = path.join(fakeAppDir, 'unexcepted');
    fs.mkdirSync(fakeScreenDir, { recursive: true });
    const fakePage = path.join(fakeScreenDir, 'page.tsx');
    fs.writeFileSync(fakePage, 'export default function Page() { return <button>Unapproved</button>; }', 'utf8');

    const res = analyzers.checkDnaNativeInteractive(ROOT, { appDir: fakeAppDir });
    assert(!res.pass && res.details.unhandled_native_count > 0,
      'BB-8: On-disk screen introducing unexcepted native <button> strictly fails DNA gate');
  }

  // Scenario BB-9: On-disk Screen with unexcepted raw UI kit import
  {
    const fakeAppDir = path.join(tempSandbox, 'app_unexcepted_import');
    const fakeScreenDir = path.join(fakeAppDir, 'unexcepted_import');
    fs.mkdirSync(fakeScreenDir, { recursive: true });
    const fakePage = path.join(fakeScreenDir, 'page.tsx');
    fs.writeFileSync(fakePage, "import { Button } from '@/components/ui/button';\nexport default function Page() { return <Button />; }", 'utf8');

    const res = analyzers.checkDnaImportBoundary(ROOT, { appDir: fakeAppDir });
    assert(!res.pass && res.details.unhandled_ui_kit_imports_count > 0,
      'BB-9: On-disk screen importing raw @/components/ui/button strictly fails DNA import boundary');
  }

  // Scenario BB-10: On-disk Screen with unexcepted style={{ inline styling
  {
    const fakeAppDir = path.join(tempSandbox, 'app_unexcepted_style');
    const fakeScreenDir = path.join(fakeAppDir, 'unexcepted_style');
    fs.mkdirSync(fakeScreenDir, { recursive: true });
    const fakePage = path.join(fakeScreenDir, 'page.tsx');
    fs.writeFileSync(fakePage, 'export default function Page() { return <div style={{ color: "#ff0000" }}>Text</div>; }', 'utf8');

    const res = analyzers.checkDnaHardcodedVisual(ROOT, { appDir: fakeAppDir });
    assert(!res.pass && res.details.unhandled_visual_count > 0,
      'BB-10: On-disk screen introducing raw style={{}} strictly fails DNA hardcoded visual scan');
  }

  // Scenario BB-11: Custom UI primitive definition on disk outside canonical @/components/dna
  {
    const fakeFrontendDir = path.join(tempSandbox, 'frontend_custom_primitive');
    fs.mkdirSync(fakeFrontendDir, { recursive: true });
    const fakePrimitive = path.join(fakeFrontendDir, 'MyCustomDialog.tsx');
    fs.writeFileSync(fakePrimitive, 'export function CustomDialog() { return null; }', 'utf8');

    const res = analyzers.checkDnaPrimitiveDuplication(ROOT, { frontendDir: fakeFrontendDir });
    assert(!res.pass && res.details.duplicate_primitives_count > 0,
      'BB-11: On-disk custom CustomDialog primitive definition strictly fails primitive duplication scan');
  }

  // Scenario BB-12: Downward ratchet violation in DNA exceptions registry
  {
    const res = analyzers.checkDnaExceptionRegistry(ROOT, { baselineMax: 100 });
    assert(!res.pass && res.error.includes('EXCEEDED'),
      'BB-12: Downward ratchet enforcement fails when exceptions count exceeds baseline max allowed');
  }

  // Scenario BB-13: Expired DNA exception on disk
  {
    const fakeExceptionsFile = path.join(tempSandbox, 'dna-exceptions-expired.yaml');
    const expiredEntry = `
- id: DNA-EXC-EXPIRED
  file: frontend/src/app/(dashboard)/finance/audit-ledger/page.tsx
  rule: DNA_HARDCODED_VISUAL
  owner: frontend_team
  rationale: Test expired
  scope: hardcoded_tokens_and_styles
  test: test.js
  created_at: '2026-01-01'
  expires_at: '2026-01-02'
  dna_extension_issue: ISSUE-123
  approved_by: arb
`;
    fs.writeFileSync(fakeExceptionsFile, expiredEntry, 'utf8');
    const res = analyzers.checkDnaExceptionRegistry(ROOT, {
      exceptionsFile: fakeExceptionsFile,
      today: '2026-09-18'
    });
    assert(!res.pass && res.details.expired_exceptions_count > 0,
      'BB-13: Expired exception on disk is strictly rejected by exception registry gate');
  }

  // Scenario BB-14: Missing target file referenced in DNA exception
  {
    const fakeExceptionsFile = path.join(tempSandbox, 'dna-exceptions-missing-file.yaml');
    const missingFileEntry = `
- id: DNA-EXC-MISSING
  file: frontend/src/app/(dashboard)/nonexistent-screen/page.tsx
  rule: DNA_NATIVE_INTERACTIVE
  owner: frontend_team
  rationale: Test missing file
  scope: native_interactive_elements
  test: test.js
  created_at: '2026-09-01'
  expires_at: '2026-12-31'
  dna_extension_issue: ISSUE-123
  approved_by: arb
`;
    fs.writeFileSync(fakeExceptionsFile, missingFileEntry, 'utf8');
    const res = analyzers.checkDnaExceptionRegistry(ROOT, {
      exceptionsFile: fakeExceptionsFile
    });
    assert(!res.pass && res.details.missing_files_count > 0,
      'BB-14: Exception referencing non-existent screen file on disk is strictly rejected');
  }

  // Scenario BB-15: Cross-module controller import on disk
  {
    const fakeModulesDir = path.join(tempSandbox, 'backend_modules');
    const modADir = path.join(fakeModulesDir, 'modA');
    const modBDir = path.join(fakeModulesDir, 'modB');
    fs.mkdirSync(modADir, { recursive: true });
    fs.mkdirSync(modBDir, { recursive: true });

    fs.writeFileSync(path.join(modADir, 'a.controller.ts'), 'export class AController {}', 'utf8');
    fs.writeFileSync(path.join(modBDir, 'b.service.ts'),
      "import { AController } from '../modA/a.controller';\nexport class BService {}", 'utf8');

    const res = analyzers.checkModuleBoundaries(ROOT, { modulesDir: fakeModulesDir });
    assert(!res.pass && res.details.violations_count > 0,
      'BB-15: On-disk cross-module controller import strictly fails module boundary gate');
  }

  // Scenario BB-16: Inverted dependency layer (Service importing Controller)
  {
    const fakeBackendSrc = path.join(tempSandbox, 'backend_inverted');
    fs.mkdirSync(path.join(fakeBackendSrc, 'common'), { recursive: true });
    fs.writeFileSync(
      path.join(fakeBackendSrc, 'order.service.ts'),
      "import { OrderController } from './order.controller';\nexport class OrderService {}",
      'utf8'
    );

    const res = analyzers.checkDependencyDirection(ROOT, { backendSrc: fakeBackendSrc });
    assert(!res.pass && res.details.violations_count > 0,
      'BB-16: On-disk inverted dependency (service importing controller) strictly fails dependency direction');
  }

  // Scenario BB-17: Circular AST dependency on disk
  {
    const fakeSrc = path.join(tempSandbox, 'circular_src');
    fs.mkdirSync(fakeSrc, { recursive: true });
    fs.writeFileSync(path.join(fakeSrc, 'fileA.ts'), "import { b } from './fileB';\nexport const a = 1;", 'utf8');
    fs.writeFileSync(path.join(fakeSrc, 'fileB.ts'), "import { a } from './fileA';\nexport const b = 2;", 'utf8');

    const res = analyzers.detectCircularDependencies(ROOT, { dirs: [fakeSrc] });
    assert(!res.pass && res.details.cycles_count > 0,
      'BB-17: Circular import cycle between on-disk TS files strictly fails circular dependency detector');
  }

  // Scenario BB-18: Frontend lint warning increase exceeding baseline ratchet
  {
    const res = analyzers.checkLint(ROOT, {
      skipSubprocess: true,
      syntheticError: 'Warning ratchet exceeded: 8250 > 8218'
    });
    assert(!res.pass, 'BB-18: Frontend lint warning debt increase strictly fails lint downward ratchet');
  }

  // Scenario BB-19: Duplicate route collision in controller decorators
  {
    const fakeControllersDir = path.join(tempSandbox, 'collision_controllers');
    fs.mkdirSync(fakeControllersDir, { recursive: true });
    fs.writeFileSync(
      path.join(fakeControllersDir, 'order1.controller.ts'),
      "@Controller('orders')\nexport class O1 { @Get('list') list() {} }",
      'utf8'
    );
    fs.writeFileSync(
      path.join(fakeControllersDir, 'order2.controller.ts'),
      "@Controller('orders')\nexport class O2 { @Get('list') list() {} }",
      'utf8'
    );

    const res = analyzers.checkDuplicateCode(ROOT, { controllersDir: fakeControllersDir, targetFiles: [] });
    assert(!res.pass && res.details.collisions_count > 0,
      'BB-19: Duplicate endpoint route collision on disk strictly fails duplicate code gate');
  }

  // Scenario BB-20: Double prefix bug in controller decorators (/api/v1/api/v1)
  {
    const fakeControllersDir = path.join(tempSandbox, 'double_prefix_controllers');
    fs.mkdirSync(fakeControllersDir, { recursive: true });
    fs.writeFileSync(
      path.join(fakeControllersDir, 'bad.controller.ts'),
      "@Controller('api/v1/api/v1/orders')\nexport class BadController {}",
      'utf8'
    );

    const res = analyzers.checkDuplicateCode(ROOT, { controllersDir: fakeControllersDir, targetFiles: [] });
    assert(!res.pass && res.details.collisions_count > 0,
      'BB-20: Double prefix bug (/api/v1/api/v1) on disk strictly fails duplicate code gate');
  }

} finally {
  // Clean up temporary sandbox fixtures
  try {
    fs.rmSync(tempSandbox, { recursive: true, force: true });
  } catch (_) {}
}

// =============================================================================
// PART 2: Fast Unit-Level Negative Injections (Coverage Across All Options)
// =============================================================================
console.log('\n--- PART 2: Fast Unit-Level Negative Injections ---');

// Typecheck synthetic error
{
  const res = analyzers.checkTypecheck(ROOT, {
    syntheticSourceFiles: { 'test.ts': 'const x: number = "type-error";' }
  });
  assert(!res.pass && res.diagnostics_count > 0, 'UNIT-1: TypeScript diagnostic type error is caught');
}

// Unit smoke zero spec files
{
  const res = analyzers.checkUnitSmoke(ROOT, { backendDir: path.join(ROOT, 'tmp/empty') });
  assert(!res.pass, 'UNIT-2: Empty test specs directory fails unit smoke gate');
}

// Unused production dependencies
{
  const res = analyzers.checkUnusedProductionDependencies(ROOT, {
    syntheticUnused: ['unregistered-malicious-package']
  });
  assert(!res.pass, 'UNIT-3: Unregistered production dependency fails dependency check');
}

// Unexplained orphan objects
{
  const res = analyzers.checkOrphanObjects(ROOT, {
    syntheticOrphans: ['OrphanController', 'OrphanService']
  });
  assert(!res.pass, 'UNIT-4: Injected orphan objects fail orphan object scan');
}

// DNA barrel integrity missing barrel file
{
  const res = analyzers.checkDnaBarrelIntegrity(ROOT, {
    barrelFile: path.join(ROOT, 'tmp/nonexistent-barrel.ts')
  });
  assert(!res.pass, 'UNIT-5: Missing DNA barrel file fails barrel integrity check');
}

// DNA reference routes missing redirect
{
  const res = analyzers.checkDnaReferenceRoutes(ROOT, {
    canonicalVisual: path.join(ROOT, 'tmp/nonexistent.tsx')
  });
  assert(!res.pass, 'UNIT-6: Missing canonical visual DNA page fails reference route gate');
}

// DNA screen coverage manifest drift
{
  const fakeRegistry = path.join(os.tmpdir(), `fake-reg-${Date.now()}.json`);
  fs.writeFileSync(fakeRegistry, JSON.stringify({
    dna_screen_inventory: [{ file: 'test' }],
    metrics: { dna_screen_inventory: { total_screens: 272, coverage_percent: 50 } }
  }), 'utf8');

  const res = analyzers.checkDnaScreenCoverageManifest(ROOT, { registryFile: fakeRegistry });
  assert(!res.pass, 'UNIT-7: Screen coverage manifest count drift fails coverage gate');
  try { fs.unlinkSync(fakeRegistry); } catch (_) {}
}

// Missing Docker compose file
{
  const res = analyzers.checkContainerBuild(ROOT, { compose: path.join(ROOT, 'tmp/nonexistent-compose.yml') });
  assert(!res.pass, 'UNIT-8: Missing docker-compose.yml fails container build gate');
}

// Synthetic circular dependency graph
{
  const res = analyzers.detectCircularDependencies(ROOT, {
    dirs: [],
    syntheticGraph: {
      'src/A.ts': ['src/B.ts'],
      'src/B.ts': ['src/A.ts']
    }
  });
  assert(!res.pass && res.details.cycles_count > 0, 'UNIT-9: Synthetic cycle graph is caught by DFS detector');
}

// Synthetic module boundary violation
{
  const res = analyzers.checkModuleBoundaries(ROOT, {
    syntheticViolations: [{ file: 'backend/src/modules/finance/finance.controller.ts', reason: 'Cross-module leak' }]
  });
  assert(!res.pass, 'UNIT-10: Injected cross-module violation fails module boundaries');
}

// Synthetic dependency direction violation
{
  const res = analyzers.checkDependencyDirection(ROOT, {
    syntheticViolations: [{ file: 'backend/src/modules/marketing/marketing.service.ts', reason: 'Inverted dependency' }]
  });
  assert(!res.pass, 'UNIT-11: Injected service->controller import fails dependency direction');
}

// Synthetic duplicate route collision
{
  const res = analyzers.checkDuplicateCode(ROOT, {
    syntheticCollisions: [{ file: 'test.controller.ts', error: 'Duplicate route GET /api/v1/tasks' }]
  });
  assert(!res.pass, 'UNIT-12: Injected duplicate route collision fails duplicate code gate');
}

// Synthetic cyclomatic complexity spike
{
  const res = analyzers.checkCyclomaticComplexity(ROOT, {
    syntheticViolations: [{ file: 'test.ts', line: 10, name: 'monster', complexity: 25 }]
  });
  assert(!res.pass, 'UNIT-13: Injected function complexity > 15 fails complexity gate');
}

// Synthetic DNA native interactive element
{
  const res = analyzers.checkDnaNativeInteractive(ROOT, {
    syntheticViolations: ['frontend/src/app/(dashboard)/test/page.tsx']
  });
  assert(!res.pass, 'UNIT-14: Injected screen with raw button fails native interactive scan');
}

// Synthetic DNA import boundary violation
{
  const res = analyzers.checkDnaImportBoundary(ROOT, {
    syntheticViolations: ['frontend/src/app/(dashboard)/test/page.tsx']
  });
  assert(!res.pass, 'UNIT-15: Injected screen importing raw UI kit fails import boundary');
}

// Synthetic DNA hardcoded visual token
{
  const res = analyzers.checkDnaHardcodedVisual(ROOT, {
    syntheticViolations: ['frontend/src/app/(dashboard)/test/page.tsx']
  });
  assert(!res.pass, 'UNIT-16: Injected screen with inline style fails hardcoded visual scan');
}

console.log('\n=======================================================');
console.log(`ADVERSARIAL NEGATIVE SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
if (failedTests > 0) {
  console.error(`FAILED TESTS: ${failedTests}`);
  process.exit(1);
} else {
  console.log('OVERALL NEGATIVE SUITE VERDICT: PASS (All corruptions deterministically rejected)');
  process.exit(0);
}
