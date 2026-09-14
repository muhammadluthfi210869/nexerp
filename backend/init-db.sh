#!/bin/sh
set -e

echo "=== 🟢 PRODUCTION-LIGHT INIT-DB ==="
echo "DATABASE_URL is: ${DATABASE_URL:-(NOT SET!)}"

# ── Create persistent data directories ──
echo "=== Step 0: Creating data directories ==="
mkdir -p /app/data
chmod 755 /app/data
echo "✅ /app/data/ ready"

echo "Waiting 8 seconds for database to be ready..."
sleep 8

echo "=== Step 1: prisma db push (idempotent: skip if drift already known) ==="
DRIFT_MARKER="/app/data/.schema-drift-acknowledged"

if [ -f "$DRIFT_MARKER" ]; then
  echo "⏭️  Drift marker present at $DRIFT_MARKER — skipping db push (idempotent restart)"
else
  echo "Running prisma db push (first start or after operator cleared marker)..."
  npx prisma db push --accept-data-loss 2>&1
  PUSH_EXIT=$?
  echo "prisma db push exit code: $PUSH_EXIT"

  if [ $PUSH_EXIT -ne 0 ]; then
    # Data-loss blocked (e.g. wholesale-merge-era schema drifted from production-light
    # code: SOURCE_OVERRIDE enum can't be dropped because other tables depend on it).
    # Acknowledge drift so subsequent restarts skip this destructive op and the
    # container can start serving traffic from the existing schema.
    echo "⚠️  db push blocked by existing data (data-loss guard)."
    echo "   Persisting $DRIFT_MARKER so restarts stay idempotent."
    mkdir -p /app/data
    echo "skip db push: schema drift acknowledged $(date -Iseconds)" > "$DRIFT_MARKER"
  else
    echo "✅ prisma db push succeeded"
  fi
fi

echo "=== Step 2: Seed default users (only if empty) ==="
# Prisma v7 WAJIB driver adapter (new PrismaClient() polos akan error & count selalu 0,
# sehingga seed selalu jalan & men-truncate data produksi). Helper ini memakai
# adapter yang sama dengan aplikasi/seed.ts → count akurat → seed di-skip saat ada users.
COUNT_USERS() {
  node << 'NODEEOF'
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
prisma.user.count().then(c => { console.log(c); return prisma.$disconnect(); }).catch(e => { console.error('COUNT_ERROR: ' + e.message); process.exit(1); });
NODEEOF
}

# Only seed if no users exist (idempotent seed)
USER_COUNT=$(COUNT_USERS 2>/dev/null || echo "0")

echo "Current user count: $USER_COUNT"

if [ "$USER_COUNT" = "0" ]; then
  echo "No users found, running seed..."

  SEED_PATH=""
  if [ -f dist/prisma/seed.js ]; then
    SEED_PATH="dist/prisma/seed.js"
  elif [ -f dist/seed.js ]; then
    SEED_PATH="dist/seed.js"
  fi

  if [ -n "$SEED_PATH" ]; then
    echo "Found seed at $SEED_PATH, executing..."
    node "$SEED_PATH" 2>&1 || {
      echo "❌ Seed via $SEED_PATH failed!"
      echo "Trying prisma db seed as fallback..."
      npx prisma db seed 2>&1 || echo "❌ prisma db seed also failed. Database has no users."
    }
  else
    echo "⚠️ Seed file not found (tried dist/prisma/seed.js, dist/seed.js). Trying prisma db seed..."
    npx prisma db seed 2>&1 || echo "❌ prisma db seed failed. Database has no users."
  fi

  # Verify seed result
  FINAL_COUNT=$(COUNT_USERS 2>/dev/null || echo "0")
  echo "Users after seed: $FINAL_COUNT"
else
  echo "✅ $USER_COUNT users already exist, skipping seed."
fi

echo "=== Step 3: Starting NestJS ==="
exec node dist/main
