#!/bin/sh
echo "=== INIT-DB STARTING ==="
echo "DATABASE_URL is: ${DATABASE_URL:-(NOT SET!)}"

echo "Waiting 8 seconds for database to be ready..."
sleep 8

echo "=== Step 1: prisma db push ==="
npx prisma db push --accept-data-loss 2>&1
PUSH_EXIT=$?
echo "prisma db push exit code: $PUSH_EXIT"

if [ $PUSH_EXIT -ne 0 ]; then
  echo "ERROR: prisma db push failed! Tables were NOT created."
  echo "Trying again in 5 seconds..."
  sleep 5
  npx prisma db push --accept-data-loss 2>&1
  echo "Retry exit code: $?"
fi

# Check if database already has data (production guard)
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
async function check() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    console.log(count);
  } finally {
    await prisma.\$disconnect();
  }
}
check().catch(() => console.log('0'));
" 2>/dev/null || echo "0")

echo "=== Step 2: Seeding ==="
if [ "$USER_COUNT" -gt 0 ]; then
  echo "Data already exists ($USER_COUNT users), skipping seed."
elif [ -f "dist/prisma/seed.js" ]; then
  echo "Running compiled seed (dist/prisma/seed.js)..."
  node dist/prisma/seed.js 2>&1 || echo "Seed failed"
else
  echo "Running prisma db seed..."
  npx prisma db seed 2>&1 || echo "Seed failed"
fi

echo "=== Step 3: Starting NestJS ==="
exec node dist/src/main
