#!/bin/bash
# run-all.sh — Run semua A1 checks berurutan
# Usage: ./run-all.sh [base-branch]

set -e
BASE="${1:-main}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════"
echo "  AUDIT RUNNER — A1 Per-PR Gate"
echo "  Base: $BASE"
echo "═══════════════════════════════════════"
echo ""

echo "[1/4] A1.1 Scope Fence..."
"$SCRIPT_DIR/scope-fence.sh" "$BASE"
echo ""

echo "[2/4] A1.3 DNA Compliance..."
"$SCRIPT_DIR/dna-compliance.sh"
echo ""

echo "[3/4] A1.4 Hardcode Patterns..."
"$SCRIPT_DIR/hardcode-pattern.sh" "$BASE"
echo ""

echo "[4/4] A1.6 Type Safety..."
"$SCRIPT_DIR/type-safety.sh"
echo ""

echo "═══════════════════════════════════════"
echo "  ✅ ALL A1 CHECKS PASSED"
echo "═══════════════════════════════════════"
