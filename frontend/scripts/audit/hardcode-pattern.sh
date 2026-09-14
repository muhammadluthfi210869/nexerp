#!/bin/bash
# hardcode-pattern.sh — A1.4: Detect hardcoded UI patterns in NEW changes only
# Usage: ./hardcode-pattern.sh [base-branch]
# Only flags changes in current diff vs base

set -e

BASE="${1:-main}"
NEW_FILES=$(git diff --name-only "origin/${BASE}...HEAD" 2>/dev/null | grep -E '\.tsx?$' || true)

if [ -z "$NEW_FILES" ]; then
  echo "✅ No changes detected"
  exit 0
fi

# Patterns to flag per ADR-007
PATTERNS_FOUND=""

for f in $NEW_FILES; do
  if [ -f "$f" ]; then
    HITS=$(grep -En "bg-(emerald|blue|red|green|yellow|amber)-[0-9]|text-\[[0-9]+px\]|rounded-(md|lg|2xl)\b|<input " "$f" 2>/dev/null || true)
    if [ -n "$HITS" ]; then
      PATTERNS_FOUND="${PATTERNS_FOUND}\n--- $f ---\n${HITS}\n"
    fi
  fi
done

if [ -n "$PATTERNS_FOUND" ]; then
  echo "🚫 HARDCODED PATTERNS detected:"
  echo -e "$PATTERNS_FOUND"
  echo ""
  echo "Gunakan DNA components (DnaStatCard, DnaInput, DnaPagination) atau design tokens."
  exit 1
fi

echo "✅ Hardcode patterns clean"
exit 0
