#!/bin/bash
# Two Nest controllers must never claim the same METHOD + path.
#
# Express matches the first registration and never reaches the second, so a
# duplicate route is dead code that still compiles, still lints, and still looks
# live in the editor — while its handlers can never run. The P03
# `duplicate_code_scan` gate reports this as a route collision; it caught
# `modules/executive/reports.controller.ts` and `modules/reports/reports.controller.ts`
# both on `@Controller('reports')` with eight identical GET paths.
#
# The base may be one path or an array of aliases: every alias is registered, so
# every alias can collide.
#
# A second, quieter collision is checked here for the same reason. Nest derives a
# Swagger operationId as `${ClassName}_${methodName}`, so two controllers that
# happen to share a class name emit the *same* operationId for any method they also
# share — even when their paths differ. `openapi-typescript` then writes that
# operationId as two properties of one object type and `tsc` dies in the generated
# file with TS2300 "Duplicate identifier", naming a 30k-line artifact nobody wrote.
# `backend/src/modules/{master,scm}/controllers/materials.controller.ts` both
# declared `export class MaterialsController`, and 5 shared method names took the
# frontend typecheck down.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Backend route uniqueness (no two controllers on the same METHOD + path)"

if [ ! -d "$ROOT/backend/src/modules" ]; then
  echo "  ⚠️  backend/src/modules tidak ada — cek dinamis dilewati"
  exit 0
fi

# The scan root is passed as an argv, never interpolated into the program string:
# an MSYS `/c/...` path inside `node -e "..."` is not resolvable by node.
node - "$ROOT" <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
const srcDir = path.join(root, 'backend/src');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, out);
    } else if (entry.name.endsWith('.controller.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** Base paths declared by `@Controller(...)`: one string, or an array of aliases. */
function basePaths(code) {
  const decl = code.match(/@Controller\(([\s\S]*?)\)/);
  if (!decl) return [];
  const arg = decl[1].trim();
  const clean = (p) => p.replace(/^\/+|\/+$/g, '');
  if (arg.startsWith('[')) {
    return [...arg.matchAll(/['"]([^'"]*)['"]/g)].map((m) => clean(m[1]));
  }
  const single = arg.match(/^['"]([^'"]*)['"]/);
  return single ? [clean(single[1])] : [];
}

const METHOD_DECORATOR = /@(Get|Post|Put|Patch|Delete|Options|Head|All)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g;
const owners = new Map();
const opIds = new Map();

/**
 * Name of the method a route decorator decorates: skip whitespace and any further
 * decorators (balanced parens, so `@ApiOperation({summary: ...})` is skipped whole),
 * then take the identifier before the parameter list.
 */
function methodNameAfter(code, from) {
  let i = from;
  for (;;) {
    while (i < code.length && /\s/.test(code[i])) i++;
    if (code[i] !== '@') break;
    i++;
    while (i < code.length && /[\w.$]/.test(code[i])) i++;
    if (code[i] === '(') {
      let depth = 0;
      do {
        if (code[i] === '(') depth++;
        else if (code[i] === ')') depth--;
        i++;
      } while (i < code.length && depth > 0);
    }
  }
  const m = /^(?:async\s+)?(\w+)\s*\(/.exec(code.slice(i));
  return m ? m[1] : '<unknown>';
}

for (const file of walk(srcDir)) {
  const code = fs.readFileSync(file, 'utf8');
  const bases = basePaths(code);
  if (!bases.length) continue;
  const cls = (code.match(/export class (\w+)/) || [, path.basename(file)])[1];
  const rel = path.relative(root, file).split(path.sep).join('/');

  for (const base of bases) {
    METHOD_DECORATOR.lastIndex = 0;
    let m;
    while ((m = METHOD_DECORATOR.exec(code)) !== null) {
      const method = m[1].toUpperCase();
      const sub = (m[2] || '').replace(/^\/+|\/+$/g, '');
      const full = '/' + [base, sub].filter(Boolean).join('/');
      const key = method + ' ' + full;
      if (!owners.has(key)) owners.set(key, []);
      owners.get(key).push(`${rel} (${cls})`);

      const opKey = `${cls}_${methodNameAfter(code, m.index + m[0].length)}`;
      if (!opIds.has(opKey)) opIds.set(opKey, []);
      opIds.get(opKey).push(rel);
    }
  }
}

const collisions = [...owners.entries()]
  .map(([key, list]) => [key, [...new Set(list)]])
  .filter(([, list]) => list.length > 1);

// One file may legitimately declare the same handler on two `@Controller` aliases;
// that is one operationId repeated inside one file, not a cross-file collision.
const opIdCollisions = [...opIds.entries()]
  .map(([key, list]) => [key, [...new Set(list)]])
  .filter(([, list]) => list.length > 1);

if (collisions.length === 0 && opIdCollisions.length === 0) {
  console.log(`  ✅ tidak ada rute ganda (${owners.size} rute unik, ${opIds.size} operationId unik)`);
  process.exit(0);
}

if (collisions.length) {
  console.log(`  ❌ ${collisions.length} rute diklaim lebih dari satu controller:`);
  for (const [key, list] of collisions) {
    console.log(`     ${key}`);
    for (const owner of list) console.log(`       - ${owner}`);
  }
}
if (opIdCollisions.length) {
  console.log(`  ❌ ${opIdCollisions.length} operationId dipakai dua controller berbeda:`);
  for (const [key, list] of opIdCollisions) {
    console.log(`     ${key}`);
    for (const owner of list) console.log(`       - ${owner}`);
  }
}
process.exit(1);
NODE
STATUS=$?

if [ "$STATUS" -eq 0 ]; then
  exit 0
fi
echo "  Rute kedua tidak pernah dipanggil Express — hapus salah satu pemiliknya."
echo "  OperationId ganda menghasilkan TS2300 di frontend/src/types/api.ts — beri salah satu class nama yang berbeda."
exit 1
