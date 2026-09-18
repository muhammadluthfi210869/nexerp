/**
 * NEX ERP -- Phase P03 Machine-Readable Test Result Parser
 *
 * Capture truthful summaries from raw Jest, Vitest, and ESLint stdout BEFORE
 * the runner truncates them for evidence. Every parser returns the same
 * canonical shape:
 *   { exit_code, suites_passed, suites_total, passed, failed, skipped,
 *     warnings, errors, source: 'stdout' | 'fallback' }
 *
 * Source markers:
 *   - 'stdout': derived from the actual run output (preferred).
 *   - 'fallback': nothing parseable was emitted; counts default to 0 and a
 *                 structured `error` field is set so the runner fails closed.
 *
 * Counts that fall back to 0 are NOT silently ignored: callers must compare
 * them against the expected denominator and fail when the runner would
 * otherwise record zero-tests-passed.
 */

const stripAnsi = (s) => String(s || '').replace(/\[[0-9;]*m/g, '');

/**
 * Parse Jest summary lines: `Test Suites: ... passed, ... total`
 * and `Tests: ... passed, ... total` / `Tests: ... skipped, ... passed, ... total`.
 */
function parseBackendTestResult(stdout, exitCode) {
  const text = stripAnsi(stdout);
  const suiteMatch = text.match(/Test Suites:.*?(?:(\d+)\s+failed,\s*)?(\d+)\s+passed,\s*(\d+)\s+total/i);
  const testMatch = text.match(/Tests:\s*(?:(\d+)\s+failed,\s*)?(?:(\d+)\s+skipped,\s*)?(?:(\d+)\s+passed,\s*|\s*)(\d+)\s+total/i);

  const suitesFailed = suiteMatch ? parseInt(suiteMatch[1] || '0', 10) : 0;
  const suitesPassed = suiteMatch ? parseInt(suiteMatch[2], 10) : 0;
  const suitesTotal = suiteMatch ? parseInt(suiteMatch[3], 10) : 0;

  // Jest ordering varies:
  //   "Tests: 1 failed, 4 skipped, 255 passed, 260 total"
  //   "Tests:       X skipped, Y passed, Z total"
  let testsFailed = 0;
  let testsSkipped = 0;
  let testsPassed = 0;
  let testsTotal = 0;
  if (testMatch) {
    testsFailed = parseInt(testMatch[1] || '0', 10);
    testsSkipped = parseInt(testMatch[2] || '0', 10);
    testsPassed = parseInt(testMatch[3] || '0', 10);
    testsTotal = parseInt(testMatch[4] || '0', 10);
  }

  const summaryPass = text.match(/Snapshots:\s+(\d+)\s+passed/i);
  return {
    exit_code: exitCode,
    suites_passed: suitesPassed,
    suites_total: suitesTotal,
    suites_failed: suitesFailed,
    passed: testsPassed,
    failed: testsFailed,
    skipped: testsSkipped,
    total: testsTotal,
    snapshots_passed: summaryPass ? parseInt(summaryPass[1], 10) : null,
    source: suiteMatch ? 'stdout' : 'fallback',
    error: suiteMatch ? null : 'Jest summary line not found in raw output'
  };
}

/**
 * Parse Vitest summary `Test Files N passed (M)` and `Tests N passed (M)`.
 */
function parseFrontendTestResult(stdout, exitCode) {
  const text = stripAnsi(stdout);
  const fileMatch = text.match(/Test Files\s+(\d+)\s+passed(?:[^\d]+(\d+)\s+skipped)?[^\d]*\((\d+)\)/i);
  const testMatch = text.match(/Tests\s+(\d+)\s+passed(?:[^\d]+(\d+)\s+skipped)?[^\d]*\((\d+)\)/i);

  const filesPassed = fileMatch ? parseInt(fileMatch[1], 10) : 0;
  const filesSkipped = fileMatch ? parseInt(fileMatch[2] || '0', 10) : 0;
  const filesTotal = fileMatch ? parseInt(fileMatch[3], 10) : 0;

  const testsPassed = testMatch ? parseInt(testMatch[1], 10) : 0;
  const testsSkipped = testMatch ? parseInt(testMatch[2] || '0', 10) : 0;
  const testsTotal = testMatch ? parseInt(testMatch[3], 10) : 0;

  return {
    exit_code: exitCode,
    suites_passed: filesPassed,
    suites_total: filesTotal,
    files_skipped: filesSkipped,
    passed: testsPassed,
    skipped: testsSkipped,
    total: testsTotal,
    source: (fileMatch || testMatch) ? 'stdout' : 'fallback',
    error: (fileMatch || testMatch) ? null : 'Vitest summary line not found in raw output'
  };
}

/**
 * Parse ESLint "N problems (E errors, W warnings)".
 *
 * @param {string} stdout
 * @param {number} exitCode
 * @returns {object}
 */
function parseEslintResult(stdout, exitCode) {
  const text = stripAnsi(stdout);
  const match = text.match(/(\d+)\s+problems?\s*\((\d+)\s+errors?,\s*(\d+)\s+warnings?\)/i);

  // Some ESLint versions emit "0 problems" with no parens; capture that case.
  if (match) {
    return {
      exit_code: exitCode,
      problems: parseInt(match[1], 10),
      errors: parseInt(match[2], 10),
      warnings: parseInt(match[3], 10),
      source: 'stdout'
    };
  }

  const fallback = text.match(/(\d+)\s+problems?/);
  if (fallback) {
    return {
      exit_code: exitCode,
      problems: parseInt(fallback[1], 10),
      errors: exitCode !== 0 ? 1 : 0,
      warnings: 0,
      source: 'stdout_partial'
    };
  }

  return {
    exit_code: exitCode,
    problems: 0,
    errors: 0,
    warnings: 0,
    source: 'fallback',
    error: 'ESLint summary line not found in raw output'
  };
}

module.exports = {
  parseBackendTestResult,
  parseFrontendTestResult,
  parseEslintResult
};
