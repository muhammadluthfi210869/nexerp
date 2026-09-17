/**
 * NEX ERP — Independent Model Target Validator
 * Validates that 100% of target models, files, and symbols in canonical reconciliation exist on disk.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REGISTRY_FILE = path.join(ROOT, 'docs/legacy-erp/verification/_LIFECYCLE_REGISTRY.json');

console.log('Running Independent Model Target Validation...\n');
const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));

let errors = [];
let checked = 0;

for (const [modelName, record] of Object.entries(registry.canonical_model_reconciliation || {})) {
  checked++;
  if (record.implementation_kind && record.implementation_kind !== 'MODEL') {
    // Check typed mapping
    const fullPath = path.join(ROOT, record.implementation_path);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Typed mapping file does not exist for ${modelName}: ${record.implementation_path}`);
    } else {
      const code = fs.readFileSync(fullPath, 'utf8');
      if (!code.includes(record.implementation_symbol)) {
        errors.push(`Symbol ${record.implementation_symbol} missing from ${record.implementation_path} for ${modelName}`);
      }
    }
  } else if (record.target_files) {
    for (const f of record.target_files) {
      if (!fs.existsSync(path.join(ROOT, f))) {
        errors.push(`Target model file does not exist for ${modelName}: ${f}`);
      }
    }
  }
}

console.log(`Audited ${checked} canonical model targets.`);
if (errors.length > 0) {
  console.error('❌ Validation FAILED:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ PASS: All canonical model targets, files, and symbols exist and are verified.');
  process.exit(0);
}
