#!/bin/bash
# Regression: docs/INDEX.md + ARCHITECTURE.md + RUNBOOK.md + docs/BridgePattern.md
# must exist and be cross-linked from CLAUDE.md navigation section.
# Without these, future contributors can't find the bridge workflow.
set -euo pipefail
cd "$(dirname "$0")/../.."

MISSING=0
for DOC in \
  "ARCHITECTURE.md" \
  "RUNBOOK.md" \
  "docs/BridgePattern.md" \
  "docs/INDEX.md"
do
  if [ ! -f "$DOC" ]; then
    echo "❌ $DOC missing"
    MISSING=$((MISSING + 1))
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo "❌ $MISSING required doc(s) missing"
  exit 1
fi

# CLAUDE.md must link to all of them
for DOC in "ARCHITECTURE.md" "RUNBOOK.md" "BridgePattern"; do
  if ! grep -qF "$DOC" CLAUDE.md; then
    echo "❌ CLAUDE.md missing link to $DOC"
    MISSING=$((MISSING + 1))
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo "❌ CLAUDE.md navigation broken"
  exit 1
fi

# docs/INDEX.md must link to ARCHITECTURE.md and BridgePattern
for LINK in "ARCHITECTURE.md" "RUNBOOK.md" "BridgePattern"; do
  if ! grep -qF "$LINK" docs/INDEX.md; then
    echo "❌ docs/INDEX.md missing link to $LINK"
    MISSING=$((MISSING + 1))
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo "❌ docs/INDEX.md links incomplete"
  exit 1
fi

# docs/BridgePattern.md must reference the canonical-bridge QA gate
if ! grep -q '2026-09-14-canonical-bridge-prod-light' docs/BridgePattern.md; then
  echo "❌ docs/BridgePattern.md missing reference to canonical-bridge QA gate"
  exit 1
fi

echo "✅ All 4 docs exist + cross-linked from CLAUDE.md"
exit 0
