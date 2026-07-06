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
  echo "Re-applying e2e user upsert..."
  node -e "
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcrypt');
  async function seed() {
    const prisma = new PrismaClient();
    const hashed = await bcrypt.hash('password123', 10);
    const users = [
      { email: 'admin@nexerp.id', fullName: 'Admin', roles: ['SUPER_ADMIN'] },
      { email: 'irma@nexerp.id', fullName: 'Irma', roles: ['FINANCE', 'PURCHASING'] },
      { email: 'edi@nexerp.id', fullName: 'Edi', roles: ['RND'] },
    ];
    for (const u of users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: { passwordHash: hashed, roles: u.roles, status: 'ACTIVE' },
        create: { email: u.email, fullName: u.fullName, passwordHash: hashed, roles: u.roles, status: 'ACTIVE' },
      });
      console.log('  upserted:', u.email);
    }
    await prisma.\$disconnect();
    console.log('E2E users seeded.');
  }
  seed().catch(e => { console.error(e.message); process.exit(1); });
  " 2>&1 || echo "Seed failed"
elif [ -f "dist/prisma/seed-e2e-users.js" ]; then
  echo "Running compiled seed (dist/prisma/seed-e2e-users.js)..."
  node dist/prisma/seed-e2e-users.js 2>&1 || echo "Seed failed"
elif [ -f "dist/prisma/seed.js" ]; then
  echo "Running compiled seed (dist/prisma/seed.js)..."
  node dist/prisma/seed.js 2>&1 || echo "Seed failed"
else
  echo "Running prisma db seed..."
  npx prisma db seed 2>&1 || echo "Seed failed"
fi

echo "=== Step 3: Starting NestJS ==="
exec node dist/main
