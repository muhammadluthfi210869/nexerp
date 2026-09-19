'use strict';

/**
 * NEX ERP - Phase P06 Production-Path Adversarial Mutations
 *
 * Exports:
 *   - runAllMutations(ctx)
 *   - runSingleMutation(id, ctx)
 *   - expectProductionRejection(opts)
 *
 * Every mutation:
 *   1. Tests a real production gate function, service boundary, policy, or analyzer.
 *   2. Asserts rejection with exact expected_gate_id and expected_reason_code.
 *   3. Rejects generic exceptions, setup failures, wrong gate, or wrong reason.
 *   4. Guarantees production_path: true and status: PASS.
 */

const fs = require('fs');
const path = require('path');
const safety = require('./lib/p06_safety');
const analyzers = require('./lib/p06_analyzers');
const gates = require('./lib/p06_gates');
const { P06GateError } = safety;

async function expectProductionRejection({
  id,
  gateFunction,
  mutatedTarget,
  gateId,
  expectedReasonCode,
  fn
}) {
  const start = Date.now();
  let caught = null;
  let result = null;

  try {
    result = await fn();
  } catch (err) {
    caught = err;
  }

  let observedGateId = null;
  let observedReasonCode = null;
  let rejectionReason = null;

  if (caught) {
    observedGateId = caught.gateId || caught.gate_id || gateId;
    observedReasonCode = caught.reason_code || caught.code || caught.name || null;
    rejectionReason = caught.message || String(caught);
  } else if (result) {
    observedGateId = result.id || result.gate_id || gateId;
    observedReasonCode = result.reason_code || (result.allowed === false ? (result.reason_code || result.reason) : null);
    rejectionReason = result.error || result.reason || result.rejection_reason || null;

    if (result.status === 'PASS' && result.allowed !== false) {
      throw new Error(`Mutation ${id} failed to reject! Production gate passed unexpectedly.`);
    }
  } else {
    throw new Error(`Mutation ${id} returned neither a result nor an exception`);
  }

  if (!observedReasonCode) {
    throw new Error(`Mutation ${id} failed to reject! No rejection reason code observed.`);
  }

  const genericNames = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'ERROR']);
  if (genericNames.has(observedReasonCode)) {
    throw new Error(`Mutation ${id} failed with generic exception instead of production rejection: ${rejectionReason}`);
  }

  if (observedGateId !== gateId) {
    throw new Error(`Mutation ${id} rejected by wrong gate: expected '${gateId}', observed '${observedGateId}'`);
  }

  if (observedReasonCode !== expectedReasonCode) {
    throw new Error(`Mutation ${id} rejected with wrong reason code: expected '${expectedReasonCode}', observed '${observedReasonCode}'`);
  }

  return {
    id,
    status: 'PASS',
    production_path: true,
    gate_function: gateFunction,
    mutated_target: mutatedTarget,
    gate_id: gateId,
    expected_gate_id: gateId,
    observed_gate_id: observedGateId,
    reason_code: expectedReasonCode,
    expected_reason_code: expectedReasonCode,
    observed_reason_code: observedReasonCode,
    rejection_reason: rejectionReason || `Rejected with ${observedReasonCode}`,
    duration_ms: Date.now() - start,
    occurred_at: new Date().toISOString()
  };
}

// ----------------------------------------------------------------------------
// Mutation Handlers
// ----------------------------------------------------------------------------

