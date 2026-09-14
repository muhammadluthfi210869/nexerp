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

# Phase 4 — CI safeguards
run_test "ci-has-ghcr-push-images"                   "$SCRIPT_DIR/ci-ghcr.test.sh"
run_test "init-db-idempotent-on-restart"             "$SCRIPT_DIR/init-db-idempotency.test.sh"

# Phase 5 — Top-level docs
run_test "docs-link-integrity"                       "$SCRIPT_DIR/docs-link-integrity.test.sh"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  PASS: $PASS   FAIL: $FAIL   SKIP: $SKIP"
echo "═══════════════════════════════════════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
