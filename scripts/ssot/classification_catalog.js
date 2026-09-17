/**
 * NEX ERP — SSOT Classification Catalog
 * Authoritative individual definitions, owners, rationales, and typed mappings for Phase P02.
 */

const fs = require('fs');
const path = require('path');

const LIFECYCLE_ENUM = [
  'CANONICAL',
  'APPROVED_EXTENSION',
  'COMPATIBILITY_ADAPTER',
  'DUPLICATE',
  'DEPRECATED',
  'DEAD_CODE',
  'DECISION_REQUIRED',
];

const VALID_PHASES = new Set([
  'P00', 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09',
  'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19',
  'P20', 'P21', 'P22'
]);

const TYPED_MAPPINGS = {
  Role: {
    implementation_kind: 'ENUM',
    implementation_state: 'IMPLEMENTED_ADAPTER',
    implementation_path: 'backend/prisma/schema/enums.prisma',
    implementation_symbol: 'enum UserRole',
    semantic_equivalence: 'Static enumeration of system roles representing user authorities; transition to dynamic Role entity in database planned for P04.',
    owner: 'Platform Security Team',
    rationale: 'Role definitions are currently maintained as a static Prisma enum UserRole; transition to dynamic Role model scheduled for P04.',
    verification_method: 'PRISMA_ENUM_PARSER',
    target_phase: 'P04',
    scheduled_removal_phase: 'P04',
    removal_condition: 'Migration to dynamic Role entity in database in P04.',
  },
  Permission: {
    implementation_kind: 'GUARD',
    implementation_state: 'IMPLEMENTED_ADAPTER',
    implementation_path: 'backend/src/modules/auth/roles.guard.ts',
    implementation_symbol: 'RolesGuard',
    semantic_equivalence: 'Route-level role-based authorization guard checking requested roles via Reflector metadata; transition to dynamic Permission table planned for P04.',
    owner: 'Platform Security Team',
    rationale: 'Fine-grained permissions enforced via RolesGuard and roles decorator; dynamic Permission entity planned for P04.',
    verification_method: 'TYPESCRIPT_AST_SYMBOL',
    target_phase: 'P04',
    scheduled_removal_phase: 'P04',
    removal_condition: 'Migration to dynamic Permission table in P04.',
  },
  RolePermission: {
    implementation_kind: 'GUARD',
    implementation_state: 'IMPLEMENTED_ADAPTER',
    implementation_path: 'backend/src/modules/auth/roles.guard.ts',
    implementation_symbol: 'RolesGuard',
    semantic_equivalence: 'Hardcoded role-to-access mappings evaluated procedurally in RolesGuard; transition to dynamic RolePermission schema table planned for P04.',
    owner: 'Platform Security Team',
    rationale: 'Role permission mapping is realized procedurally within RolesGuard logic until dynamic RolePermission relation table is implemented in P04.',
    verification_method: 'TYPESCRIPT_AST_SYMBOL',
    target_phase: 'P04',
    scheduled_removal_phase: 'P04',
    removal_condition: 'Migration to dynamic RolePermission schema table in P04.',
  },
  UserSession: {
    implementation_kind: 'SERVICE',
    implementation_state: 'IMPLEMENTED_ADAPTER',
    implementation_path: 'backend/src/modules/auth/auth.service.ts',
    implementation_symbol: 'AuthService',
    semantic_equivalence: 'Stateless signed JWT token session management issued by AuthService.login(); transition to DB session store planned for P05.',
    owner: 'Platform Security Team',
    rationale: 'User sessions currently maintained as signed stateless JWT payloads; stateful UserSession table with revocation planned for P05.',
    verification_method: 'TYPESCRIPT_AST_SYMBOL',
    target_phase: 'P05',
    scheduled_removal_phase: 'P05',
    removal_condition: 'Migration to database-backed UserSession table in P05.',
  },
};

