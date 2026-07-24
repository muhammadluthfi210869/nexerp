#!/bin/sh
set -e

echo "=== 🟢 PRODUCTION-LIGHT INIT-DB ==="
echo "DATABASE_URL is: ${DATABASE_URL:-(NOT SET!)}"

echo "Waiting 8 seconds for database to be ready..."
sleep 8

echo "=== Step 1: prisma db push (create/migrate tables) ==="
npx prisma db push --accept-data-loss 2>&1
PUSH_EXIT=$?
echo "prisma db push exit code: $PUSH_EXIT"

if [ $PUSH_EXIT -ne 0 ]; then
  echo "ERROR: prisma db push failed! Retrying in 5 seconds..."
  sleep 5
  npx prisma db push --accept-data-loss 2>&1
  echo "Retry exit code: $?"
fi

echo "=== Step 2: Seed default users ==="
npx prisma db seed 2>&1 || echo "⚠️ Seed failed (non-fatal, app will still start)"

echo "=== Step 3: Starting NestJS ==="
exec node dist/main
