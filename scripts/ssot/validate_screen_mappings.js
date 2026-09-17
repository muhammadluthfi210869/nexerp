/**
 * NEX ERP — Independent Screen Mapping Validator
 * Validates that 100% of canonical screens have explicit records with valid targets or plans.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REGISTRY_FILE = path.join(ROOT, 'docs/legacy-erp/verification/_LIFECYCLE_REGISTRY.json');

console.log('Running Independent Screen Mapping Validation...\n');
const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
const screenDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json'), 'utf8'));
const dynamicCanonicalScreens = screenDoc.screens || [];

const records = registry.canonical_screen_reconciliation || [];
let errors = [];

if (records.length !== dynamicCanonicalScreens.length) {
  errors.push(`Record count mismatch: registry has ${records.length}, canonical source has ${dynamicCanonicalScreens.length}`);
}

let implementedCount = 0;
let plannedCount = 0;

for (const s of records) {
  if (!s.lifecycle_classification || !s.owner || !s.rationale) {
    errors.push(`Screen ${s.screen_id} missing lifecycle/owner/rationale`);
  }

  if (s.implementation_state === 'IMPLEMENTED_EXACT' || s.implementation_state === 'IMPLEMENTED_MAPPED') {
    implementedCount++;
    if (!s.component_file || !fs.existsSync(path.join(ROOT, s.component_file))) {
      errors.push(`Screen ${s.screen_id} target component file does not exist on disk: ${s.component_file}`);
    }
  } else if (s.implementation_state === 'PLANNED') {
    plannedCount++;
    if (!s.target_phase || !s.target_planned_route || !s.acceptance_gate || !s.required_test || !s.dependency) {
      errors.push(`Planned screen ${s.screen_id} missing required plan attributes`);
    }
    if (s.target_planned_route.includes('{') || s.target_planned_route.includes('}')) {
      errors.push(`Planned screen ${s.screen_id} target route has invalid Next.js braces: ${s.target_planned_route}`);
    }
    if (!/^P(0[0-9]|1[0-9]|2[0-2])$/.test(s.target_phase)) {
      errors.push(`Planned screen ${s.screen_id} has invalid roadmap phase: ${s.target_phase}`);
    }
  } else {
    errors.push(`Screen ${s.screen_id} has invalid implementation_state: ${s.implementation_state}`);
  }
}

console.log(`Audited ${records.length} canonical screens:`);
console.log(`  - Implemented on disk: ${implementedCount}`);
console.log(`  - Formally Planned: ${plannedCount}`);
console.log(`  - Reconciliation Coverage: ${((records.length / dynamicCanonicalScreens.length) * 100).toFixed(2)}%`);

if (errors.length > 0) {
  console.error('❌ Validation FAILED:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ PASS: All canonical screens have explicit verified file targets or plan records.');
  process.exit(0);
}
