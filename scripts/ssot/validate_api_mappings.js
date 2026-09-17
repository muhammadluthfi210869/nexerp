/**
 * NEX ERP — Independent API Mapping Validator
 * Validates that 100% of canonical API operations have explicit records with valid targets or plans.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('../../backend/node_modules/js-yaml');

const ROOT = path.resolve(__dirname, '../..');
const REGISTRY_FILE = path.join(ROOT, 'docs/legacy-erp/verification/_LIFECYCLE_REGISTRY.json');

console.log('Running Independent API Mapping Validation...\n');
const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
const canonicalApi = yaml.load(fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/contracts/05_API_CONTRACT.yaml'), 'utf8'));

let dynamicCount = 0;
for (const [p, item] of Object.entries(canonicalApi.paths || {})) {
  for (const [m, op] of Object.entries(item || {})) {
    if (['get', 'post', 'put', 'patch', 'delete'].includes(m.toLowerCase())) {
      dynamicCount++;
    }
  }
}

const records = registry.canonical_api_reconciliation || [];
let errors = [];

if (records.length !== dynamicCount) {
  errors.push(`Record count mismatch: registry has ${records.length}, canonical source has ${dynamicCount}`);
}

let implementedCount = 0;
let plannedCount = 0;

for (const op of records) {
  if (!op.lifecycle_classification || !op.owner || !op.rationale) {
    errors.push(`Operation ${op.method} ${op.path} missing lifecycle/owner/rationale`);
  }

  if (op.implementation_state === 'IMPLEMENTED_EXACT' || op.implementation_state === 'IMPLEMENTED_MAPPED') {
    implementedCount++;
    if (!op.implementation_method || !op.implementation_path) {
      errors.push(`Implemented operation ${op.method} ${op.path} missing implementation target`);
    }
  } else if (op.implementation_state === 'PLANNED') {
    plannedCount++;
    if (!op.target_phase || !op.target_module_or_file || !op.acceptance_gate || !op.required_test || !op.dependency) {
      errors.push(`Planned operation ${op.method} ${op.path} missing required plan attributes`);
    }
    if (!/^P(0[0-9]|1[0-9]|2[0-2])$/.test(op.target_phase)) {
      errors.push(`Planned operation ${op.method} ${op.path} has invalid roadmap phase: ${op.target_phase}`);
    }
  } else {
    errors.push(`Operation ${op.method} ${op.path} has invalid implementation_state: ${op.implementation_state}`);
  }
}

console.log(`Audited ${records.length} canonical API operations:`);
console.log(`  - Implemented: ${implementedCount}`);
console.log(`  - Formally Planned: ${plannedCount}`);
console.log(`  - Reconciliation Coverage: ${((records.length / dynamicCount) * 100).toFixed(2)}%`);

if (errors.length > 0) {
  console.error('❌ Validation FAILED:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ PASS: All canonical API operations have explicit verified mappings or plan records.');
  process.exit(0);
}