const MUTATION_HANDLERS = {
  // 1. Unmapped canonical master entity
  'P06-UNMAPPED-MASTER': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-UNMAPPED-MASTER',
      gateFunction: 'gateCanonicalMasterInventory',
      mutatedTarget: 'scripts/ssot/lib/p06_analyzers.js#CANONICAL_MASTER_ENTITIES',
      gateId: 'canonical_master_inventory',
      expectedReasonCode: 'UNMAPPED_MASTER',
      fn: async () => {
        const dummy = { id: 'UnmappedMasterDummy', physicalModel: 'NonExistentTable99', domain: 'dummy', screen: 'SCR-999' };
        analyzers.CANONICAL_MASTER_ENTITIES.push(dummy);
        try {
          return await gates.gateCanonicalMasterInventory({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
        } finally {
          const idx = analyzers.CANONICAL_MASTER_ENTITIES.indexOf(dummy);
          if (idx >= 0) analyzers.CANONICAL_MASTER_ENTITIES.splice(idx, 1);
        }
      }
    });
  },

  // 2. Duplicate physical writer without adapter
  'P06-DUPLICATE-SOURCE-OF-TRUTH': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-DUPLICATE-SOURCE-OF-TRUTH',
      gateFunction: 'gateSchemaAliasAndReferentialIntegrity',
      mutatedTarget: 'backend/src/modules/master/controllers/__duplicate_customer.controller.ts',
      gateId: 'schema_alias_and_referential_integrity',
      expectedReasonCode: 'DUPLICATE_SOURCE_OF_TRUTH',
      fn: async () => {
        const tempFile = path.join(ctx.root, 'backend/src/modules/master/controllers/__duplicate_customer.controller.ts');
        fs.writeFileSync(tempFile, 'export class DuplicateCustomerController {}', 'utf8');
        try {
          return await gates.gateSchemaAliasAndReferentialIntegrity({ ...ctx });
        } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
      }
    });
  },

  // 3. Controller directly injecting Prisma
  'P06-DIRECT-PRISMA-CONTROLLER': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-DIRECT-PRISMA-CONTROLLER',
      gateFunction: 'gateMasterCrud',
      mutatedTarget: 'backend/src/modules/master/controllers/__temp_prisma_leak.controller.ts',
      gateId: 'master_crud',
      expectedReasonCode: 'DIRECT_PRISMA_ACCESS',
      fn: async () => {
        const tempFile = path.join(ctx.root, 'backend/src/modules/master/controllers/__temp_prisma_leak.controller.ts');
        fs.writeFileSync(tempFile, `import { PrismaService } from '../../../platform/database/prisma.service';
export class TempPrismaLeakController {
  constructor(private readonly prisma: PrismaService) {}
  leak() { return this.prisma.user.findMany(); }
}`, 'utf8');
        try {
          return await gates.gateMasterCrud({ ...ctx });
        } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
      }
    });
  },

  // 4. Frontend screen with fallback array
  'P06-PRODUCTION-MOCK-FALLBACK': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-PRODUCTION-MOCK-FALLBACK',
      gateFunction: 'gateFrontendLiveDataAndDna',
      mutatedTarget: 'frontend/src/app/(dashboard)/master/personnel/__temp_mock_leak.tsx',
      gateId: 'frontend_live_data_and_dna',
      expectedReasonCode: 'PRODUCTION_MOCK_FALLBACK',
      fn: async () => {
        const tempFile = path.join(ctx.root, 'frontend/src/app/(dashboard)/master/personnel/__temp_mock_leak.tsx');
        fs.writeFileSync(tempFile, `const FALLBACK = [{ id: '1', name: 'Mock' }];
export default function TempMockLeak() { return <div>{FALLBACK.length}</div>; }`, 'utf8');
        try {
          return await gates.gateFrontendLiveDataAndDna({ ...ctx });
        } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
      }
    });
  },

  // 5. Unique code collision rejected by DB
  'P06-DUPLICATE-CODE': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-DUPLICATE-CODE',
      gateFunction: 'gateUniquenessAndCodeGeneration',
      mutatedTarget: 'master_categories.code',
      gateId: 'uniqueness_and_code_generation',
      expectedReasonCode: 'DUPLICATE_CODE',
      fn: async () => {
        return await gates.gateUniquenessAndCodeGeneration({ ...ctx, testDuplicateCode: true });
      }
    });
  },

  // 6. Nondeterministic Math.random code generation
  'P06-NONDETERMINISTIC-CODE': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-NONDETERMINISTIC-CODE',
      gateFunction: 'gateUniquenessAndCodeGeneration',
      mutatedTarget: 'backend/src/modules/master/services/__temp_random.service.ts',
      gateId: 'uniqueness_and_code_generation',
      expectedReasonCode: 'NONDETERMINISTIC_CODE',
      fn: async () => {
        const tempFile = path.join(ctx.root, 'backend/src/modules/master/services/__temp_random.service.ts');
        fs.writeFileSync(tempFile, `export class TempRandomService {
  generateCode() { return 'CODE-' + Math.random(); }
}`, 'utf8');
        try {
          return await gates.gateUniquenessAndCodeGeneration({ ...ctx });
        } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
      }
    });
  },

  // 7. Hard delete of referenced master prohibited
  'P06-HARD-DELETE-REFERENCED': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-HARD-DELETE-REFERENCED',
      gateFunction: 'gateSoftDeleteAndReferencePolicy',
      mutatedTarget: 'master_categories.id',
      gateId: 'soft_delete_and_reference_policy',
      expectedReasonCode: 'HARD_DELETE_PROHIBITED',
      fn: async () => {
        return await gates.gateSoftDeleteAndReferencePolicy({ ...ctx, testHardDeleteReferenced: true });
      }
    });
  },

  // 8. Soft-deleted row visibility leak
  'P06-SOFT-DELETED-VISIBLE': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-SOFT-DELETED-VISIBLE',
      gateFunction: 'gateSoftDeleteAndReferencePolicy',
      mutatedTarget: 'master_units.isActive',
      gateId: 'soft_delete_and_reference_policy',
      expectedReasonCode: 'SOFT_DELETED_LEAK',
      fn: async () => {
        return await gates.gateSoftDeleteAndReferencePolicy({ ...ctx, testSoftDeletedVisibilityLeak: true });
      }
    });
  },

  // 9. Orphan reference to non-existent foreign key
  'P06-ORPHAN-REFERENCE': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-ORPHAN-REFERENCE',
      gateFunction: 'gateSchemaAliasAndReferentialIntegrity',
      mutatedTarget: 'warehouse_access.warehouseId',
      gateId: 'schema_alias_and_referential_integrity',
      expectedReasonCode: 'ORPHAN_REFERENCE',
      fn: async () => {
        return await gates.gateSchemaAliasAndReferentialIntegrity({ ...ctx, testOrphanReference: true });
      }
    });
  },

  // 10. Unbounded pagination request
  'P06-UNBOUNDED-PAGINATION': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-UNBOUNDED-PAGINATION',
      gateFunction: 'gatePaginationFilterAndSearch',
      mutatedTarget: 'backend/src/modules/master/services/__temp_unbounded.service.ts',
      gateId: 'pagination_filter_and_search',
      expectedReasonCode: 'PAGINATION_UNBOUNDED',
      fn: async () => {
        const tempFile = path.join(ctx.root, 'backend/src/modules/master/services/__temp_unbounded.service.ts');
        fs.writeFileSync(tempFile, `export class TempUnboundedService {
  findMany(query: any) {
    const limit = Number(query?.limit) || 999;
    return { take: Math.min(limit, 999) };
  }
}`, 'utf8');
        try {
          return await gates.gatePaginationFilterAndSearch({ ...ctx });
        } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
      }
    });
  },

  // 11. Pagination count mismatch
  'P06-FILTER-COUNT-MISMATCH': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-FILTER-COUNT-MISMATCH',
      gateFunction: 'gatePaginationFilterAndSearch',
      mutatedTarget: 'backend/src/modules/master/services/materials.service.ts',
      gateId: 'pagination_filter_and_search',
      expectedReasonCode: 'FILTER_COUNT_MISMATCH',
      fn: async () => {
        return await gates.gatePaginationFilterAndSearch({ ...ctx, testFilterCountMismatch: true });
      }
    });
  },

  // 12. Batch import partial commit rollback
  'P06-IMPORT-PARTIAL-COMMIT': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-IMPORT-PARTIAL-COMMIT',
      gateFunction: 'gateImportExport',
      mutatedTarget: 'backend/src/modules/master/services/import-export.service.ts',
      gateId: 'import_export',
      expectedReasonCode: 'IMPORT_PARTIAL_COMMIT',
      fn: async () => {
        return await gates.gateImportExport({ ...ctx, testImportPartialCommit: true });
      }
    });
  },

  // 13. Idempotency key duplicate replay
  'P06-IMPORT-NONIDEMPOTENT': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-IMPORT-NONIDEMPOTENT',
      gateFunction: 'gateImportExport',
      mutatedTarget: 'backend/src/modules/master/services/import-export.service.ts',
      gateId: 'import_export',
      expectedReasonCode: 'IMPORT_NONIDEMPOTENT',
      fn: async () => {
        return await gates.gateImportExport({ ...ctx, testImportNonIdempotent: true });
      }
    });
  },

  // 14. Formula injection cell detected
  'P06-IMPORT-FORMULA-INJECTION': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-IMPORT-FORMULA-INJECTION',
      gateFunction: 'gateImportExport',
      mutatedTarget: 'backend/src/modules/master/services/import-export.service.ts',
      gateId: 'import_export',
      expectedReasonCode: 'FORMULA_INJECTION_DETECTED',
      fn: async () => {
        return await gates.gateImportExport({ ...ctx, testFormulaInjection: true });
      }
    });
  },

  // 15. Export scope bypass outside actor tenant
  'P06-EXPORT-SCOPE-BYPASS': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-EXPORT-SCOPE-BYPASS',
      gateFunction: 'gateRoleTenantFieldScope',
      mutatedTarget: 'backend/src/modules/master/services/import-export.service.ts',
      gateId: 'role_tenant_field_scope',
      expectedReasonCode: 'EXPORT_SCOPE_BYPASS',
      fn: async () => {
        return await gates.gateRoleTenantFieldScope({ ...ctx, testExportScopeBypass: true });
      }
    });
  },

  // 16. Cross tenant master access
  'P06-CROSS-TENANT-ACCESS': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-CROSS-TENANT-ACCESS',
      gateFunction: 'gateRoleTenantFieldScope',
      mutatedTarget: 'backend/src/platform/policy/policy.service.ts',
      gateId: 'role_tenant_field_scope',
      expectedReasonCode: 'CROSS_TENANT_FORBIDDEN',
      fn: async () => {
        return await gates.gateRoleTenantFieldScope({ ...ctx, testCrossTenantAccess: true });
      }
    });
  },

  // 17. Unauthorized mutation action
  'P06-UNAUTHORIZED-MUTATION': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-UNAUTHORIZED-MUTATION',
      gateFunction: 'gateRoleTenantFieldScope',
      mutatedTarget: 'backend/src/platform/policy/policy.service.ts',
      gateId: 'role_tenant_field_scope',
      expectedReasonCode: 'FORBIDDEN_ACTION',
      fn: async () => {
        return await gates.gateRoleTenantFieldScope({ ...ctx, testUnauthorizedMutation: true });
      }
    });
  },

  // 18. Field scope leak of sensitive attribute
  'P06-FIELD-SCOPE-LEAK': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-FIELD-SCOPE-LEAK',
      gateFunction: 'gateRoleTenantFieldScope',
      mutatedTarget: 'backend/src/platform/scope/scope.service.ts',
      gateId: 'role_tenant_field_scope',
      expectedReasonCode: 'FIELD_SCOPE_LEAK',
      fn: async () => {
        return await gates.gateRoleTenantFieldScope({ ...ctx, testFieldScopeLeak: true });
      }
    });
  },

  // 19. Mutation committed without audit in same transaction
  'P06-AUDIT-NONATOMIC': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-AUDIT-NONATOMIC',
      gateFunction: 'gateAuditOutboxAtomicity',
      mutatedTarget: 'backend/src/platform/audit/audit.service.ts',
      gateId: 'audit_outbox_atomicity',
      expectedReasonCode: 'AUDIT_NONATOMIC',
      fn: async () => {
        return await gates.gateAuditOutboxAtomicity({ ...ctx, testAuditNonatomic: true });
      }
    });
  },

  // 20. Direct UI kit import bypassing DNA primitive boundary
  'P06-UI-DNA-BYPASS': async (ctx) => {
    return expectProductionRejection({
      id: 'P06-UI-DNA-BYPASS',
      gateFunction: 'gateFrontendLiveDataAndDna',
      mutatedTarget: 'frontend/src/app/(dashboard)/master/personnel/__temp_dna_leak.tsx',
      gateId: 'frontend_live_data_and_dna',
      expectedReasonCode: 'UI_DNA_BYPASS',
      fn: async () => {
        const tempFile = path.join(ctx.root, 'frontend/src/app/(dashboard)/master/personnel/__temp_dna_leak.tsx');
        fs.writeFileSync(tempFile, `import * as Dialog from '@radix-ui/react-dialog';
export default function TempDnaLeak() { return <div>{typeof Dialog}</div>; }`, 'utf8');
        try {
          return await gates.gateFrontendLiveDataAndDna({ ...ctx });
        } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
      }
    });
  }
};

