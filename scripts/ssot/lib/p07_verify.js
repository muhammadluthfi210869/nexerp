'use strict';

/**
 * NEX ERP - Phase P07 thin contracts verifier.
 *
 * Runs the focused static analyzers for SF1 (contract inventory + canonical
 * authority + marketing typecheck + lead-capture test health). Emits one
 * line per check and exits 0 only when all focused checks pass. This is
 * NOT a gate engine, mutation harness, or evidence framework — it is a
 * thin fail-fast composition of the already exercised analyzers.
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');

function analyzeCanonicalInventory(root) {
  const fs = require('fs');
  const dirs = [
    'backend/src/modules/bussdev',
    'backend/src/modules/crm',
    'backend/src/modules/guests',
    'backend/src/modules/lead-capture',
    'backend/src/modules/marketing/canonical'
  ];
  let controllers = 0, services = 0;
  const stack = dirs.map((d) => path.join(root, d));
  while (stack.length > 0) {
    const cur = stack.pop();
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const fp = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(fp);
      else if (e.isFile() && e.name.endsWith('.controller.ts')) controllers++;
      else if (e.isFile() && e.name.endsWith('.service.ts')) services++;
    }
  }
  return { controllers, services };
}

function analyzeLeadCaptureSilentCatches(root) {
  const fs = require('fs');
  const dir = path.join(root, 'backend/src/modules/lead-capture/__tests__');
  if (!fs.existsSync(dir)) return 0;
  let silent = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop();
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const fp = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(fp);
      else if (e.isFile() && e.name.endsWith('.spec.ts')) {
        try {
          const c = fs.readFileSync(fp, 'utf8');
          silent += (c.match(/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g) || []).length;
        } catch {}
      }
    }
  }
  return silent;
}

function runMarketingTypecheck(root) {
  const { spawnSync } = require('child_process');
  const res = spawnSync(process.execPath, [
    path.join(root, 'backend/node_modules/typescript/bin/tsc'),
    '-p', 'tsconfig.marketing.json',
    '--noEmit'
  ], {
    cwd: path.join(root, 'backend'),
    encoding: 'utf8',
    timeout: 120000
  });
  return { exit_code: res.status === 0 ? 0 : (res.status || 1), stdout: res.stdout || '', stderr: res.stderr || '' };
}

function runFrontendDnaScan(root) {
  const fs = require('fs');
  const screenDirs = [
    'frontend/src/app/(dashboard)/marketing',
    'frontend/src/app/(dashboard)/crm',
    'frontend/src/app/(dashboard)/bussdev',
    'frontend/src/app/(dashboard)/guests'
  ];
  let violations = 0;
  for (const sd of screenDirs) {
    const abs = path.join(root, sd);
    if (!fs.existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length > 0) {
      const cur = stack.pop();
      let entries;
      try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
      for (const e of entries) {
        const fp = path.join(cur, e.name);
        if (e.isDirectory()) stack.push(fp);
        else if (e.isFile() && /\.tsx?$/.test(e.name) && !e.name.includes('__tests__')) {
          try {
            const c = fs.readFileSync(fp, 'utf8');
            const dnaSub = c.match(/from\s+['"]@\/components\/dna\/[^'"]+['"]/g) || [];
            const shadcn = c.match(/from\s+['"]@\/components\/ui\/[^'"]+['"]/g) || [];
            violations += dnaSub.length + shadcn.length;
          } catch {}
        }
      }
    }
  }
  return violations;
}

function runContracts() {
  // Resolve ROOT from the script's own location (more robust than cwd).
  // lib/p07_verify.js lives at scripts/ssot/lib/, three levels under the project root.
  const root = path.resolve(__dirname, '..', '..', '..');
  console.log('[P07-SF1] canonical inventory scan');
  console.log('  root: ' + root);
  const inv = analyzeCanonicalInventory(root);
  console.log(`  controllers: ${inv.controllers}, services: ${inv.services}`);
  if (inv.controllers < 5) {
    console.error('  FAIL: <5 controllers in P07-owned modules');
    return 1;
  }
  if (inv.services < 5) {
    console.error('  FAIL: <5 services in P07-owned modules');
    return 1;
  }

  console.log('[P07-SF1] marketing typecheck');
  const tc = runMarketingTypecheck(root);
  if (tc.exit_code !== 0) {
    console.error(`  FAIL: marketing typecheck exit ${tc.exit_code}`);
    console.error(tc.stdout.split(/\r?\n/).slice(0, 5).join('\n'));
    return 1;
  }

  console.log('[P07-SF1] lead-capture silent catch scan');
  const silent = analyzeLeadCaptureSilentCatches(root);
  if (silent > 0) {
    console.error(`  FAIL: ${silent} silent catch{} blocks in lead-capture tests`);
    return 1;
  }

  console.log('[P07-SF1] frontend DNA / shadcn subpath scan');
  const dnaViolations = runFrontendDnaScan(root);
  if (dnaViolations > 0) {
    console.error(`  FAIL: ${dnaViolations} DNA / shadcn subpath violations in touched screens`);
    return 1;
  }

  console.log('[P07-SF1] PASS');
  return 0;
}

module.exports = { runContracts };