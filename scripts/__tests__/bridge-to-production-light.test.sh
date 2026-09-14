#!/bin/bash
# Regression: scripts/bridge-to-production-light.sh must exist, be executable,
# and refuse wholesale merge (e.g. `git merge phase-3`).
# This is the centerpiece of the bridge workflow (Phase 2.1).
set -euo pipefail
cd "$(dirname "$0")/../.."

SCRIPT="scripts/bridge-to-production-light.sh"

# Script must exist
if [ ! -f "$SCRIPT" ]; then
  echo "❌ $SCRIPT does not exist"
  exit 1
fi

# Must be executable
if [ ! -x "$SCRIPT" ]; then
  echo "❌ $SCRIPT is not executable (chmod +x)"
  exit 1
fi

# Must contain the size guard
if ! grep -q 'Too large' "$SCRIPT"; then
  echo "❌ $SCRIPT missing size guard (must reject >50 file bridges)"
  exit 1
fi

# Must contain pg_advisory_xact_lock regression guard
if ! grep -q 'pg_advisory_xact_lock' "$SCRIPT"; then
  echo "❌ $SCRIPT missing pg_advisory_xact_lock source-level guard"
  exit 1
fi

# Must reference prisma generate
if ! grep -q 'prisma generate' "$SCRIPT"; then
  echo "❌ $SCRIPT missing prisma generate validation"
  exit 1
fi

# Must require production-light branch
if ! grep -q 'production-light' "$SCRIPT"; then
  echo "❌ $SCRIPT missing production-light branch guard"
  exit 1
fi

echo "✅ $SCRIPT exists, executable, contains all required guards"
exit 0
