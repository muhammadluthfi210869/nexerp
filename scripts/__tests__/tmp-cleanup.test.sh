#!/bin/bash
# Regression: Hetzner-era fossilized tmp/ artifacts must be removed.
# These were stale PowerShell scripts + duplicate docker-compose/init-db files
# from before the production-light rewrite.
set -euo pipefail
cd "$(dirname "$0")/../.."

FAILED=0
for ARTIFACT in \
  "tmp/deploy-marketing-task.ps1" \
  "tmp/production-docker-compose.yml" \
  "tmp/production-init-db.sh" \
  "tmp/marketing-only-deploy"
do
  if [ -e "$ARTIFACT" ]; then
    echo "❌ $ARTIFACT still exists (should be removed)"
    FAILED=$((FAILED + 1))
  fi
done

if [ "$FAILED" -gt 0 ]; then
  echo "❌ $FAILED fossil artifact(s) still present in tmp/"
  exit 1
fi

# .gitignore should exclude active dev scratch
for PATTERN in "tmp/\*.sql" "tmp/\*.tar.gz" "tmp/Dockerfile.\*-hotfix"; do
  if ! grep -qF "$PATTERN" .gitignore 2>/dev/null; then
    echo "⚠️  .gitignore missing pattern: $PATTERN"
  fi
done

echo "✅ All 4 fossil artifacts removed from tmp/"
exit 0
