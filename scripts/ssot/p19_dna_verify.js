/**
 * NEX ERP — Phase P19 UI DNA Compliance Verification Script
 * Governed by:
 * - docs/legacy-erp/verification/_FAST_DELIVERY_EXECUTION_STANDARD.md
 * - docs/legacy-erp/verification/_UI_DNA_COMPLIANCE_STANDARD.md
 * - contracts/09_NON_FUNCTIONAL_CONTRACT.md §11A
 *
 * Verifies:
 * 1. ZERO direct imports of @/components/ui/* outside components/dna and components/ui.
 * 2. Canonical DNA barrel completeness for both Operational DNA and Dashboard (ACUAN_DASHBOARD) DNA.
 * 3. Legacy Visual DNA redirects in frontend/next.config.ts.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const FRONTEND_SRC = path.join(ROOT, 'frontend/src');

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  NEX ERP — Phase P19 Strict UI DNA Compliance Verification');
console.log('═══════════════════════════════════════════════════════════════════════\n');

function walk(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', 'dist', '__tests__'].includes(entry.name)) {
        results = results.concat(walk(fullPath));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      results.push(fullPath);
    }
  }
  return results;
}

let hasError = false;

// Gate 1: Check Import Boundary
console.log('[1/3] Scanning AST / import boundaries for forbidden @/components/ui/ imports...');
const allFiles = walk(FRONTEND_SRC);
const violatingFiles = [];

for (const file of allFiles) {
  const norm = file.replace(/\\/g, '/');
  if (norm.includes('/components/dna') || norm.includes('/components/ui')) {
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  if (/from ['"]@\/components\/ui\/[a-zA-Z0-9_-]+['"]/.test(content)) {
    violatingFiles.push(path.relative(ROOT, file));
  }
}

if (violatingFiles.length > 0) {
  console.error(`❌ FAIL: Found ${violatingFiles.length} files directly importing from @/components/ui/:`);
  for (const f of violatingFiles) {
    console.error(`   - ${f}`);
  }
  hasError = true;
} else {
  console.log(`✅ PASS: 0 direct @/components/ui/ imports found across ${allFiles.length} source files.`);
}

// Gate 2: Check DNA Barrel Integrity
console.log('\n[2/3] Verifying Canonical DNA Barrel exports in frontend/src/components/dna/index.ts...');
const dnaBarrelPath = path.join(FRONTEND_SRC, 'components/dna/index.ts');
const fieldCompatPath = path.join(FRONTEND_SRC, 'components/dna/DnaFieldCompat.tsx');

if (!fs.existsSync(dnaBarrelPath) || !fs.existsSync(fieldCompatPath)) {
  console.error('❌ FAIL: DNA barrel or DnaFieldCompat does not exist.');
  hasError = true;
} else {
  const barrelContent = fs.readFileSync(dnaBarrelPath, 'utf8');
  const compatContent = fs.readFileSync(fieldCompatPath, 'utf8');
  const combined = barrelContent + '\n' + compatContent;

  const requiredExports = [
    // Dashboard DNA (ACUAN_DASHBOARD)
    'DataCard',
    'MetricRow',
    'SectionLabel',
    'KpiCard',
    'DashboardCard',
    'DashboardMetric',
    'InsightCallout',
    'GlobalAlert',
    'StatusPill',
    // Operational DNA
    'DnaPageHeader',
    'DnaDataTableCard',
    'DnaTableToolbar',
    'DnaPagination',
    'DnaButton',
    'DnaInput',
    'DnaSelect',
    'DnaBadge',
    'DnaDialog',
    'DnaSheet',
    // Re-exported Primitives
    'Button',
    'Card',
    'Table',
    'Dialog',
    'Select',
    'Input',
    'Tabs',
    'Badge',
    'Skeleton',
    'Slider',
    'EmptyState',
    'LoadingSkeleton',
    'Toaster',
  ];

  const missing = [];
  for (const exp of requiredExports) {
    if (!combined.includes(exp)) {
      missing.push(exp);
    }
  }

  if (missing.length > 0) {
    console.error(`❌ FAIL: Missing required exports in DNA barrel: ${missing.join(', ')}`);
    hasError = true;
  } else {
    console.log(`✅ PASS: All ${requiredExports.length} required Dual-DNA and primitive components are exported.`);
  }
}

// Gate 3: Check Legacy Route Redirects
console.log('\n[3/3] Verifying Next.js legacy route redirects in frontend/next.config.ts...');
const nextConfigPath = path.join(ROOT, 'frontend/next.config.ts');
if (!fs.existsSync(nextConfigPath)) {
  console.error('❌ FAIL: frontend/next.config.ts not found.');
  hasError = true;
} else {
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  const requiredRedirects = [
    '/dna-visual',
    '/dna-visual/golden-reference',
    '/master/dna-visual',
    '/master/dna-visual/golden-reference',
  ];
  const missingRedirects = [];
  for (const red of requiredRedirects) {
    if (!nextConfigContent.includes(red)) {
      missingRedirects.push(red);
    }
  }

  if (missingRedirects.length > 0) {
    console.error(`❌ FAIL: Missing legacy redirects: ${missingRedirects.join(', ')}`);
    hasError = true;
  } else {
    console.log(`✅ PASS: All 4 legacy visual DNA aliases are cleanly redirected to /visual-dna*.`);
  }
}

console.log('\n═══════════════════════════════════════════════════════════════════════');
if (hasError) {
  console.error('  ❌ PHASE P19 DNA COMPLIANCE VERIFICATION: FAILED');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  process.exit(1);
} else {
  console.log('  ✅ PHASE P19 DNA COMPLIANCE VERIFICATION: ALL CHECKS PASSED');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  process.exit(0);
}
