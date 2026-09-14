#!/bin/bash
# Regression: scripts/safe-merge.sh must exist and BLOCK wholesale merge of phase-3.
# Without this guard, a developer can `git merge phase-3 --no-ff` and re-trigger the
# 1423-file wholesale merge disaster from 2026-09-14.
set -euo pipefail
cd "$(dirname "$0")/../.."

SCRIPT="scripts/safe-merge.sh"

if [ ! -f "$SCRIPT" ]; then
  echo "❌ $SCRIPT does not exist"
  exit 1
fi

if [ ! -x "$SCRIPT" ]; then
  echo "❌ $SCRIPT is not executable"
  exit 1
fi

# Must reference phase-3 blocking
if ! grep -q 'phase-3' "$SCRIPT"; then
  echo "❌ $SCRIPT missing phase-3 reference"
  exit 1
fi

# Must contain BLOCKED or similar
if ! grep -qE 'BLOCKED|blocked' "$SCRIPT"; then
  echo "❌ $SCRIPT missing blocking message"
  exit 1
fi

# Dry-run: try invoking it with phase-3 (should exit non-zero)
if bash "$SCRIPT" phase-3 >/dev/null 2>&1; then
  echo "❌ $SCRIPT did NOT block phase-3 wholesale merge"
  exit 1
fi

echo "✅ $SCRIPT blocks phase-3 wholesale merge"
exit 0
