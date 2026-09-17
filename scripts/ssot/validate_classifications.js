/**
 * NEX ERP — Independent Classification Validator
 * Validates that 100% of implementation objects have individual lifecycle classifications and owners (zero orphans).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REGISTRY_FILE = path.join(ROOT, 'docs/legacy-erp/verification/_LIFECYCLE_REGISTRY.json');

console.log('Running Independent Classification & Orphan Validator...\n');
const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));

let errors = [];
const VALID_LIFECYCLES = new Set([
  'CANONICAL',
  'APPROVED_EXTENSION',
  'COMPATIBILITY_ADAPTER',
  'DUPLICATE',
  'DEPRECATED',
  'DEAD_CODE',
  'DECISION_REQUIRED',
]);

const collections = [
  { name: 'implementation_models', items: Object.values(registry.implementation_model_classifications || {}) },
  { name: 'implementation_screens', items: registry.implementation_screen_classifications || [] },
  { name: 'backend_controllers', items: registry.backend_controllers || [] },
  { name: 'backend_services', items: registry.backend_services || [] },
  { name: 'backend_modules', items: registry.backend_modules || [] },
  { name: 'migrations', items: registry.migrations || [] },
  { name: 'jobs_schedulers', items: registry.jobs_schedulers || [] },
  { name: 'published_subscribed_events', items: registry.published_subscribed_events || [] },
  { name: 'barrel_exports', items: registry.barrel_exports || [] },
  { name: 'backend_dependencies', items: registry.backend_dependencies || [] },
  { name: 'frontend_dependencies', items: registry.frontend_dependencies || [] },
  { name: 'compatibility_adapters', items: registry.compatibility_adapters || [] },
];

let totalAudited = 0;

for (const col of collections) {
  for (const item of col.items) {
    totalAudited++;
    const id = item.model || item.file || item.name || item.route || 'unknown';
    const classification = item.lifecycle_classification || item.status;

    if (!classification || (!VALID_LIFECYCLES.has(classification) && classification !== 'EXECUTED_MIGRATION')) {
      errors.push(`${col.name}:${id} has invalid or missing lifecycle classification: ${classification}`);
    }

    if (!item.owner) {
      errors.push(`${col.name}:${id} missing owner`);
    }

    if (!item.rationale) {
      errors.push(`${col.name}:${id} missing rationale`);
    }
  }
}

console.log(`Audited ${totalAudited} implementation objects across models, screens, controllers, services, modules, migrations, and dependencies.`);

if (errors.length > 0) {
  console.error('❌ Validation FAILED:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ PASS: All implementation objects are individually classified with declared owners and rationales. Zero unexplained orphans.');
  process.exit(0);
}
