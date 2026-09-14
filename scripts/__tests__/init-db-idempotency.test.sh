#!/bin/bash
# Regression: backend/init-db.sh must be IDEMPOTENT on container restart.
# Bug history 2026-09-14: prisma db push ran on EVERY container start, hit schema
# drift between code (production-light) and DB (wholesale-merge-era), and crash-
# loopped the backend. Workaround was to bypass init-db entirely. This test pins
# the proper fix: idempotent push that doesn't repeat destructive work on restart.
#
# Without this guard, deploy -> restart -> drift -> crash loop recurs forever.
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

# 1. Must detect drift via a persistence marker so repeated starts skip push
#    Options observed: marker file (/app/data/.schema-drift-*), env var, or set -e removal.
if ! grep -qE '\.schema-drift|.drift-marker|drift-acknowledged' "$SCRIPT"; then
  echo "❌ $SCRIPT does not persist drift state across restarts (idempotency guard missing)"
  exit 1
fi

# 2. db push call must be CONDITIONAL (currently `npx prisma db push` runs unconditionally twice)
#    Acceptable patterns: 'if [ ! -f marker ]; then db push fi' OR 'if db push; then ... fi'
PUSH_LINE=$(grep -n 'npx prisma db push' "$SCRIPT" | head -1 || true)
if [ -z "$PUSH_LINE" ]; then
  echo "❌ $SCRIPT no longer calls prisma db push (regression — schema sync lost)"
  exit 1
fi

# 3. The first db push line must be guarded — surrounded by an if/fi block, NOT bare.
#    Parse a few lines before the push line and confirm there's a conditional.
LINE_NO=$(echo "$PUSH_LINE" | cut -d: -f1)
if [ -n "$LINE_NO" ]; then
  CONTEXT=$(sed -n "$((LINE_NO-5)),${LINE_NO}p" "$SCRIPT")
  if ! echo "$CONTEXT" | grep -qE '^\s*(if|elif)\s+'; then
    echo "❌ $SCRIPT: db push at line $LINE_NO is unconditional (will re-run on every container start)"
    exit 1
  fi
fi

# 4. On push failure, script must NOT exit non-zero in a way that restarts the loop.
#    Currently the script retries once and continues; the fix should be: log + continue.
#    Anti-pattern check: there must NOT be bare 'exit 1' immediately after a failed push.
if grep -nE '^\s*exit\s+1\s*$' "$SCRIPT" | grep -A1 'db push'; then
  echo "❌ $SCRIPT exits non-zero after db push failure (causes container restart loop)"
  exit 1
fi

# 5. Final exec must be present so the script actually starts NestJS after sync logic
if ! grep -qE 'exec node dist/main' "$SCRIPT"; then
  echo "❌ $SCRIPT does not exec node dist/main (app won't start)"
  exit 1
fi

echo "✅ $SCRIPT is idempotent: drift marker + guarded push + continue-on-failure + exec app"
exit 0
