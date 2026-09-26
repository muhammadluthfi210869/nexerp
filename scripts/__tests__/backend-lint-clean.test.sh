#!/bin/bash
# Backend must be lint-clean, because P03 cannot certify over a lint error:
# `certify_p03_phase.js` runs `backend_lint` with the exact command below, and a
# phase that fails to certify blocks the GHCR image push.
#
# CI reaches `backend_lint` only after every earlier phase gate is green, so an
# eslint error can stay invisible for a long time. Five of them hid behind the
# broken Prisma migration gate until 2026-09-26. Run the same command here, at
# the same bar, so it fails in the suite instead of in a phase gate.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Backend lint clean (eslint --quiet — same command as certify_p03 backend_lint)"

if [ ! -d "$ROOT/backend/node_modules/eslint" ]; then
  echo "  ⚠️  backend/node_modules/eslint tidak ada — cek dinamis dilewati"
  exit 0
fi

OUT="$(cd "$ROOT/backend" && npx eslint "{src,apps,libs,test}/**/*.ts" --quiet 2>&1)"
STATUS=$?

if [ "$STATUS" -eq 0 ]; then
  echo "  ✅ eslint --quiet bersih"
  exit 0
fi

echo "  ❌ eslint --quiet melaporkan error (exit $STATUS):"
echo "$OUT" | grep -E "error|problem" | head -30
exit 1
