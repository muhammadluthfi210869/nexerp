#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  P20 High-Throughput Concurrency & Stress Test Runner
#  50–100 Transaksi Serentak: 0 Deadlocks, 0 Variance (AC-P20-02)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

echo "═══════════════════════════════════════════════════════════════"
echo "  ⚡ RUNNING P20 CONCURRENCY & STRESS TEST (50-100 CONCURRENT OPS)"
echo "  Path: $BACKEND_DIR"
echo "═══════════════════════════════════════════════════════════════"

cd "$BACKEND_DIR"

if npm run test:p20:concurrency; then
  echo ""
  echo "✅ [P20] CONCURRENCY & STRESS TEST PASSED (Exit Code: 0)"
  exit 0
else
  EXIT_CODE=$?
  echo ""
  echo "❌ [P20] CONCURRENCY & STRESS TEST FAILED (Exit Code: $EXIT_CODE)"
  exit "$EXIT_CODE"
fi
