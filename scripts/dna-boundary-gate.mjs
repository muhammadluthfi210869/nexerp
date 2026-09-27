#!/usr/bin/env node
/**
 * DNA boundary ratchet — fails when the violation count GROWS.
 *
 * Why a ratchet and not "flip warn to error": the tree carries ~3300 DNA warnings today
 * (1462 raw-HTML JSX uses, 913 restricted-syntax hits, 16 legacy-DNA imports). Setting the
 * rules to `error` would fail every build starting now, which is not a gate, it is a wall.
 * A ratchet enforces the actual rule — no NEW violations — and is the only version that can
 * be turned on today.
 *
 * Baseline lives in scripts/dna-boundary-baseline.json. When a count drops, lower the
 * baseline in the same commit. Never raise it to make a red run green.
 *
 * Usage:  node scripts/dna-boundary-gate.mjs           # check
 *         node scripts/dna-boundary-gate.mjs --update  # rewrite baseline to current counts
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND = path.join(ROOT, 'frontend');
const BASELINE = path.join(ROOT, 'scripts/dna-boundary-baseline.json');

const eslint = process.platform === 'win32' ? 'npx.cmd' : 'npx';
let raw = '';
try {
  raw = execFileSync(eslint, ['eslint', 'src/app/(dashboard)/**/page.tsx', 'src/app/(dashboard)/**/layout.tsx', '-f', 'json'], {
    cwd: FRONTEND,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
} catch (e) {
  // ESLint exits 1 when any rule is severity 2; its JSON is still on stdout.
  raw = e.stdout ?? '';
  if (!raw) {
    console.error('eslint produced no JSON:', e.message);
    process.exit(2);
  }
}

const report = JSON.parse(raw);
const counts = {};
const worst = {};
for (const file of report) {
  const rel = path.relative(ROOT, file.filePath).replace(/\\/g, '/');
  for (const m of file.messages) {
    if (!m.ruleId) continue;
    counts[m.ruleId] = (counts[m.ruleId] ?? 0) + 1;
    (worst[m.ruleId] ??= []).push(`${rel}:${m.line}`);
  }
}

if (process.argv.includes('--update')) {
  fs.writeFileSync(BASELINE, JSON.stringify({ counts }, null, 1) + '\n');
  console.log('baseline updated', JSON.stringify(counts));
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error(`no baseline at ${path.relative(ROOT, BASELINE)} — run with --update once to record current counts`);
  process.exit(2);
}

const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).counts;
let grew = false;
for (const [rule, n] of Object.entries(counts)) {
  const b = base[rule] ?? 0;
  if (n > b) {
    grew = true;
    console.log(`FAIL ${rule}: ${n} (baseline ${b}, +${n - b})`);
    for (const loc of worst[rule].slice(0, 10)) console.log(`       ${loc}`);
    if (worst[rule].length > 10) console.log(`       ... and ${worst[rule].length - 10} more`);
  } else if (n < b) {
    console.log(`ok   ${rule}: ${n} (baseline ${b}, -${b - n} — lower the baseline in this commit)`);
  } else {
    console.log(`ok   ${rule}: ${n}`);
  }
}
for (const rule of Object.keys(base)) {
  if (!(rule in counts)) console.log(`ok   ${rule}: 0 (baseline ${base[rule]} — lower the baseline in this commit)`);
}

console.log(grew ? '\nDNA BOUNDARY REGRESSED' : '\nDNA boundary held');
process.exit(grew ? 1 : 0);
