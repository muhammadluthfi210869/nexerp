#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const CONTRACT_PATH = path.join(__dirname, 'p05_acceptance_contract.json');
const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

// Extract the exact porcelain parsing logic as implemented in certify_p05_phase.js
function normalize(v) { return String(v || '').replace(/\\/g, '/'); }

function parsePorcelainLine(line) {
  if (!line || line.length < 4) return null;
  const status = line.slice(0, 2);
  let file = line.slice(3);
  if (file.includes(' -> ')) {
    file = file.split(' -> ').pop();
  }
  file = normalize(file.replace(/^"|"$/g, ''));
  return { status, file };
}

function filterDirtyOutsideAllowlist(rawPorcelainOutput, allowlist) {
  const allow = new Set(allowlist.map(normalize));
  // Strips trailing newlines only (matches git() fix in certify_p05_phase.js)
  const cleaned = String(rawPorcelainOutput || '').replace(/[\r\n]+$/, '');
  return cleaned
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parsePorcelainLine)
    .filter(x => x && x.file && !allow.has(x.file));
}

let passed = 0;
let failed = 0;

function test(desc, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${desc}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${desc} -> ${err.message}`);
  }
}

console.log('--- Porcelain Parser Regression Tests ---');

// 1. ' M path' (worktree modified, unstaged - leading space)
test("' M path' preserves leading space in status and does not truncate path", () => {
  const line = ' M docs/legacy-erp/verification/evidence/P05_PHASE_CERTIFICATION_RESULT.json';
  const parsed = parsePorcelainLine(line);
  assert.strictEqual(parsed.status, ' M');
  assert.strictEqual(parsed.file, 'docs/legacy-erp/verification/evidence/P05_PHASE_CERTIFICATION_RESULT.json');
});

// 2. 'M  path' (index modified, staged - trailing space in status)
test("'M  path' parses correctly with staged status", () => {
  const line = 'M  backend/src/platform/auth/session.service.ts';
  const parsed = parsePorcelainLine(line);
  assert.strictEqual(parsed.status, 'M ');
  assert.strictEqual(parsed.file, 'backend/src/platform/auth/session.service.ts');
});

// 3. '?? path' (untracked file)
test("'?? path' parses untracked status without altering path", () => {
  const line = '?? docs/legacy-erp/verification/_p05_test_results.json';
  const parsed = parsePorcelainLine(line);
  assert.strictEqual(parsed.status, '??');
  assert.strictEqual(parsed.file, 'docs/legacy-erp/verification/_p05_test_results.json');
});

// 4. Quoted path (quotes removed without dropping leading char)
test('Quoted path unwraps quotes correctly', () => {
  const line = ' M "docs/legacy-erp/verification/evidence/P05_CONTROL_MATRIX.json"';
  const parsed = parsePorcelainLine(line);
  assert.strictEqual(parsed.status, ' M');
  assert.strictEqual(parsed.file, 'docs/legacy-erp/verification/evidence/P05_CONTROL_MATRIX.json');

  const lineWithSpace = '?? "some folder/test file.txt"';
  const parsedSpace = parsePorcelainLine(lineWithSpace);
  assert.strictEqual(parsedSpace.status, '??');
  assert.strictEqual(parsedSpace.file, 'some folder/test file.txt');
});

// 5. First status line with leading space (regression against .trim() bug)
test('First status line with leading space is not trimmed', () => {
  const rawOutput = ' M docs/legacy-erp/verification/evidence/P05_PHASE_CERTIFICATION_RESULT.json\n';
  const dirty = filterDirtyOutsideAllowlist(rawOutput, contract.generated_output_allowlist);
  assert.strictEqual(dirty.length, 0, 'Should not consider allowlisted path dirty even if on first line with leading space');
});

// 6. Multiple status lines
test('Multiple status lines preserve distinct statuses and paths', () => {
  const rawOutput = [
    ' M docs/legacy-erp/verification/evidence/P05_PHASE_CERTIFICATION_RESULT.json',
    'M  docs/legacy-erp/verification/evidence/P05_MODULE_OWNERSHIP.json',
    '?? docs/legacy-erp/verification/evidence/P05_DEPENDENCY_GRAPH.json',
    ' M backend/src/unexpected_change.ts'
  ].join('\n') + '\n';

  const dirty = filterDirtyOutsideAllowlist(rawOutput, contract.generated_output_allowlist);
  assert.strictEqual(dirty.length, 1);
  assert.strictEqual(dirty[0].file, 'backend/src/unexpected_change.ts');
  assert.strictEqual(dirty[0].status, ' M');
});

// 7. Allowlisted generated evidence is accepted
test('All allowlisted generated evidence items are excluded from dirty list', () => {
  const rawOutput = contract.generated_output_allowlist.map(f => ` M ${f}`).join('\n');
  const dirty = filterDirtyOutsideAllowlist(rawOutput, contract.generated_output_allowlist);
  assert.strictEqual(dirty.length, 0, 'Allowlisted files must never be reported dirty');
});

// 8. Non-allowlisted dirty file is caught
test('Non-allowlisted dirty file is correctly caught', () => {
  const rawOutput = ' M backend/src/main.ts\n';
  const dirty = filterDirtyOutsideAllowlist(rawOutput, contract.generated_output_allowlist);
  assert.strictEqual(dirty.length, 1);
  assert.strictEqual(dirty[0].file, 'backend/src/main.ts');
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
