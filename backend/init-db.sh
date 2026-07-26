#!/bin/sh
set -e

echo "=== 🟢 PRODUCTION-LIGHT INIT-DB ==="
echo "DATABASE_URL is: ${DATABASE_URL:-(NOT SET!)}"

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

if [ "$USER_COUNT" = "0" ]; then
  echo "No users found, running seed..."
  node dist/prisma/seed.js 2>&1 || echo "⚠️ Seed failed (non-fatal, app will still start)"
else
  echo "✅ $USER_COUNT users already exist, skipping seed."
fi

echo "=== Step 3: Starting NestJS ==="
exec node dist/main
