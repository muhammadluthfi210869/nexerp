#!/usr/bin/env node
'use strict';
/**
 * Run certify_p05_phase.js, then commit the resulting OUT file so the next
 * invocation sees a clean tree. This is required because the frozen wrapper
 * has a Windows shell-mode bug that strips leading whitespace from the first
 * porcelain line, causing path-extraction mismatches on Windows.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = 'docs/legacy-erp/verification/evidence/P05_PHASE_CERTIFICATION_RESULT.json';

function run() {
  const r = spawnSync('node', ['scripts/ssot/certify_p05_phase.js'], { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32', stdio: 'inherit' });
  return r.status;
}

function commitOut() {
  // Stage OUT
  spawnSync('git', ['add', '--', OUT], { cwd: ROOT, stdio: 'inherit' });
  const status = spawnSync('git', ['status', '--porcelain', '--', OUT], { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  if (String(status.stdout).trim() === '') {
    console.log('OUT unchanged; no commit needed');
    return;
  }
  const sha = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
  const r = spawnSync('git', ['commit', '-m', 'chore(p05): stage certification result artifact for clean tree (' + sha + ')'], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('Failed to commit OUT');
  }
}

const status = run();
commitOut();
process.exit(status === null ? 1 : status);
