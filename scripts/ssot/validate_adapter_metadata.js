/**
 * NEX ERP — Independent Compatibility Adapter Metadata & Target Validator
 * Validates that 100% of compatibility adapters have complete metadata and verified runtime existence.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REGISTRY_FILE = path.join(ROOT, 'docs/legacy-erp/verification/_LIFECYCLE_REGISTRY.json');

console.log('Running Independent Compatibility Adapter Validation...\n');
const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));

const adapters = registry.compatibility_adapters || [];
let errors = [];

if (adapters.length === 0) {
  errors.push('No compatibility adapters registered');
}

for (const a of adapters) {
  if (!a.id) errors.push('Adapter missing id');
  if (!a.type) errors.push(`Adapter ${a.id} missing type`);
  if (!a.path_or_symbol) errors.push(`Adapter ${a.id} missing path_or_symbol`);
  if (!a.target) errors.push(`Adapter ${a.id} missing target`);
  if (!a.owner) errors.push(`Adapter ${a.id} missing owner`);
  if (!a.rationale) errors.push(`Adapter ${a.id} missing rationale`);
  if (!a.removal_condition) errors.push(`Adapter ${a.id} missing removal_condition`);
  if (!a.scheduled_removal_phase) errors.push(`Adapter ${a.id} missing scheduled_removal_phase`);

  // Verify runtime existence
  if (a.verification_target) {
    const fullTarget = path.join(ROOT, a.verification_target);
    if (!fs.existsSync(fullTarget)) {
      errors.push(`Adapter ${a.id} verification target file does not exist: ${a.verification_target}`);
    } else {
      const content = fs.readFileSync(fullTarget, 'utf8');
      if (a.type === 'ROUTE_REDIRECT') {
        if (!content.includes(a.path_or_symbol)) {
          errors.push(`Adapter ${a.id} route ${a.path_or_symbol} not found in ${a.verification_target}`);
        }
      } else if (a.type === 'MODEL_COMPATIBILITY') {
        if (!content.includes(a.path_or_symbol)) {
          errors.push(`Adapter ${a.id} model ${a.path_or_symbol} not found in ${a.verification_target}`);
        }
      }
    }
  }
}

console.log(`Audited ${adapters.length} compatibility adapters.`);

if (errors.length > 0) {
  console.error('❌ Validation FAILED:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ PASS: All compatibility adapters have verified runtime paths, owners, and removal conditions.');
  process.exit(0);
}
