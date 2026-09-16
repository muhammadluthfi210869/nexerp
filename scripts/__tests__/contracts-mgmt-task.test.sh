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

# Lock 6: SQL grant script ships in backend image (RC1 — RolesGuard role block fix)
[ -f backend/scripts/db-grant-digimar-roles.sql ] \
  && ok "RC1: backend/scripts/db-grant-digimar-roles.sql exists for marketing-role cohort" \
  || bad "RC1: backend/scripts/db-grant-digimar-roles.sql MISSING — DIGIMAR roster can't access /marketing/*"

# Lock 7: SQL orphan reassignment ships in backend image (RC2 — defaultOwner fallback fix)
[ -f backend/scripts/db-reassign-orphan-tasks.sql ] \
  && ok "RC2: backend/scripts/db-reassign-orphan-tasks.sql exists for orphan-owned marketing_tasks" \
  || bad "RC2: backend/scripts/db-reassign-orphan-tasks.sql MISSING — Super Admin still owns seeded tasks"

# Lock 8: defaultOwner fallback filters by marketing role
grep -qE "roles:\s*\{\s*hasSome:\s*\['MARKETING'" backend/src/modules/marketing/canonical/canonical-marketing.service.ts \
  && ok "RC2: defaultOwner fallback in autoSeedMarketingTasks filters by marketing role" \
  || bad "RC2: defaultOwner fallback still picks any ACTIVE user (will grab Super Admin on prod)"

# Lock 9: no hardcoded brandId literals in frontend
if grep -rnE "brandId['\"]?\s*[:=]\s*['\"](toribio|dreamlab)['\"]" frontend/src/ 2>/dev/null; then
  bad "RC3: frontend hardcodes brandId='toribio'/'dreamlab' literal — must use UUID from useMarketingBrands()"
else
  ok "RC3: frontend uses no hardcoded brandId literal strings"
fi

# Lock 10: BrandWorkspace doesn't default slug to 'dreamlab'
if grep -nE "initialBrandSlug\s*=\s*['\"]dreamlab['\"]" \
     frontend/src/app/\(dashboard\)/marketing/reports/workspace/BrandWorkspace.tsx 2>/dev/null; then
  bad "BrandWorkspace default slug is 'dreamlab' — latent regression if caller forgets slug"
else
  ok "BrandWorkspace has no 'dreamlab' default slug (callers must pass explicitly)"
fi

# Lock 11: test-deploy-marketing.sh exists (RC1 — login as DIGIMAR, not admin)
[ -f scripts/test-deploy-marketing.sh ] \
  && ok "CI hardening: test-deploy-marketing.sh exists (logins as revita, asserts marketing endpoints)" \
  || bad "CI hardening: scripts/test-deploy-marketing.sh MISSING — smoke still uses admin@dreamlab.com"

echo ""
echo "  contracts: $PASS pass / $FAIL fail"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
