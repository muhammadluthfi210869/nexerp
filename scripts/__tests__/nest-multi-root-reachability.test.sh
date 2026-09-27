#!/bin/bash
# Guards the backend reachability analyzer against seeing only one Nest root.
#
# This deployment runs TWO NestJS entrypoints: `main.ts` bootstraps AppModule,
# and `self-qr.main.ts` bootstraps SelfQrAppModule for the standalone WhatsApp
# collector container (port 3002). `buildNestRegistrationGraph` walked from
# app.module.ts alone, so every wa-self-qr controller/service/module was written
# into `_LIFECYCLE_REGISTRY.json` as `reachable: false` + `DEAD_CODE` — live
# production code declared dead. The P02 audit could not catch it: a DEAD_CODE
# entry with an owner is "explained", so the orphan scan stayed green.
#
# Both the registry generator and the independent auditor build this graph, so
# the roots are discovered inside the lib from every `*.main.ts`
# `NestFactory.create()` call. A root list held by one caller and not the other
# makes the registry and its audit disagree; a third entrypoint would then
# regress silently.
#
# Red first: the `single` probe restricts the walk to app.module.ts — the exact
# pre-fix default — and asserts it cannot see the collector, so this gate cannot
# pass by accident.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LIB="$ROOT/scripts/ssot/lib/nest_registration_graph.js"

fail=0
report() { # report <ok|no> <label>
  if [ "$1" = ok ]; then
    echo "  ✅ $2"
  else
    echo "  ❌ $2"
    fail=1
  fi
}
expect() { # expect <json-grep-pattern> <ok-label> <fail-label>
  if echo "$PROBE" | grep -q "$1"; then report ok "$2"; else report no "$3"; fi
}

echo "Nest multi-root reachability guard"

# 1. The lib must derive the entrypoints itself, or one of the two callers
#    (generator, auditor) walks a single root again.
if grep -q "discoverRootModules" "$LIB" && grep -q "NestFactory.create" "$LIB"; then
  report ok "lib menemukan entrypoint dari NestFactory.create() di *.main.ts"
else
  report no "lib tidak menemukan entrypoint *.main.ts"
fi

# 2+3. Dynamic proof, plus the committed registry.
#   single=false  — one root cannot see the collector (the defect was real)
#   multi=true    — the default walk sees it (derivation works)
#   registry=true — the committed registry was regenerated with the fixed walk
# The registry path is resolved by node from an argv, never interpolated into a
# JS program string: an MSYS `/c/...` path inside `node -e "..."` is not
# resolvable by node, which is what once made this check red for the wrong reason
# while its stderr was swallowed.
PROBE=$(node - "$ROOT" <<'NODE'
const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2];
const { buildNestRegistrationGraph } = require(path.join(ROOT, 'scripts/ssot/lib/nest_registration_graph'));

const FILE = 'backend/src/modules/wa-self-qr/wa-self-qr.controller.ts';
const SYMBOL = 'WaSelfQrController';
const seen = (graph) =>
  graph.isControllerReachable(FILE, SYMBOL) || graph.isControllerReachable(FILE);

// Pre-fix behaviour, pinned explicitly: app.module.ts is the only root.
const single = seen(buildNestRegistrationGraph(ROOT, {
  rootModules: [{ file: path.join(ROOT, 'backend/src/app.module.ts'), symbol: 'AppModule' }],
}));
const multi = seen(buildNestRegistrationGraph(ROOT));

let registry = false;
let registryError = null;
try {
  const reg = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'docs/legacy-erp/verification/_LIFECYCLE_REGISTRY.json'), 'utf8'));
  const entry = (reg.backend_controllers || []).find(
    (c) => String(c.file).replace(/\\/g, '/').endsWith(FILE));
  registry = !!(entry && entry.reachable === true);
} catch (e) {
  registryError = e.message;
}

console.log(JSON.stringify({ single, multi, registry, registryError }));
process.exit(multi && registry ? 0 : 1);
NODE
)
PROBE_EXIT=$?
echo "     probe: ${PROBE:-<no output>}"

expect '"single":false' \
  "root tunggal memang tidak melihat kolektor (defect terbukti nyata)" \
  "root tunggal sudah melihat kolektor — probe tidak lagi membuktikan apa pun"
expect '"multi":true' \
  "walk default (dua entrypoint) melihat WaSelfQrController" \
  "walk default tetap tidak melihat WaSelfQrController"
expect '"registry":true' \
  "registry ter-commit menandai WaSelfQrController reachable" \
  "registry belum diregenerasi setelah perbaikan multi-root"

if [ "$PROBE_EXIT" -ne 0 ]; then fail=1; fi

exit "$fail"