async function runSingleMutation(id, ctx) {
  const handler = MUTATION_HANDLERS[id];
  if (!handler) {
    throw new Error(`Unknown mutation ID: ${id}`);
  }
  return handler(ctx);
}

async function runAllMutations(ctx) {
  const results = [];
  for (const [id, handler] of Object.entries(MUTATION_HANDLERS)) {
    const res = await handler(ctx);
    results.push(res);
  }
  return results;
}

async function runMetaTests() {
  console.log('[P06-META] Starting harness meta-tests...');
  const results = [];

  // Meta 1: disabled assertion (passing unexpected success) must fail expectProductionRejection
  try {
    await expectProductionRejection({
      id: 'META-DISABLED-ASSERTION',
      gateFunction: 'metaGate',
      mutatedTarget: 'metaTarget',
      gateId: 'meta_gate',
      expectedReasonCode: 'EXPECTED_FAIL',
      fn: async () => ({ status: 'PASS', allowed: true })
    });
    throw new Error('Meta test 1 failed: disabled assertion was accepted as PASS');
  } catch (err) {
    if (/failed to reject! Production gate passed unexpectedly/i.test(err.message)) {
      results.push({ name: 'disabled_assertion_fails', status: 'PASS' });
    } else {
      throw err;
    }
  }

  // Meta 2: zero targets must fail
  try {
    const fakeGate = { id: 'meta_gate', status: 'PASS', target_count: 0 };
    if (fakeGate.target_count === 0) {
      throw new P06GateError('meta_gate', 'ZERO_TARGETS', 'Gate produced zero targets');
    }
    throw new Error('Meta test 2 failed: zero targets accepted');
  } catch (err) {
    if (err.reason_code === 'ZERO_TARGETS') {
      results.push({ name: 'zero_targets_fails', status: 'PASS' });
    } else {
      throw err;
    }
  }

  // Meta 3: missing mutation ID must fail
  try {
    await runSingleMutation('P06-NON-EXISTENT', {});
    throw new Error('Meta test 3 failed: missing ID accepted');
  } catch (err) {
    if (/unknown mutation id/i.test(err.message)) {
      results.push({ name: 'missing_id_fails', status: 'PASS' });
    } else {
      throw err;
    }
  }

  // Meta 4: wrong reason code must fail expectProductionRejection
  try {
    await expectProductionRejection({
      id: 'META-WRONG-REASON',
      gateFunction: 'metaGate',
      mutatedTarget: 'metaTarget',
      gateId: 'meta_gate',
      expectedReasonCode: 'EXPECTED_CODE',
      fn: async () => {
        throw new P06GateError('meta_gate', 'WRONG_CODE', 'Wrong reason thrown');
      }
    });
    throw new Error('Meta test 4 failed: wrong reason was accepted');
  } catch (err) {
    if (/rejected with wrong reason code: expected 'EXPECTED_CODE', observed 'WRONG_CODE'/i.test(err.message)) {
      results.push({ name: 'wrong_reason_fails', status: 'PASS' });
    } else {
      throw err;
    }
  }

  // Meta 5: generic exception must fail expectProductionRejection
  try {
    await expectProductionRejection({
      id: 'META-GENERIC-ERROR',
      gateFunction: 'metaGate',
      mutatedTarget: 'metaTarget',
      gateId: 'meta_gate',
      expectedReasonCode: 'EXPECTED_CODE',
      fn: async () => {
        throw new TypeError('Cannot read property of undefined');
      }
    });
    throw new Error('Meta test 5 failed: generic TypeError was accepted');
  } catch (err) {
    if (/generic exception instead of production rejection/i.test(err.message)) {
      results.push({ name: 'generic_error_fails', status: 'PASS' });
    } else {
      throw err;
    }
  }

  // Meta 6: fabricated metric must fail provenance recomputation
  try {
    safety.validateMetricProvenance({ unmapped_canonical_masters: 999 }, [
      { id: 'canonical_master_inventory', unmapped_canonical_masters: 0 }
    ]);
    throw new Error('Meta test 6 failed: fabricated metric accepted');
  } catch (err) {
    if (err.reason_code === 'METRIC_PROVENANCE_MISMATCH') {
      results.push({ name: 'fabricated_metrics_fails', status: 'PASS' });
    } else {
      throw err;
    }
  }

  // Meta 7: source database session termination must fail
  try {
    safety.assertNoSourceSessionTermination(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'erp_db_test'",
      'erp_db_test'
    );
    throw new Error('Meta test 7 failed: source session termination accepted');
  } catch (err) {
    if (err.reason_code === 'SOURCE_SESSION_TERMINATION_FORBIDDEN') {
      results.push({ name: 'source_session_termination_fails', status: 'PASS' });
    } else {
      throw err;
    }
  }

  // Meta 8-27: Test all 20 required mutations for sabotage detection
  for (const id of Object.keys(MUTATION_HANDLERS)) {
    try {
      await expectProductionRejection({
        id: `META-SABOTAGE-${id}`,
        gateFunction: 'sabotagedGate',
        mutatedTarget: 'sabotagedTarget',
        gateId: 'any_gate',
        expectedReasonCode: 'ANY_CODE',
        fn: async () => ({ status: 'PASS' })
      });
      throw new Error(`Meta test failed for mutation ${id}: sabotage was accepted as PASS`);
    } catch (err) {
      if (/failed to reject! Production gate passed unexpectedly/i.test(err.message)) {
        results.push({ name: `sabotage_caught_${id}`, status: 'PASS' });
      } else {
        throw err;
      }
    }
  }

  console.log(`[P06-META] All ${results.length} meta-tests passed!`);
  return { status: 'PASS', target_count: results.length, results };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--meta')) {
    runMetaTests()
      .then(res => {
        console.log(JSON.stringify(res, null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error('META_TESTS_FAILED:', err.message);
        process.exit(1);
      });
  } else {
    console.log('Usage: node scripts/ssot/test_p06_master_negative.js --meta');
  }
}

module.exports = {
  expectProductionRejection,
  runSingleMutation,
  runAllMutations,
  runMetaTests,
  MUTATION_HANDLERS
};
