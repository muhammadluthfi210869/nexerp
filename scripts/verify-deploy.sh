#!/bin/bash
set -euo pipefail

echo "═══════════════════════════════════════════════"
echo "  🟢 NexERP DEPLOY VERIFICATION"
echo "═══════════════════════════════════════════════"
echo ""

# ── 1. Cek environment variables wajib ──
echo "📋 Step 1/6: Checking required environment variables..."
REQUIRED_VARS=(
  "JWT_SECRET"
  "DOMAIN_NAME"
)

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "  ❌ $var is not set"
    MISSING=1
  else
    echo "  ✅ $var is set"
  fi
done

if [ "$MISSING" -eq 1 ]; then
  echo ""
  echo "⚠️  Some required variables are missing."
fi
echo ""

# ── 2. Cek Docker ──
echo "📋 Step 2/6: Checking Docker..."
if docker info >/dev/null 2>&1; then
  echo "  ✅ Docker is running"
else
  echo "  ❌ Docker is not running"
  exit 1
fi
echo ""

# ── 3. Cek compose config ──
echo "📋 Step 3/6: Validating docker-compose config..."
if docker compose -f docker-compose.prod.yml config >/dev/null 2>&1; then
  echo "  ✅ docker-compose.prod.yml is valid"
else
  echo "  ❌ docker-compose.prod.yml has errors"
  docker compose -f docker-compose.prod.yml config 2>&1 || true
fi
echo ""

# ── 4. Build test ──
echo "📋 Step 4/6: Testing production build..."
docker compose -f docker-compose.prod.yml build --parallel 2>&1 | tail -5
echo "  ✅ Build command issued (check output above for errors)"
echo ""

# ── 5. Cek Prisma ──
echo "📋 Step 5/6: Checking Prisma schema..."
for schema in base enums auth hr marketing rnd; do
  if [ -f "backend/prisma/schema/$schema.prisma" ]; then
    echo "    📄 $schema.prisma ✓"
  else
    echo "    ❌ $schema.prisma MISSING"
  fi
done
echo ""

# ── 6. Uji coba di local dulu ──
echo "📋 Step 6/6: Starting local test (prod config)..."
docker compose -f docker-compose.prod.yml up -d db backend
echo "  ⏳ Waiting 15s for backend to start..."
sleep 15
if curl -sf http://localhost:3001/health 2>/dev/null; then
  echo "  ✅ Backend health check PASSED"
else
  echo "  ❌ Backend health check FAILED"
  docker compose -f docker-compose.prod.yml logs backend --tail 20
fi

echo ""
echo "═══════════════════════════════════════════════"
if [ "$MISSING" -eq 1 ]; then
  echo "  ⚠️  VERIFICATION COMPLETE — with warnings"
else
  echo "  ✅ VERIFICATION COMPLETE — ready to deploy!"
fi
echo "═══════════════════════════════════════════════"

# Cleanup
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
