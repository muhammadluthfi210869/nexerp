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

echo "=== Step 1: prisma db push (sync schema without dropping data) ==="
npx prisma db push 2>&1
PUSH_EXIT=$?
echo "prisma db push exit code: $PUSH_EXIT"

if [ $PUSH_EXIT -ne 0 ]; then
  echo "ERROR: prisma db push failed! Retrying in 5 seconds..."
  sleep 5
  npx prisma db push 2>&1
  echo "Retry exit code: $?"
fi

echo "=== Step 2: Seed default users (only if empty) ==="
# Only seed if no users exist (idempotent seed)
USER_COUNT=$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.user.count().then(c => { console.log(c); prisma.\$disconnect(); });
" 2>/dev/null || echo "0")

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
  FINAL_COUNT=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.user.count().then(c => { console.log(c); prisma.\$disconnect(); });
  " 2>/dev/null || echo "0")
  echo "Users after seed: $FINAL_COUNT"
else
  echo "✅ $USER_COUNT users already exist, skipping seed."
fi

echo "=== Step 3: Starting NestJS ==="
exec node dist/main
