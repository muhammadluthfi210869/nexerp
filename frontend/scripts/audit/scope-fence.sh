#!/bin/bash
# scope-fence.sh — A1.1: Verify no edits to LOCKED paths
# Usage: ./scope-fence.sh [base-branch]
# Exit 0 = clean, Exit 1 = violation

set -e

BASE="${1:-main}"
FORBIDDEN=$(git diff --name-only "origin/${BASE}...HEAD" 2>/dev/null | \
  grep -E '^frontend/src/app/\(dashboard\)/dashboard|^frontend/src/app/\(dashboard\)/marketing|^frontend/src/app/\(dashboard\)/dna-visual|^frontend/src/components/dashboard' || true)

if [ -n "$FORBIDDEN" ]; then
  echo "🚫 SCOPE VIOLATION — file terlarang disentuh:"
  echo "$FORBIDDEN"
  echo ""
  echo "Lihat REFACTOR_ROADMAP Section 0.1 — file-file ini LOCKED/EXCLUDED."
  exit 1
fi

echo "✅ Scope clean — no locked path touched"
exit 0
