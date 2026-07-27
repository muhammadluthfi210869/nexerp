#!/bin/bash
# ═══════════════════════════════════════════════════════
#  NexERP Deploy Integration Test
#  Jalanin BEFORE deploy ke server.
#  Bisa jalan di lokal (dengan container running) dan di CI.
# ═══════════════════════════════════════════════════════
set -euo pipefail

BASE_URL="${1:-http://localhost:3001}"
PASS=0
FAIL=0

green() { echo "  ✅ $1"; }
red() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo ""
echo "═══════════════════════════════════════════════════"
echo "  🩺 NEXERP INTEGRATION TEST"
echo "  Target: $BASE_URL"
echo "═══════════════════════════════════════════════════"
echo ""

# ── 1. Health Check ──────────────────────────────────
echo "📋 Test 1/6: Health Endpoint"
HEALTH=$(curl -sf "$BASE_URL/health" 2>/dev/null || echo "FAIL")
if [ "$HEALTH" != "FAIL" ]; then
  green "GET /health → $HEALTH"
  PASS=$((PASS+1))
else
  red "GET /health → no response"
fi

# ── 2. CORS Headers ──────────────────────────────────
echo "📋 Test 2/6: CORS Headers"
CORS=$(curl -s -I -X OPTIONS "$BASE_URL/health" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS" ]; then
  green "CORS headers present: $(echo $CORS | tr -d '\r')"
  PASS=$((PASS+1))
else
  red "CORS headers MISSING (akan kena CORS error di browser!)"
fi

# ── 3. Login API ─────────────────────────────────────
echo "📋 Test 3/6: Login Endpoint"
LOGIN=$(curl -sf -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexerp.id","password":"password123"}' 2>/dev/null || echo "FAIL")
if [ "$LOGIN" != "FAIL" ]; then
  TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")
  if [ -n "$TOKEN" ]; then
    green "POST /auth/login → access_token received ✓"
    PASS=$((PASS+1))
  else
    red "POST /auth/login → response without token"
  fi
else
  red "POST /auth/login → no response (possible DB issue?)"
fi

# ── 4. Protected Endpoint ────────────────────────────
echo "📋 Test 4/6: Protected Endpoint (Auth Guard)"
if [ -n "${TOKEN:-}" ]; then
  PROFILE=$(curl -sf "$BASE_URL/auth/profile" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "FAIL")
  if [ "$PROFILE" != "FAIL" ]; then
    green "GET /auth/profile → authenticated ✓"
    PASS=$((PASS+1))
  else
    red "GET /auth/profile → failed with valid token"
  fi
else
  red "GET /auth/profile → skipped (no token from previous test)"
fi

# ── 5. Unauthenticated Access ────────────────────────
echo "📋 Test 5/6: Unauthenticated Access (should 401)"
UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/profile" 2>/dev/null || echo "000")
if [ "$UNAUTH" = "401" ]; then
  green "GET /auth/profile (no token) → 401 Unauthorized ✓"
  PASS=$((PASS+1))
else
  red "GET /auth/profile (no token) → $UNAUTH (should be 401!)"
fi

# ── 6. API Root ──────────────────────────────────────
echo "📋 Test 6/6: API Root"
ROOT=$(curl -sf "$BASE_URL/" 2>/dev/null || echo "FAIL")
if [ "$ROOT" != "FAIL" ]; then
  green "GET / → responds ✓"
  PASS=$((PASS+1))
else
  red "GET / → no response"
fi

# ── Summary ──────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  📊 RESULTS: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "⚠️  $FAIL test(s) FAILED. Fix issues before deploying!"
  exit 1
else
  echo "  ✅ ALL TESTS PASSED — Ready to deploy!"
fi
echo ""
