#!/bin/bash
# Regression: scripts/verify-deploy.sh must NOT reference docker-compose.prod.yml
# (canonical name is docker-compose.yml per single-file-compose-for-all-env design).
# Bug found 2026-09-14 — script always fails on step 3/6 because file does not exist.
set -euo pipefail
cd "$(dirname "$0")/../.."

TARGET="scripts/verify-deploy.sh"
if [ ! -f "$TARGET" ]; then
  echo "❌ $TARGET does not exist"
  exit 1
fi

# Should have ZERO matches for docker-compose.prod.yml
MATCHES=$(grep -c 'docker-compose\.prod\.yml' "$TARGET" || true)
if [ "$MATCHES" -gt 0 ]; then
  echo "❌ $TARGET still references docker-compose.prod.yml in $MATCHES line(s)"
  grep -n 'docker-compose\.prod\.yml' "$TARGET" | head -5
  exit 1
fi

# Sanity: should reference docker-compose.yml at least once
REF=$(grep -c 'docker-compose\.yml' "$TARGET" || true)
if [ "$REF" -lt 1 ]; then
  echo "❌ $TARGET has zero references to docker-compose.yml either — suspicious"
  exit 1
fi

echo "✅ $TARGET has zero docker-compose.prod.yml + $REF docker-compose.yml refs"
exit 0