const COMPATIBILITY_ADAPTERS = [
  {
    id: 'ADAPTER-001',
    type: 'ROUTE_REDIRECT',
    path_or_symbol: '/dna-visual',
    target: '/visual-dna',
    owner: 'Design System Team',
    rationale: 'Compatibility redirect preserving old legacy bookmarks to canonical visual DNA specification.',
    removal_condition: 'Post-UAT release window after full browser cache expiry.',
    scheduled_removal_phase: 'P21',
    verification_method: 'NEXT_CONFIG_REDIRECT_VERIFIER',
    verification_target: 'frontend/next.config.ts',
    status: 'COMPATIBILITY_ADAPTER',
  },
  {
    id: 'ADAPTER-002',
    type: 'ROUTE_REDIRECT',
    path_or_symbol: '/dna-visual/golden-reference',
    target: '/visual-dna/golden-reference',
    owner: 'Design System Team',
    rationale: 'Compatibility redirect to canonical golden reference visual route.',
    removal_condition: 'Post-UAT release window.',
    scheduled_removal_phase: 'P21',
    verification_method: 'NEXT_CONFIG_REDIRECT_VERIFIER',
    verification_target: 'frontend/next.config.ts',
    status: 'COMPATIBILITY_ADAPTER',
  },
  {
    id: 'ADAPTER-003',
    type: 'ROUTE_REDIRECT',
    path_or_symbol: '/master/dna-visual',
    target: '/visual-dna',
    owner: 'Design System Team',
    rationale: 'Legacy menu item compatibility redirect to canonical visual DNA.',
    removal_condition: 'Sidebar menu cleanup in P19.',
    scheduled_removal_phase: 'P19',
    verification_method: 'NEXT_CONFIG_REDIRECT_VERIFIER',
    verification_target: 'frontend/next.config.ts',
    status: 'COMPATIBILITY_ADAPTER',
  },
  {
    id: 'ADAPTER-004',
    type: 'ROUTE_REDIRECT',
    path_or_symbol: '/master/dna-visual/golden-reference',
    target: '/visual-dna/golden-reference',
    owner: 'Design System Team',
    rationale: 'Legacy golden reference menu redirect to canonical visual DNA reference.',
    removal_condition: 'Sidebar menu cleanup in P19.',
    scheduled_removal_phase: 'P19',
    verification_method: 'NEXT_CONFIG_REDIRECT_VERIFIER',
    verification_target: 'frontend/next.config.ts',
    status: 'COMPATIBILITY_ADAPTER',
  },
  {
    id: 'ADAPTER-005',
    type: 'MODEL_COMPATIBILITY',
    path_or_symbol: 'MasterKode',
    target: 'Universal Sequence Engine (contracts/00_MASTER_SPEC.md §5.2 DEC-020)',
    owner: 'Architecture Team',
    rationale: 'Auto-generated code sequence tracking table during transition to global universal code engine.',
    removal_condition: 'After full migration of all transaction code generators to universal code engine in P05.',
    scheduled_removal_phase: 'P05',
    verification_method: 'PRISMA_MODEL_PARSER',
    verification_target: 'backend/prisma/schema/master-extension.prisma',
    status: 'COMPATIBILITY_ADAPTER',
  },
  {
    id: 'ADAPTER-006',
    type: 'LEGACY_FIELD_BRIDGE',
    path_or_symbol: 'legacyId / legacyRoleId',
    target: 'Data lineage and analytics provenance (DEC-025)',
    owner: 'Data Architecture Team',
    rationale: 'Preserves numeric legacy IDs from CodeIgniter MySQL database for traceability and audit comparison.',
    removal_condition: 'Retained as read-only audit column until old ERP shutdown (DEC-006).',
    scheduled_removal_phase: 'P21',
    verification_method: 'PRISMA_FIELD_PARSER',
    verification_target: 'backend/prisma/schema/bussdev.prisma',
    status: 'COMPATIBILITY_ADAPTER',
  },
  {
    id: 'ADAPTER-007',
    type: 'TYPED_MODEL_ADAPTER',
    path_or_symbol: 'Role',
    target: 'backend/prisma/schema/enums.prisma (enum UserRole)',
    owner: 'Platform Security Team',
    rationale: 'Role definitions are currently maintained as a static Prisma enum UserRole; transition to dynamic Role model scheduled for P04.',
    removal_condition: 'Migration to dynamic Role entity in database in P04.',
    scheduled_removal_phase: 'P04',
    verification_method: 'PRISMA_ENUM_PARSER',
    verification_target: 'backend/prisma/schema/enums.prisma',
    status: 'COMPATIBILITY_ADAPTER',
  },
  {
    id: 'ADAPTER-008',
    type: 'TYPED_MODEL_ADAPTER',
    path_or_symbol: 'Permission',
    target: 'backend/src/modules/auth/roles.guard.ts (RolesGuard)',
    owner: 'Platform Security Team',
    rationale: 'Fine-grained permissions enforced via RolesGuard and roles decorator; dynamic Permission entity planned for P04.',
    removal_condition: 'Migration to dynamic Permission table in P04.',
    scheduled_removal_phase: 'P04',
    verification_method: 'TYPESCRIPT_AST_SYMBOL',
    verification_target: 'backend/src/modules/auth/roles.guard.ts',
    status: 'COMPATIBILITY_ADAPTER',
  },
  {
    id: 'ADAPTER-009',
    type: 'TYPED_MODEL_ADAPTER',
    path_or_symbol: 'RolePermission',
    target: 'backend/src/modules/auth/roles.guard.ts (RolesGuard)',
    owner: 'Platform Security Team',
    rationale: 'Role permission mapping is realized procedurally within RolesGuard logic until dynamic RolePermission relation table is implemented in P04.',
    removal_condition: 'Migration to dynamic RolePermission schema table in P04.',
    scheduled_removal_phase: 'P04',
    verification_method: 'TYPESCRIPT_AST_SYMBOL',
    verification_target: 'backend/src/modules/auth/roles.guard.ts',
    status: 'COMPATIBILITY_ADAPTER',
  },
  {
    id: 'ADAPTER-010',
    type: 'TYPED_MODEL_ADAPTER',
    path_or_symbol: 'UserSession',
    target: 'backend/src/modules/auth/auth.service.ts (AuthService)',
    owner: 'Platform Security Team',
    rationale: 'User sessions currently maintained as signed stateless JWT payloads; stateful UserSession table with revocation planned for P05.',
    removal_condition: 'Migration to database-backed UserSession table in P05.',
    scheduled_removal_phase: 'P05',
    verification_method: 'TYPESCRIPT_AST_SYMBOL',
    verification_target: 'backend/src/modules/auth/auth.service.ts',
    status: 'COMPATIBILITY_ADAPTER',
  },
];

