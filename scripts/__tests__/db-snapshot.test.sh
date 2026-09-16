#!/bin/bash
# Regression: scripts/db-snapshot.sh must exist + be executable + use pg_dumpall.
# Without this, no pre-deploy DB snapshot capability.
set -euo pipefail
cd "$(dirname "$0")/../.."

SCRIPT="scripts/db-snapshot.sh"

if [ ! -f "$SCRIPT" ]; then
  echo "❌ $SCRIPT does not exist"
  exit 1
fi

if [ ! -x "$SCRIPT" ]; then
  echo "❌ $SCRIPT is not executable"
  exit 1
fi

# Must use pg_dumpall
if ! grep -q 'pg_dumpall' "$SCRIPT"; then
  echo "❌ $SCRIPT does not use pg_dumpall"
  exit 1
fi

# Must use docker exec (since DB runs in container)
if ! grep -q 'docker exec' "$SCRIPT"; then
  echo "❌ $SCRIPT does not use docker exec"
  exit 1
fi

# Must reference production-light-db-1 container
if ! grep -q 'production-light-db' "$SCRIPT"; then
  echo "❌ $SCRIPT does not reference production-light-db container"
  exit 1
fi

echo "✅ $SCRIPT exists, executable, uses pg_dumpall on production-light-db-1"
exit 0
