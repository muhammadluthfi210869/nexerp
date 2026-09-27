#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  P20 End-to-End Golden Thread Test Runner
#  13 Simpul Rantai Pasok & Finansial (AC-P20-01)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 RUNNING P20 E2E GOLDEN THREAD TEST (13 NODES)"
echo "  Path: $BACKEND_DIR"
echo "═══════════════════════════════════════════════════════════════"

cd "$BACKEND_DIR"

if npm run test:p20:golden-thread; then
  echo ""
  echo "✅ [P20] GOLDEN THREAD PASSED (Exit Code: 0)"
  exit 0
else
  EXIT_CODE=$?
  echo ""
  echo "❌ [P20] GOLDEN THREAD FAILED (Exit Code: $EXIT_CODE)"
  exit "$EXIT_CODE"
fi