const DOMAIN_TEAMS = {
  auth: 'Platform Security Team',
  users: 'Platform Security Team',
  roles: 'Platform Security Team',
  system: 'Platform Core Team',
  activity: 'Platform Core Team',
  master: 'Master Data Team',
  commercial: 'Commercial Team',
  sales: 'Commercial Team',
  bussdev: 'Commercial Team',
  crm: 'Commercial Team',
  procurement: 'Procurement & SCM Team',
  scm: 'Procurement & SCM Team',
  purchase: 'Procurement & SCM Team',
  warehouse: 'Warehouse Team',
  inventory: 'Warehouse Team',
  production: 'Production Team',
  qc: 'Quality Control Team',
  rnd: 'R&D Team',
  finance: 'Finance Team',
  hr: 'HR Team',
  communication: 'Collaboration Platform Team',
  legal: 'Legal & Regulatory Team',
  marketing: 'Marketing & Omni-CRM Team',
  creative: 'Creative Design Team',
  website: 'Digital Marketing Team',
  reports: 'Reporting & Analytics Team',
  dashboards: 'Reporting & Analytics Team',
  checklists: 'Quality Control Team',
  audit: 'Platform Core Team',
  files: 'Platform Storage Team',
  general: 'Engineering Team',
};

const DOMAIN_PHASE = {
  auth: { phase: 'P05', gate: 'Platform security and token store gate', dep: 'P04 schema migration' },
  users: { phase: 'P06', gate: 'User and master personnel parity gate', dep: 'P05 auth controls' },
  roles: { phase: 'P05', gate: 'RBAC dynamic permission gate', dep: 'P04 schema migration' },
  system: { phase: 'P05', gate: 'System configuration and sequence engine gate', dep: 'P04 schema migration' },
  activity: { phase: 'P05', gate: 'Immutable audit log gate', dep: 'P04 schema migration' },
  master: { phase: 'P06', gate: 'Master data parity gate', dep: 'P05 auth controls' },
  commercial: { phase: 'P09', gate: 'Commercial sales and contract gate', dep: 'P06 master data' },
  sales: { phase: 'P09', gate: 'Sales order and DP lifecycle gate', dep: 'P06 master data' },
  bussdev: { phase: 'P07', gate: 'Lead qualification and guestbook gate', dep: 'P06 master data' },
  crm: { phase: 'P07', gate: 'CRM pipeline and deal stages gate', dep: 'P06 master data' },
  procurement: { phase: 'P10', gate: 'Procurement and four-way match gate', dep: 'P06 master data' },
  scm: { phase: 'P10', gate: 'SCM MRP and shortage gate', dep: 'P06 master data' },
  purchase: { phase: 'P10', gate: 'Purchase order lifecycle gate', dep: 'P06 master data' },
  warehouse: { phase: 'P11', gate: 'Warehouse balance and stock movement gate', dep: 'P10 procurement' },
  inventory: { phase: 'P11', gate: 'Inventory valuation and opname gate', dep: 'P10 procurement' },
  production: { phase: 'P12', gate: 'Production planning and dispatch gate', dep: 'P11 warehouse stock' },
  qc: { phase: 'P14', gate: 'QC sampling and quarantine release gate', dep: 'P13 production execution' },
  rnd: { phase: 'P08', gate: 'Sample and formulation lifecycle gate', dep: 'P06 master data' },
  finance: { phase: 'P15', gate: 'Double-entry accounting and closing gate', dep: 'P09 sales, P10 procurement' },
  hr: { phase: 'P16', gate: 'Employee and KPI calculation gate', dep: 'P05 auth controls' },
  communication: { phase: 'P17', gate: 'Notes and mention integration gate', dep: 'P05 auth controls' },
  legal: { phase: 'P08', gate: 'Regulatory BPOM/HKI compliance gate', dep: 'P08 formulation' },
  marketing: { phase: 'P07', gate: 'Omnichannel CRM and ads telemetry gate', dep: 'P06 master data' },
  creative: { phase: 'P08', gate: 'Creative design versioning gate', dep: 'P08 sample request' },
  website: { phase: 'P17', gate: 'Public web and conversion tracker gate', dep: 'P07 lead capture' },
  reports: { phase: 'P18', gate: 'Executive reporting and analytics gate', dep: 'P15 finance closing' },
  dashboards: { phase: 'P18', gate: 'Operational dashboards reconciliation gate', dep: 'P15 finance closing' },
  checklists: { phase: 'P14', gate: 'Quality checklist audit gate', dep: 'P13 production' },
  audit: { phase: 'P05', gate: 'Security and system audit log gate', dep: 'P04 schema migration' },
  files: { phase: 'P17', gate: 'Secure file upload and storage gate', dep: 'P05 auth controls' },
  kpi: { phase: 'P16', gate: 'KPI metric definition and scoring gate', dep: 'P16 hr' },
};

