#!/usr/bin/env node
//
// Every dependency named in a package.json must be resolvable from that same
// tree's package-lock.json.
//
// Why this exists: `backend/package.json` gained the WA self-QR dependencies
// (whatsapp-web.js, puppeteer, qrcode, fluent-ffmpeg, archiver, ...) and the
// lock file was never regenerated. Nothing local noticed — the developer's
// node_modules already held the packages — and every gate was green. CI was the
// first clean install, and it died at `npm ci` with EUSAGE.
//
// `npm ci --dry-run` catches this too, but it needs the network and resolves
// the whole tree. This reads two JSON files and exits non-zero on the same
// defect, so it can run in the offline shell suite.
//
// Usage: node scripts/check-lockfile-sync.mjs [tree ...]
//        (default trees: ., backend, frontend)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

const trees = process.argv.slice(2).length ? process.argv.slice(2) : ['.', 'backend', 'frontend'];

let failed = 0;

for (const tree of trees) {
  const dir = path.resolve(ROOT, tree);
  const pkgPath = path.join(dir, 'package.json');
  const lockPath = path.join(dir, 'package-lock.json');

  if (!fs.existsSync(pkgPath)) {
    console.log(`  ❌ ${tree}: package.json tidak ada`);
    failed = 1;
    continue;
  }
  if (!fs.existsSync(lockPath)) {
    console.log(`  ❌ ${tree}: package-lock.json tidak ada — npm ci akan gagal`);
    failed = 1;
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

  // lockfileVersion 2 and 3 carry the `packages` map; v1 only has `dependencies`.
  const packages = lock.packages;
  if (!packages) {
    console.log(`  ⚠️  ${tree}: lockfileVersion ${lock.lockfileVersion} tanpa peta 'packages' — dilewati`);
    continue;
  }

  // A direct dependency is satisfied either hoisted to the tree root or nested
  // under a conflicting parent, so match the trailing segment anywhere.
  const resolved = new Set();
  for (const key of Object.keys(packages)) {
    if (key === '') continue;
    const at = key.lastIndexOf('node_modules/');
    if (at !== -1) resolved.add(key.slice(at + 'node_modules/'.length));
  }

  const missing = [];
  for (const field of FIELDS) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      if (!resolved.has(name)) missing.push(`${name} (${field})`);
    }
  }
  // The lock's own root entry must agree with package.json, otherwise npm ci
  // rewrites the tree instead of installing exactly what was locked.
  const declared = [];
  for (const field of FIELDS) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      const inLock = packages['']?.[field] ?? {};
      if (!(name in inLock)) declared.push(`${name} (${field})`);
    }
  }

  if (missing.length === 0 && declared.length === 0) {
    console.log(`  ✅ ${tree}: package.json ↔ package-lock.json sinkron`);
    continue;
  }
  failed = 1;
  if (missing.length) {
    console.log(`  ❌ ${tree}: ${missing.length} dependensi package.json tidak ada di lock`);
    for (const m of missing.slice(0, 20)) console.log(`       - ${m}`);
    if (missing.length > 20) console.log(`       ... dan ${missing.length - 20} lagi`);
  }
  if (declared.length) {
    console.log(`  ❌ ${tree}: ${declared.length} dependensi tidak tercatat di entri root lock`);
    for (const d of declared.slice(0, 20)) console.log(`       - ${d}`);
  }
  console.log(`     Perbaiki: (cd ${tree} && npm install --package-lock-only)`);
}

console.log(failed ? 'lockfile sync: GAGAL' : 'lockfile sync: OK');
process.exit(failed);
