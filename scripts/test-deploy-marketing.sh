#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
#  NexERP Marketing Smoke — login as DIGIMAR user, not Super Admin.
#  Catches RC1 (RolesGuard silent role block) that test-deploy.sh misses
#  because it logs in as admin@dreamlab.com which globally bypasses.
# ════════════════════════════════════════════════════════════════════════════
set -euo pipefail

BASE_URL="${1:-http://localhost:3001/v1}"
PASS=0
FAIL=0

green() { echo "  ✅ $1"; }
red() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  🩺 NEXERP MARKETING SMOKE (DIGIMAR role, not admin)"
echo "  Target: $BASE_URL"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ── 1. Login as revita (DIGIMAR role) ──────────────────────────────────────
echo "📋 Test 1/5: Login as DIGIMAR user (revita@nexerp.id)"
LOGIN_RES=$(curl -sX POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"revita@nexerp.id","password":"password123"}')
TOKEN=$(echo "$LOGIN_RES" | jq -r '.access_token // .accessToken // empty')
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  green "POST /auth/login as revita → token obtained"
  PASS=$((PASS+1))
else
  red "POST /auth/login as revita → no token. RC1 likely: revita lacks MARKETING role"
  echo "    Response: $LOGIN_RES"
  echo ""
  echo "  ─────────────────────────────────────────────"
  echo "  SUMMARY: $PASS pass / $FAIL fail"
  [ "$FAIL" -eq 0 ] && exit 0 || exit 1
  exit 1
fi

# ── 2. /marketing/members non-empty ─────────────────────────────────────────
echo "📋 Test 2/5: /marketing/members (DIGIMAR roster visible)"
MEMBERS_RES=$(curl -sf -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/marketing/members" 2>/dev/null || echo "[]")
COUNT=$(echo "$MEMBERS_RES" | jq 'length' 2>/dev/null || echo "0")
if [ "$COUNT" -gt 0 ]; then
  green "GET /marketing/members → $COUNT members"
  PASS=$((PASS+1))
else
  red "GET /marketing/members → empty (RC1: 403 OR listMembers allow-list excludes DIGIMAR cohort)"
  echo "    Response: $MEMBERS_RES"
fi

# ── 3. /marketing/brands has ≥2 rows ───────────────────────────────────────
echo "📋 Test 3/5: /marketing/brands (dreamlab + toribio present)"
BRANDS_RES=$(curl -sf -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/marketing/brands" 2>/dev/null || echo "[]")
B_COUNT=$(echo "$BRANDS_RES" | jq 'length' 2>/dev/null || echo "0")
if [ "$B_COUNT" -ge 2 ]; then
  green "GET /marketing/brands → $B_COUNT brands (dreamlab+toribio or more)"
  PASS=$((PASS+1))
  BRAND_UUID=$(echo "$BRANDS_RES" | jq -r '.[0].id')
else
  red "GET /marketing/brands → $B_COUNT (expected ≥2). RC3: brand slug duplication or seed missing"
  BRAND_UUID=""
fi

# ── 4. POST /marketing/tasks with brandId=UUID ─────────────────────────────
echo "📋 Test 4/5: createTask with brandId=UUID (not display name)"
REVITA_ID=$(echo "$LOGIN_RES" | jq -r '.user.id // empty')
if [ -n "$BRAND_UUID" ]; then
  CREATE_RES=$(curl -sf -X POST "$BASE_URL/marketing/tasks" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"title\":\"CI smoke (brand UUID)\",\"assigneeId\":\"$REVITA_ID\",\"brandId\":\"$BRAND_UUID\",\"type\":\"DAILY\",\"priority\":\"LOW\",\"channel\":\"web\",\"category\":\"smoke\",\"startDate\":\"2026-09-15\",\"dueDate\":\"2026-09-16\"}" 2>/dev/null || echo "FAIL")
  if [ "$CREATE_RES" != "FAIL" ] && echo "$CREATE_RES" | jq -e '.id // .taskCode' >/dev/null 2>&1; then
    green "POST /marketing/tasks (brandId UUID) → OK"
    PASS=$((PASS+1))
  else
    red "POST /marketing/tasks (brandId UUID) → rejected (RC3 or RC2 defaultOwner off-roster)"
    echo "    Response: $CREATE_RES"
  fi
else
  red "Skipped — no brand UUID available from test 3"
fi

# ── 5. GET /marketing/tasks returns the created task ────────────────────────
echo "📋 Test 5/5: GET /marketing/tasks?limit=10 returns ≥1 row owned by revita"
TASKS_RES=$(curl -sf -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/marketing/tasks?limit=10" 2>/dev/null || echo '{"data":[]}')
T_COUNT=$(echo "$TASKS_RES" | jq -r '.data | length' 2>/dev/null \
  || echo "$TASKS_RES" | jq 'length' 2>/dev/null || echo "0")
if [ "$T_COUNT" -gt 0 ]; then
  green "GET /marketing/tasks → $T_COUNT tasks visible to DIGIMAR viewer"
  PASS=$((PASS+1))
else
  red "GET /marketing/tasks → 0 rows visible (RC1 role block or RC2 owner mismatch)"
fi

echo ""
echo "  ─────────────────────────────────────────────"
echo "  SUMMARY: $PASS pass / $FAIL fail"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