function resolvePhaseForOperation(tag, method, path) {
  const normTag = (tag || '').toLowerCase();
  const normPath = (path || '').toLowerCase();

  if (normPath.includes('/kpi') || normTag === 'kpi') {
    return { phase: 'P16', gate: 'KPI metric and score evaluation gate', dep: 'P16 hr' };
  }
  if (normPath.includes('/checklist') || normTag === 'checklists') {
    return { phase: 'P14', gate: 'Quality checklist audit gate', dep: 'P13 production' };
  }
  if (normPath.includes('/rnd') || normPath.includes('/sample') || normPath.includes('/formula')) {
    return { phase: 'P08', gate: 'Sample and formulation lifecycle gate', dep: 'P06 master data' };
  }
  if (normPath.includes('/production/schedule') || normPath.includes('/schedule-mixing') || normPath.includes('/schedule-filling') || normPath.includes('/schedule-packaging')) {
    return { phase: 'P12', gate: 'Production schedule and planning gate', dep: 'P11 warehouse stock' };
  }
  if (normPath.includes('/production') && (normPath.includes('/step') || normPath.includes('/mixing') || normPath.includes('/filling') || normPath.includes('/packaging') || normPath.includes('/batch'))) {
    return { phase: 'P13', gate: 'Production floor execution gate', dep: 'P12 production schedule' };
  }
  if (normPath.includes('/delivery-out') || normPath.includes('/shipment')) {
    return { phase: 'P09', gate: 'Fulfillment and delivery order gate', dep: 'P09 sales order' };
  }
  if (normPath.includes('/backup') || normPath.includes('/restore')) {
    return { phase: 'P21', gate: 'Cutover disaster recovery gate', dep: 'P20 deployment' };
  }
  if (normPath.includes('/communication') || normPath.includes('/template')) {
    return { phase: 'P17', gate: 'Platform communication and template gate', dep: 'P05 auth' };
  }

  return DOMAIN_PHASE[normTag] || DOMAIN_PHASE.general || { phase: 'P06', gate: 'Domain parity gate', dep: 'Core architecture' };
}

