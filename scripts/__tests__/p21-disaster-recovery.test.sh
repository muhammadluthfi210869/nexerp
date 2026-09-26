#!/bin/bash
# Regression: P21 disaster-recovery tooling must be runnable and fail-closed.
#
# Bug found 2026-09-25 — scripts/dr-drill.sh referenced `docker-compose.prod.yml`
# (retired: the canonical file is docker-compose.yml), probed port 3002 (backend
# listens on 3001) and replayed a `pg_dumpall` plain-SQL snapshot with
# `pg_restore` (which only reads custom/tar archives). Every phase after step 1
# failed, so the drill could never certify a restore.
#
# Second failure mode this guards: a gate that exits 0 without having looked.
# The rehearsal runner must fail closed on a missing toolchain, an unreachable
# server, a failed dump, a failed restore and a diverging row count.
set -euo pipefail
cd "$(dirname "$0")/../.."

FAIL=0
bad() { echo "❌ $1"; FAIL=1; }

DRILL="scripts/dr-drill.sh"
REHEARSE="scripts/test-rollback-rehearsal.sh"
MIGRATE="scripts/test-migration-pipeline.sh"

# ── dr-drill.sh: canonical compose file, container, port ──
[ -f "$DRILL" ] || bad "$DRILL missing"
[ -x "$DRILL" ] || bad "$DRILL not executable"

if grep -q 'docker-compose\.prod\.yml' "$DRILL"; then
  bad "$DRILL still references retired docker-compose.prod.yml"
fi
grep -q 'docker-compose\.yml' "$DRILL" || bad "$DRILL does not reference docker-compose.yml"
grep -q 'DB_CONTAINER' "$DRILL" || bad "$DRILL has no DB_CONTAINER (container name is a variable)"
grep -qE '127\.0\.0\.1:3001|localhost:3001' "$DRILL" || bad "$DRILL health check is not on backend port 3001"
if grep -q ':3002' "$DRILL"; then
  bad "$DRILL still probes retired port 3002"
fi

# ── dr-drill.sh: snapshot is pg_dumpall plain SQL -> psql, never pg_restore ──
if grep -vE '^\s*#|^\s*$' "$DRILL" | grep -qE '\bpg_restore\b'; then
  bad "$DRILL replays a plain-SQL snapshot with pg_restore"
fi
grep -q 'ON_ERROR_STOP' "$DRILL" || bad "$DRILL restore does not use ON_ERROR_STOP"
grep -qE 'gunzip -c' "$DRILL" || bad "$DRILL does not gunzip the snapshot"

# ── Rehearsal runner: present, executable, fail-closed ──
[ -f "$REHEARSE" ] || bad "$REHEARSE missing"
[ -x "$REHEARSE" ] || bad "$REHEARSE not executable"
grep -q 'set -euo pipefail' "$REHEARSE" || bad "$REHEARSE does not run with set -euo pipefail"
grep -q 'RTO_LIMIT_S' "$REHEARSE" || bad "$REHEARSE has no RTO budget"
grep -qE 'SCRATCH_DB=' "$REHEARSE" || bad "$REHEARSE does not restore into a throwaway database"
grep -qE 'DROP DATABASE IF EXISTS' "$REHEARSE" || bad "$REHEARSE does not drop the throwaway database"
# Must refuse to report success when it could not reach the server.
grep -q 'server unreachable' "$REHEARSE" || bad "$REHEARSE has no unreachable-server failure path"
grep -qE 'exit 1' "$REHEARSE" || bad "$REHEARSE never exits non-zero"
# Every psql call must refuse an interactive password prompt: a gate that
# blocks on stdin looks identical to a hanging database.
PROMPT_FREE=$(grep -c '\-w --dbname=' "$REHEARSE" || true)
PSQL_CALLS=$(grep -c '\-\-dbname=' "$REHEARSE" || true)
[ "$PROMPT_FREE" -eq "$PSQL_CALLS" ] || bad "$REHEARSE has psql calls without -w (may hang on a password prompt)"

# ── Migration pipeline runner + npm script ──
[ -f "$MIGRATE" ] || bad "$MIGRATE missing"
[ -x "$MIGRATE" ] || bad "$MIGRATE not executable"
grep -q 'test:p21:migration-pipeline' "$MIGRATE" || bad "$MIGRATE does not invoke the P21 npm script"
grep -q 'test:p21:migration-pipeline' backend/package.json || bad "backend/package.json missing test:p21:migration-pipeline"
[ -f backend/test/p21/p21-migration-pipeline.e2e-spec.ts ] || bad "P21 migration e2e spec missing"

if [ "$FAIL" -ne 0 ]; then
  echo "❌ P21 disaster-recovery tooling contract violated"
  exit 1
fi

echo "✅ P21 DR tooling: canonical compose/port, psql restore, fail-closed rehearsal"
exit 0
