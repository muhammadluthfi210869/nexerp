#!/bin/sh
set -e

echo "=== INIT-DB STARTING ==="
echo "DATABASE_URL is: ${DATABASE_URL:-(NOT SET!)}"

echo "Waiting 8 seconds for database to be ready..."
sleep 8

echo "=== Step 1: prisma db push ==="
npx prisma db push --accept-data-loss 2>&1
PUSH_EXIT=$?
echo "prisma db push exit code: $PUSH_EXIT"

if [ $PUSH_EXIT -ne 0 ]; then
  echo "ERROR: prisma db push failed! Retrying in 5 seconds..."
  sleep 5
  npx prisma db push --accept-data-loss 2>&1
  echo "Retry exit code: $?"
fi

echo "=== Step 2: Master Seed ==="
echo "Running master seed (seed-master.js)..."
if [ -f "dist/prisma/seed-master.js" ]; then
  node dist/prisma/seed-master.js 2>&1 || echo "Master seed failed"
else
  echo "WARNING: seed-master.js not found. Running prisma db seed as fallback..."
  npx prisma db seed 2>&1 || echo "Seed failed"
fi

echo "=== Step 3: Seed RND Data (if JSON files exist) ==="
if [ -f "docs/RND/clean-daily-tracking.json" ] && [ -f "dist/prisma/seed-rnd-data.js" ]; then
  RND_COUNT=$(node -e "
  const { PrismaClient } = require('@prisma/client');
  async function check() {
    const prisma = new PrismaClient();
    try {
      const count = await prisma.rndDailyTask.count();
      console.log(count);
    } catch { console.log('0'); }
    finally { await prisma.\$disconnect(); }
  }
  check();
  " 2>/dev/null || echo "0")

  if [ "$RND_COUNT" -eq 0 ]; then
    echo "RND tables empty. Seeding RND data..."
    node dist/prisma/seed-rnd-data.js 2>&1 || echo "RND seed failed"
  else
    echo "RND data already exists ($RND_COUNT tasks), skipping RND seed."
  fi
else
  echo "RND seed files not found. Skipping RND seed."
fi

echo "=== Step 4: Starting NestJS ==="
exec node dist/main
