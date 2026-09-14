#!/bin/bash
# Regression: .github/workflows/ci.yml must contain a bridge-size guard job
# that prevents wholesale merges into production-light.
# Without this, the wholesale-merge disaster can recur via PR.
set -euo pipefail
cd "$(dirname "$0")/../.."

WORKFLOW=".github/workflows/ci.yml"

if [ ! -f "$WORKFLOW" ]; then
  echo "❌ $WORKFLOW does not exist"
  exit 1
fi

# Must reference phase-3 in triggers (so phase-3 pushes also run CI)
if ! grep -q 'phase-3' "$WORKFLOW"; then
  echo "❌ $WORKFLOW missing phase-3 in triggers"
  exit 1
fi

# Must contain size guard logic (file count check via wc -l + threshold comparison)
if ! grep -qE 'wc -l' "$WORKFLOW"; then
  echo "❌ $WORKFLOW missing file count guard (wc -l)"
  exit 1
fi

if ! grep -q '\-gt 50' "$WORKFLOW"; then
  echo "❌ $WORKFLOW missing 50-file size threshold (-gt 50)"
  exit 1
fi

# Must reference production-light in the guard (to know what baseline to compare against)
if ! grep -q 'origin/production-light' "$WORKFLOW"; then
  echo "❌ $WORKFLOW does not compare PR against origin/production-light"
  exit 1
fi

echo "✅ $WORKFLOW contains bridge-size guard + phase-3 trigger"
exit 0
