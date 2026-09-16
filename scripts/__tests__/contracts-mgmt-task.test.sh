#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Lock kontrak yang laten di sesi 2026-09-15
# ═══════════════════════════════════════════════════════════════
set -uo pipefail
cd "$(dirname "$0")/../.."
PASS=0; FAIL=0
ok() { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

# Lock 1: init-db.sh exec path benar (Nest convention)
grep -qE 'exec node dist/main' backend/init-db.sh \
  && ok "init-db.sh exec node dist/main (Nest convention)" \
  || bad "init-db.sh exec path drifted from dist/main"

# Lock 2: department seed value match allow-list
if grep -qE "department:\s*'(DIGIMAR|CREATIVE|MARKETING|HR|FINANCE)'" \
     backend/prisma/seed.ts 2>/dev/null; then
  bad "seed writes non-allow-list department value (will be filtered out)"
else
  ok "seed department values stay within canonical-marketing listMembers allow-list"
fi

# Lock 3: NEXT_PUBLIC_API_URL no trailing /v1
if grep -qE 'NEXT_PUBLIC_API_URL.*\.id/api/v1' .github/workflows/ci.yml; then
  bad "CI build-arg default has trailing /v1 — will double-prefix"
else
  ok "CI build-arg NEXT_PUBLIC_API_URL has no trailing /v1"
fi

# Lock 4: prototype module gone
[ ! -d backend/src/modules/marketing/prototype ] \
  && ok "prototype module deleted (canonical-only writes)" \
  || bad "prototype module STILL EXISTS — parallel backend will race"

# Lock 5: nginx rewrite contract preserved
grep -qE "rewrite \^/api/\(\.\*\) /v1/\\\$1" nginx.conf \
  && ok "nginx rewrite /api/(.*) → /v1/(.*) preserved" \
  || bad "nginx rewrite contract drifted"

echo ""
echo "  contracts: $PASS pass / $FAIL fail"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
