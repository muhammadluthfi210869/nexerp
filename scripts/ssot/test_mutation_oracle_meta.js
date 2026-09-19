'use strict';

/**
 * NEX ERP - Phase P05 Mutation Oracle Meta-Tests
 *
 * Verifies that expectProductionRejection:
 *   1. PASSES when observed gate_id and observed reason_code match expected exactly.
 *   2. FAILS when gate returns/throws wrong reason_code.
 *   3. FAILS when gate returns/throws wrong gate_id.
 *   4. FAILS on generic exception (e.g. TypeError or generic Error).
 *   5. FAILS when production gate or control passes unexpectedly (no rejection).
 *   6. FAILS on setup error.
 */

const assert = require('assert');
const { expectProductionRejection } = require('./test_p05_platform_negative');

async function testMetaOracle() {
  console.log('--- Starting Mutation Oracle Meta-Tests ---');
  let passedCount = 0;

  // Case 1: Correct gate + correct reason -> PASS
  {
    const res = await expectProductionRejection({
      id: 'META-CORRECT-PASS',
      gateFunction: 'mockGate',
      mutatedTarget: 'mockTarget',
      gateId: 'circular_dependency_scan',
      expectedReasonCode: 'DOMAIN_CYCLE_DETECTED',
      fn: async () => ({
        id: 'circular_dependency_scan',
        status: 'FAIL',
        reason_code: 'DOMAIN_CYCLE_DETECTED',
        error: 'Cycle found'
      })
    });
    assert.strictEqual(res.status, 'PASS');
    assert.strictEqual(res.expected_gate_id, 'circular_dependency_scan');
    assert.strictEqual(res.observed_gate_id, 'circular_dependency_scan');
    assert.strictEqual(res.expected_reason_code, 'DOMAIN_CYCLE_DETECTED');
    assert.strictEqual(res.observed_reason_code, 'DOMAIN_CYCLE_DETECTED');
    passedCount++;
    console.log('Case 1: Correct gate + reason -> OK');
  }

  // Case 2: Wrong reason code -> must FAIL
  {
    let caught = null;
    try {
      await expectProductionRejection({
        id: 'META-WRONG-REASON',
        gateFunction: 'mockGate',
        mutatedTarget: 'mockTarget',
        gateId: 'circular_dependency_scan',
        expectedReasonCode: 'DOMAIN_CYCLE_DETECTED',
        fn: async () => ({
          id: 'circular_dependency_scan',
          status: 'FAIL',
          reason_code: 'WRONG_REASON_CODE',
          error: 'Wrong'
        })
      });
    } catch (e) {
      caught = e;
    }
    assert(caught !== null, 'Expected oracle to fail on wrong reason code');
    assert(caught.message.includes('wrong reason code'), `Expected error message about wrong reason code, got: ${caught.message}`);
    passedCount++;
    console.log('Case 2: Wrong reason code rejected -> OK');
  }

  // Case 3: Wrong gate ID -> must FAIL
  {
    let caught = null;
    try {
      await expectProductionRejection({
        id: 'META-WRONG-GATE',
        gateFunction: 'mockGate',
        mutatedTarget: 'mockTarget',
        gateId: 'circular_dependency_scan',
        expectedReasonCode: 'DOMAIN_CYCLE_DETECTED',
        fn: async () => ({
          id: 'module_boundary_test',
          status: 'FAIL',
          reason_code: 'DOMAIN_CYCLE_DETECTED',
          error: 'Wrong gate'
        })
      });
    } catch (e) {
      caught = e;
    }
    assert(caught !== null, 'Expected oracle to fail on wrong gate ID');
    assert(caught.message.includes('rejected by wrong gate'), `Expected error message about wrong gate, got: ${caught.message}`);
    passedCount++;
    console.log('Case 3: Wrong gate ID rejected -> OK');
  }

  // Case 4: Generic error (e.g. TypeError) -> must FAIL
  {
    let caught = null;
    try {
      await expectProductionRejection({
        id: 'META-GENERIC-ERROR',
        gateFunction: 'mockGate',
        mutatedTarget: 'mockTarget',
        gateId: 'auth_session_mfa',
        expectedReasonCode: 'SESSION_REVOKED',
        fn: async () => {
          throw new TypeError('Cannot read property of undefined');
        }
      });
    } catch (e) {
      caught = e;
    }
    assert(caught !== null, 'Expected oracle to fail on generic TypeError');
    assert(caught.message.includes('generic exception'), `Expected error message about generic exception, got: ${caught.message}`);
    passedCount++;
    console.log('Case 4: Generic exception rejected -> OK');
  }

  // Case 5: No rejection (gate returns PASS) -> must FAIL
  {
    let caught = null;
    try {
      await expectProductionRejection({
        id: 'META-NO-REJECTION',
        gateFunction: 'mockGate',
        mutatedTarget: 'mockTarget',
        gateId: 'coupling_complexity_scan',
        expectedReasonCode: 'CHANGED_COMPLEXITY_OVER_THRESHOLD',
        fn: async () => ({
          id: 'coupling_complexity_scan',
          status: 'PASS',
          reason_code: 'PASS'
        })
      });
    } catch (e) {
      caught = e;
    }
    assert(caught !== null, 'Expected oracle to fail when control passes unexpectedly');
    assert(caught.message.includes('passed unexpectedly'), `Expected error message about passing unexpectedly, got: ${caught.message}`);
    passedCount++;
    console.log('Case 5: Unexpected PASS rejected -> OK');
  }

  // Case 6: Setup error (missing result / null) -> must FAIL
  {
    let caught = null;
    try {
      await expectProductionRejection({
        id: 'META-SETUP-ERROR',
        gateFunction: 'mockGate',
        mutatedTarget: 'mockTarget',
        gateId: 'maker_checker',
        expectedReasonCode: 'SELF_APPROVAL_FORBIDDEN',
        fn: async () => null
      });
    } catch (e) {
      caught = e;
    }
    assert(caught !== null, 'Expected oracle to fail on null result');
    passedCount++;
    console.log('Case 6: Setup/null result rejected -> OK');
  }

  console.log(`--- All ${passedCount}/6 Mutation Oracle Meta-Tests PASSED ---`);
}

testMetaOracle().catch(err => {
  console.error('Meta-oracle test failed:', err);
  process.exit(1);
});