function resolvePhaseForScreen(screenId, moduleName, route) {
  const normModule = (moduleName || '').toLowerCase();
  const normRoute = (route || '').toLowerCase();

  if (normRoute.includes('/kpi') || normModule === 'kpi') {
    return { phase: 'P16', gate: 'KPI scoring and dashboard screen gate', dep: 'P16 hr' };
  }
  if (normRoute.includes('/checklist') || normModule === 'checklists') {
    return { phase: 'P14', gate: 'Quality checklist UI audit gate', dep: 'P13 production' };
  }
  if (normRoute.includes('/rnd') || normRoute.includes('/sample') || normRoute.includes('/formula')) {
    return { phase: 'P08', gate: 'Sample and formulation UI gate', dep: 'P06 master data' };
  }
  if (normRoute.includes('/production/schedule') || normRoute.includes('/schedule')) {
    return { phase: 'P12', gate: 'Production planning screen gate', dep: 'P11 warehouse stock' };
  }
  if (normRoute.includes('/production') && (normRoute.includes('/mixing') || normRoute.includes('/filling') || normRoute.includes('/packaging') || normRoute.includes('/batch') || normRoute.includes('/execution'))) {
    return { phase: 'P13', gate: 'Production floor execution UI gate', dep: 'P12 production schedule' };
  }
  if (normRoute.includes('/delivery-out') || normRoute.includes('/shipment')) {
    return { phase: 'P09', gate: 'Delivery and fulfillment UI gate', dep: 'P09 sales order' };
  }
  if (normRoute.includes('/backup') || normRoute.includes('/restore')) {
    return { phase: 'P21', gate: 'System backup and restore gate', dep: 'P20 deployment' };
  }
  if (normRoute.includes('/communication') || normRoute.includes('/template')) {
    return { phase: 'P17', gate: 'Communication and templates UI gate', dep: 'P05 auth' };
  }

  return DOMAIN_PHASE[normModule] || { phase: 'P06', gate: 'Module UI parity gate', dep: 'API readiness' };
}

const RUNTIME_DEPENDENCIES_ALLOWLIST = {
  backend: new Set([
    '@nestjs/platform-socket.io',
    '@prisma/adapter-libsql',
    '@types/jsdom',
    'jsdom',
    'prisma',
    'ssh2',
    'swagger-ui-express',
    'zod',
  ]),
  frontend: new Set([
    '@tailwindcss/typography',
    'jose',
    'react-dom',
    'shadcn',
    'tw-animate-css',
  ]),
};

// Load explicit 194-model catalog from disk
let IMPLEMENTATION_MODELS_CATALOG = {};
const catalogPath = path.join(__dirname, 'generated_models_catalog.json');
if (fs.existsSync(catalogPath)) {
  IMPLEMENTATION_MODELS_CATALOG = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

module.exports = {
  LIFECYCLE_ENUM,
  VALID_PHASES,
  TYPED_MAPPINGS,
  COMPATIBILITY_ADAPTERS,
  DOMAIN_TEAMS,
  DOMAIN_PHASE,
  resolvePhaseForOperation,
  resolvePhaseForScreen,
  RUNTIME_DEPENDENCIES_ALLOWLIST,
  IMPLEMENTATION_MODELS_CATALOG,
};
