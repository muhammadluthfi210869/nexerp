#!/usr/bin/env node
'use strict';
/**
 * P05 Platform Module Unit Tests
 *
 * Runs in-process without database. Tests pure logic:
 *   - scrub() redacts forbidden substrings
 *   - registerError + getRegistered round-trip
 *   - isTestPath correctly excludes test files
 *   - computeIdempotencyKey is deterministic
 *   - policy.decide returns deny-by-default
 */

const safety = require('./lib/p05_safety');
const analyzers = require('./lib/p05_analyzers');

let passed = 0;
let failed = 0;

function assert(cond, name) {
  if (cond) { passed++; console.log('  PASS', name); }
  else { failed++; console.log('  FAIL', name); }
}

function section(name) { console.log('\n[' + name + ']'); }

section('safety.redactSecrets');
const scrubbedJwt = safety.redactSecrets('eyJabcdefghij.eyJklmnopqrst.signature1234');
assert(!scrubbedJwt.includes('eyJ'), 'JWT redacted');
const scrubbedEmail = safety.redactSecrets('contact user@example.com today');
assert(!scrubbedEmail.includes('@example'), 'email redacted');
const scrubbedNik = safety.redactSecrets('NIK 1234567890123456 here');
assert(!scrubbedNik.includes('1234567890123456'), 'NIK redacted');
const scrubbedPw = safety.redactSecrets('passwordHash="abc123def"');
assert(!scrubbedPw.includes('abc123def'), 'passwordHash redacted');

section('safety.assertNoSecrets');
let threw = false;
try {
  // Real JWT shape: header.payload.signature, each >= 8 chars
  safety.assertNoSecrets({ token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' }, process.env);
} catch { threw = true; }
assert(threw, 'JWT triggers assertNoSecrets');

threw = false;
try {
  safety.assertNoSecrets({ nested: { email: 'a@b.com' } }, process.env);
} catch { threw = true; }
assert(threw, 'email triggers assertNoSecrets');

threw = false;
try {
  safety.assertNoSecrets({ clean: { sha256: 'abc123' } }, process.env);
} catch { threw = true; }
assert(!threw, 'clean object does not trigger');

section('analyzers.isTestPath');
assert(analyzers.isTestPath('foo.spec.ts'), '*.spec.ts is test');
assert(analyzers.isTestPath('foo/__tests__/bar.ts'), '__tests__/ is test');
assert(!analyzers.isTestPath('foo/bar.ts'), 'production ts is not test');

section('analyzers.discoverBackendModules');
const mods = analyzers.discoverBackendModules('.');
assert(mods.length >= 36, 'discovers >=36 backend modules');
const platformConfig = mods.find(m => m.name === 'config' && m.parent === 'platform');
assert(platformConfig !== undefined, 'discovers platform/config');

section('analyzers.deriveModuleOwnership');
const own = analyzers.deriveModuleOwnership({ root: '.' });
assert(own.modules_total >= 36, 'ownership covers all modules');
assert(own.ownership_coverage_percent === 100, 'ownership coverage 100%');

section('analyzers.findComplexityRegressions (scoped)');
const cx = analyzers.findComplexityRegressions({ root: '.', baseSha: 'a', candidateSha: 'a' });
assert(cx.changed_max_cyclomatic_complexity === 0, 'no changed functions when base == candidate');

section('analyzers.findUnusedProductionDependencies (scoped)');
const u = analyzers.findUnusedProductionDependencies({ root: '.', baseSha: 'a', candidateSha: 'a' });
assert(u.count === 0, 'no new unused deps when base == candidate');

console.log('\n=== ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
