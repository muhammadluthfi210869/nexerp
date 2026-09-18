#!/bin/bash
# Regression: backend/init-db.sh must be IDEMPOTENT on container restart.
# Phase P04: backend/init-db.sh must execute `prisma migrate deploy`, NOT `db push`.
# Idempotency guard ensures restart doesn't repeat destructive work or crash loop.
set -euo pipefail
cd "$(dirname "$0")/../.."

SCRIPT="backend/init-db.sh"

if [ ! -f "$SCRIPT" ]; then
  echo "❌ $SCRIPT does not exist"
  exit 1
fi

if [ ! -x "$SCRIPT" ]; then
  echo "❌ $SCRIPT is not executable (init-db is a container entrypoint)"
  exit 1
fi

# 1. Must detect drift via a persistence marker so repeated starts skip deploy
if ! grep -qE '\.schema-drift|.drift-marker|drift-acknowledged' "$SCRIPT"; then
  echo "❌ $SCRIPT does not persist drift state across restarts (idempotency guard missing)"
  exit 1
fi

# 1b. Must temporarily disable `set -e` around the migrate deploy.
if ! grep -qE 'set \+e' "$SCRIPT"; then
  echo "❌ $SCRIPT does not disable set -e around migrate deploy (crash-loop on failure)"
  exit 1
fi

# 2. Must call `npx prisma migrate deploy` and FORBID `prisma db push`
if grep -qE 'prisma db push' "$SCRIPT"; then
  echo "❌ $SCRIPT still calls prisma db push (forbidden in production/P04)"
  exit 1
fi

MIGRATE_LINE=$(grep -n 'npx prisma migrate deploy' "$SCRIPT" | head -1 || true)
if [ -z "$MIGRATE_LINE" ]; then
  echo "❌ $SCRIPT does not call prisma migrate deploy (canonical migration missing)"
  exit 1
fi

# 3. The migrate deploy line must be guarded — inside an if/fi block, NOT bare.
LINE_NO=$(echo "$MIGRATE_LINE" | cut -d: -f1)
if [ -n "$LINE_NO" ]; then
  PRECEDING=$(sed -n "1,$((LINE_NO-1))p" "$SCRIPT")
  IF_COUNT=$(echo "$PRECEDING" | grep -cE '^\s*(if|elif)\s+' || true)
  FI_COUNT=$(echo "$PRECEDING" | grep -cE '^\s*fi\s*$' || true)
  if [ "$IF_COUNT" -le "$FI_COUNT" ]; then
    echo "❌ $SCRIPT: migrate deploy at line $LINE_NO is not inside any conditional block ($IF_COUNT ifs ≤ $FI_COUNT fis)"
    exit 1
  fi
fi

# 4. On deploy failure, script must NOT exit non-zero in a way that restarts the loop.
if grep -nE '^\s*exit\s+1\s*$' "$SCRIPT" | grep -A1 'migrate deploy'; then
  echo "❌ $SCRIPT exits non-zero after migrate deploy failure (causes container restart loop)"
  exit 1
fi

# 5. Final exec must be present so the script actually starts NestJS after sync logic
if ! grep -qE 'exec node dist/main' "$SCRIPT"; then
  echo "❌ $SCRIPT does not exec node dist/main (app won't start)"
  exit 1
fi

echo "✅ $SCRIPT is idempotent: drift marker + guarded migrate deploy + continue-on-failure + exec app"
exit 0

