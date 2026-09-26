#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Run all deploy-architecture regression tests
# ═══════════════════════════════════════════════════════════════
#  Phase 0.2 + 1.3 + 2.5 + 3.5 + 4.3 + 5.5 — CLAUDE.md QA GATE mandate:
#  every behavior must have a failing test BEFORE the fix.
#
#  Exit 0 = all tests pass (READY TO SHIP)
#  Exit 1 = at least one test failed (still working)
# ═══════════════════════════════════════════════════════════════
set -uo pipefail

cd "$(dirname "$0")/../.."  # repo root
SCRIPT_DIR="$(dirname "$0")"
PASS=0
FAIL=0
SKIP=0

run_test() {
  local name="$1"
  local script="$2"
  printf "  %-50s " "$name"
  if [ ! -f "$script" ]; then
    echo "❌ MISSING test file: $script"
    FAIL=$((FAIL + 1))
    return
  fi
  if bash "$script" >/tmp/test-out.$$ 2>&1; then
    echo "✅ PASS"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL"
    FAIL=$((FAIL + 1))
    echo "    --- output ---"
    sed 's/^/    /' /tmp/test-out.$$ | head -10
  fi
  rm -f /tmp/test-out.$$
}

# Phase 1 — Fix scripts + tmp/
run_test "verify-deploy-filename-no-compose-prod"   "$SCRIPT_DIR/verify-deploy-filename.test.sh"
run_test "tmp-fossils-deleted"                       "$SCRIPT_DIR/tmp-cleanup.test.sh"

# Phase 2 — Konsolidasi 1-branch (bridge workflow retired 2026-09)
run_test "consolidation-single-branch"               "$SCRIPT_DIR/consolidation.test.sh"

# Phase 3 — Incident response
run_test "rollback-script-exists"                    "$SCRIPT_DIR/rollback.test.sh"
run_test "db-snapshot-script-exists"                 "$SCRIPT_DIR/db-snapshot.test.sh"

# Phase 4 — CI safeguards & contracts
run_test "ci-has-ghcr-push-images"                   "$SCRIPT_DIR/ci-ghcr.test.sh"
run_test "init-db-idempotent-on-restart"             "$SCRIPT_DIR/init-db-idempotency.test.sh"
run_test "contracts-mgmt-task-and-routes"            "$SCRIPT_DIR/contracts-mgmt-task.test.sh"
run_test "validate-env-ci-checkout-safe"             "$SCRIPT_DIR/validate-env-ci-checkout.test.sh"

# Phase 5 — Top-level docs
run_test "docs-link-integrity"                       "$SCRIPT_DIR/docs-link-integrity.test.sh"

# Phase 6 — Phase-gate integrity (a gate that cannot detect residue is not a gate)
run_test "clean-db-no-phantom-tables"                "$SCRIPT_DIR/clean-db-phantom-tables.test.sh"
run_test "gate-tables-are-migration-created"          "$SCRIPT_DIR/gate-tables-are-migration-created.test.sh"
# A residue gate that reports "clean" without having looked is worse than none.
run_test "clean-db-gates-fail-closed"                 "$SCRIPT_DIR/clean-db-gates-fail-closed.test.sh"
run_test "clean-db-admin-connection"                  "$SCRIPT_DIR/clean-db-admin-connection.test.sh"

# Phase 2 — Fabrication guards (mock data cannot reappear silently)
run_test "no-fabricated-mock-page-guards"            "$SCRIPT_DIR/fabrication-guards.test.sh"

# Phase 7 — P21 migration & disaster recovery (canonical names + fail-closed)
run_test "p21-dr-tooling-contract"                   "$SCRIPT_DIR/p21-disaster-recovery.test.sh"

# Fase 5/P22 — UAT pre-flight browser gate (a sweep must not report on a foreign build)
run_test "p22-uat-preflight-gate-fail-closed"        "$SCRIPT_DIR/p22-uat-preflight.test.sh"
# Fase 5/P22 — PDF live probe must reject a 200 that is only a placeholder
run_test "p22-pdf-live-probe-fail-closed"            "$SCRIPT_DIR/p22-pdf-live-probe.test.sh"
# Master data — the seeder must not report success over a CSV directory it never read
run_test "master-seed-fail-closed"                   "$SCRIPT_DIR/master-seed-guard.test.sh"
# Deterministic install — a lock file out of sync passes locally and dies only in CI
run_test "lockfile-in-sync"                          "$SCRIPT_DIR/lockfile-in-sync.test.sh"
# CI prisma invocation — `npx --prefix backend` keeps the repo-root CWD and finds no schema
run_test "ci-prisma-cwd"                             "$SCRIPT_DIR/ci-prisma-cwd.test.sh"
# Backend reachability — one Nest root marks the whole WA self-QR tree as DEAD_CODE
run_test "nest-multi-root-reachability"              "$SCRIPT_DIR/nest-multi-root-reachability.test.sh"
# Backend lint — P03 refuses to certify over an eslint error, and CI only reaches it late
run_test "backend-lint-clean"                        "$SCRIPT_DIR/backend-lint-clean.test.sh"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PASS: $PASS   FAIL: $FAIL   SKIP: $SKIP"
echo "═══════════════════════════════════════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
