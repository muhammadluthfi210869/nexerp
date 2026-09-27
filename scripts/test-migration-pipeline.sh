#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  P21 Data Migration Pipeline Test Runner
#  10.000 baris master data + gerbang penolakan (AC-P21-01)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

echo "═══════════════════════════════════════════════════════════════"
echo "  📥 RUNNING P21 DATA MIGRATION PIPELINE TEST"
echo "  Path: $BACKEND_DIR"
echo "═══════════════════════════════════════════════════════════════"

cd "$BACKEND_DIR"

if npm run test:p21:migration-pipeline; then
  echo ""
  echo "✅ [P21] MIGRATION PIPELINE PASSED (Exit Code: 0)"
  exit 0
else
  EXIT_CODE=$?
  echo ""
  echo "❌ [P21] MIGRATION PIPELINE FAILED (Exit Code: $EXIT_CODE)"
  exit "$EXIT_CODE"
fi
