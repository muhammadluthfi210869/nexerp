#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Wrapper for git merge that BLOCKS the wholesale-merge foot-gun
# ═══════════════════════════════════════════════════════════════
#  Usage: bash scripts/safe-merge.sh <branch>
#  Example: bash scripts/safe-merge.sh main
#
#  For phase-3, the only safe path is the bridge workflow:
#    bash scripts/bridge-to-production-light.sh phase-3 <commit>
#
#  This script exists because the 2026-09-14 wholesale-merge disaster
#  (commit e75fbe1) caused 50 Prisma errors + 6 missing modules +
#  Prisma client generation failure, requiring a revert.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

TARGET="${1:?usage: $0 <branch>}"
CURRENT="$(git branch --show-current)"

echo "▶ Merge $TARGET into $CURRENT"

# Block 1: phase-3 wholesale merge is NEVER allowed
if [ "$TARGET" = "phase-3" ]; then
  echo ""
  echo "❌❌❌ Wholesale merge of phase-3 into $CURRENT is BLOCKED ❌❌❌"
  echo ""
  echo "Reason: phase-3 and production-light are TWO DIFFERENT PRODUCTS"
  echo "from common ancestor 59eeca2c.phase-3 has 38 modules + 23 schema files."
  echo "production-light has 5 modules + 6 schema files (intentionally pruned per"
  echo "PRODUCTION_LIGHT.md). Wholesale merge causes 50+ Prisma errors and 6"
  echo "missing NestJS modules (proven 2026-09-14 — commit e75fbe1 was reverted)."
  echo ""
  echo "Use the bridge workflow instead:"
  echo "  bash scripts/bridge-to-production-light.sh phase-3 <commit-ish>"
  echo ""
  echo "See docs/BridgePattern.md for the canonical pattern (template: 20fb4e1)."
  exit 1
fi

# Block 2: enforce small merge for any other branch
git merge --no-commit --no-ff "$TARGET" 2>/dev/null || {
  echo "❌ merge conflict with $TARGET — resolve manually first"
  exit 1
}
FILES=$(git diff --cached --name-only | wc -l | tr -d ' ')
LINES=$(git diff --cached --shortstat | awk '{print $4+$6}')
LINES=${LINES:-0}
git merge --abort >/dev/null 2>&1

echo "▶ $TARGET → $CURRENT: $FILES files / ~$LINES lines"

if [ "$FILES" -ge 50 ]; then
  echo "❌ Too large: $FILES files. Use bridge pattern for big merges."
  exit 1
fi

# Safe to proceed
echo "▶ proceeding with merge..."
exec git merge --no-ff "$TARGET" -m "merge $TARGET → $CURRENT ($FILES files)"
