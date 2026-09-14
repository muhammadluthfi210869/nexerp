#!/bin/bash
# Regression: scripts/rollback.sh must exist + be executable + reference image tags.
# Without this, incident response is manual + slow (git revert + rebuild).
set -euo pipefail
cd "$(dirname "$0")/../.."

SCRIPT="scripts/rollback.sh"

if [ ! -f "$SCRIPT" ]; then
  echo "❌ $SCRIPT does not exist"
  exit 1
fi

if [ ! -x "$SCRIPT" ]; then
  echo "❌ $SCRIPT is not executable"
  exit 1
fi

# Must reference image tag rolling
if ! grep -q 'docker images' "$SCRIPT"; then
  echo "❌ $SCRIPT does not query docker images for tag history"
  exit 1
fi

# Must support steps-back argument
if ! grep -qE 'STEPS|steps' "$SCRIPT"; then
  echo "❌ $SCRIPT missing steps-back argument"
  exit 1
fi

# Must NOT use git revert in executable code (image-tag rollback per architecture).
# Skip comment lines (#) and empty lines.
if grep -vE '^\s*#|^\s*$' "$SCRIPT" | grep -qE '\bgit revert\b|\bgit reset\b'; then
  echo "❌ $SCRIPT uses git revert/reset in executable code — must be image-tag-only rollback"
  exit 1
fi

# Must do a health check
if ! grep -q 'health' "$SCRIPT"; then
  echo "❌ $SCRIPT missing post-rollback health check"
  exit 1
fi

echo "✅ $SCRIPT exists, executable, image-tag-based with health check"
exit 0
