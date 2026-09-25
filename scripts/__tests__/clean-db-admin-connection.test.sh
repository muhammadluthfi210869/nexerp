#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  clean-db-admin-connection — "could not look" must not read as "clean"
# ═══════════════════════════════════════════════════════════════
#  The residue gates do two things: probe the test DB for namespace rows, and
#  probe the server for leftover disposable databases. The second probe needs a
#  connection to the `postgres` maintenance database, which the same role is not
#  always permitted to open.
#
#  The defect this pins: the gate catches that connection failure, prints a
#  warning, and — if the row probe happened to be clean — exits 0 with PASS.
#  The server-level half of the answer was never obtained, yet the gate reports
#  a verified-clean database.
#
#  Two scenarios are exercised, because the gate has two ways to lose the
#  server-level half of its answer:
#
#    A. the maintenance connection is refused — the gate must not exit 0;
#    B. the connection succeeds but the `pg_database` query fails — the gate
#       must not then report "0 nex_pNN_* databases", which is a claim about
#       the server made without ever having read it.
#
#  Method: the gate is run against a stub `pg` module, because the CI shell
#  suite has no PostgreSQL. The stub reports zero namespace rows, so the first
#  half genuinely passes and only the server-level half is under test.
#
#  Only the gates that own a server-level probe are exercised; a gate with no
#  such probe cannot have this defect.
# ═══════════════════════════════════════════════════════════════
set -uo pipefail

cd "$(dirname "$0")/../.."  # repo root
ROOT="$PWD"

# The stubs live inside the repo, addressed relatively: `mktemp -d` returns a
# Git-Bash `/tmp/...` path that Node on Windows cannot resolve, so an absolute
# POSIX path would silently fail to load the stub and the gate would run against
# the real `pg` instead.
TMP=".clean-db-test-stub.$$"
mkdir -p "$TMP"
trap 'rm -rf "$TMP"' EXIT

# ── stub pg ────────────────────────────────────────────────────
# SCENARIO env var selects the failure: "refuse" (A) or "query" (B).
mkdir -p "$TMP/pg"
cat > "$TMP/pg/package.json" <<'JSON'
{ "name": "pg", "version": "0.0.0-stub", "main": "index.js" }
JSON
cat > "$TMP/pg/index.js" <<'JS'
'use strict';
const { EventEmitter } = require('events');

class Client extends EventEmitter {
  constructor(cfg = {}) {
    super();
    this._isAdmin = /\/postgres(\?|$)/.test(String(cfg.connectionString || ''));
  }
  async connect() {
    if (this._isAdmin && process.env.SCENARIO === 'refuse') {
      throw new Error('permission denied for database "postgres"');
    }
  }
  async query(sql) {
    // Scenario B: the maintenance catalogue read is the thing that fails.
    if (/pg_database/.test(sql)) {
      if (process.env.SCENARIO === 'query') {
        throw new Error('canceling statement due to statement timeout');
      }
      return { rows: [] };
    }
    if (/count\(\*\)/.test(sql)) return { rows: [{ n: 0 }] };
    return { rows: [] };
  }
  async end() {}
}

module.exports = { Client };
JS

# ── stub dotenv ────────────────────────────────────────────────
mkdir -p "$TMP/dotenv"
cat > "$TMP/dotenv/package.json" <<'JSON'
{ "name": "dotenv", "version": "0.0.0-stub", "main": "index.js" }
JSON
cat > "$TMP/dotenv/index.js" <<'JS'
'use strict';
module.exports = { config: () => ({ parsed: {} }) };
JS

# ── gates that own a server-level probe ────────────────────────
GATES=(p07 p08 p09 p10 p11 p12 p13 p14 p15 p16 p17 p18)

fail=0
ran=0

for p in "${GATES[@]}"; do
  src="scripts/ssot/${p}_clean_db.js"
  [ -f "$src" ] || { echo "  ✗ $src missing"; fail=1; continue; }

  # Only gates that actually connect to the maintenance DB can have this defect.
  grep -q '/postgres' "$src" || continue
  ran=$((ran + 1))

  # Rewrite the two module paths the gate hardcodes onto our stubs. The
  # replacement is relative to the generated file, which sits beside `pg/`
  # and `dotenv/` inside $TMP.
  sed -e "s#path\.join(ROOT, 'backend/node_modules/pg')#'./pg'#" \
      -e "s#path\.join(ROOT, 'backend/node_modules/dotenv')#'./dotenv'#" \
      "$src" > "$TMP/${p}.js"

  # The stubs must actually be in play, or this test would be exercising the
  # real driver and reporting on the wrong thing.
  if ! grep -q "'\./pg'" "$TMP/${p}.js"; then
    echo "  ✗ ${p}: could not redirect the gate onto the stub pg driver"
    fail=1
    continue
  fi

  for scenario in refuse query; do
    out="$(SCENARIO="$scenario" \
           DATABASE_URL='postgresql://u:p@h:5432/erp_database?schema=public' \
           node "$TMP/${p}.js" 2>&1)"
    rc=$?

    if [ "$rc" -eq 0 ]; then
      echo "  ✗ ${p} [$scenario]: exited 0 with the server-level probe unavailable — 'could not look' read as 'clean'"
      echo "$out" | sed 's/^/      /'
      fail=1
    fi
    # It must also not claim a verified-clean result about the server.
    if echo "$out" | grep -qE 'server residue: 0|nex_p[0-9]+_\* database'; then
      echo "  ✗ ${p} [$scenario]: claimed the server was clean while the probe never ran"
      echo "$out" | grep -E 'server residue: 0|nex_p[0-9]+_\* database' | sed 's/^/      /'
      fail=1
    fi
  done
done

if [ "$ran" -eq 0 ]; then
  echo "clean-db-admin-connection: FAIL (no gate with a server-level probe was found)"
  exit 1
fi

if [ "$fail" -ne 0 ]; then
  echo "clean-db-admin-connection: FAIL"
  exit 1
fi
echo "clean-db-admin-connection: PASS ($ran gates fail closed when the admin probe cannot connect)"
exit 0