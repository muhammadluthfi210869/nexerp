#!/bin/sh
set -e

echo "=== INIT-DB STARTING ==="
echo "DATABASE_URL is: ${DATABASE_URL:-(NOT SET!)}"

# Wait for db container to be reachable. Up to 30s with healthcheck retry.
echo "Waiting for database to be ready (up to 30s)..."
ATTEMPTS=0
MAX_ATTEMPTS=15
until node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.end()).catch(() => process.exit(1));
" 2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo "ERROR: Database not reachable after ${MAX_ATTEMPTS} attempts"
    exit 1
  fi
  echo "  attempt $ATTEMPTS/$MAX_ATTEMPTS failed, retrying in 2s..."
  sleep 2
done
echo "Database ready."

echo ""
echo "=== Step 1: Apply migrations ==="
echo "Running 'prisma migrate deploy' (idempotent, fail-fast on schema mismatch)..."
npx prisma migrate deploy 2>&1
MIGRATE_EXIT=$?
echo "prisma migrate deploy exit code: $MIGRATE_EXIT"

if [ $MIGRATE_EXIT -ne 0 ]; then
  echo "============================================="
  echo "ERROR: prisma migrate deploy FAILED (exit $MIGRATE_EXIT)"
  echo "DO NOT start the app with an un-migrated schema."
  echo "Common causes:"
  echo "  - Schema drift between code and DB (run 'prisma migrate dev' locally, commit migration, rebuild)"
  echo "  - Missing migration files"
  echo "  - Database connectivity (already verified above)"
  echo "============================================="
  exit 1
fi

echo ""
echo "=== Step 2: Master Seed (explicit opt-in only) ==="
if [ "${RUN_MASTER_SEED:-false}" != "true" ]; then
  echo "Skipping master seed. Set RUN_MASTER_SEED=true only for an intentional bootstrap."
elif [ -f "dist/prisma/seed-master.js" ]; then
  echo "Running master seed..."
  if ! node dist/prisma/seed-master.js 2>&1; then
    echo "WARNING: Master seed failed (continuing — production data may be missing)"
  fi
elif [ -f "dist/prisma/seed.js" ]; then
  echo "Running prisma seed..."
  if ! node dist/prisma/seed.js 2>&1; then
    echo "WARNING: prisma seed failed (continuing)"
  fi
else
  echo "No compiled seed found. Run 'npm run build' if seed expected."
fi

echo ""
echo "=== Step 3: Seed RND Data (idempotent — skips if data exists) ==="
if [ -f "docs/RND/clean-daily-tracking.json" ] && [ -f "dist/prisma/seed-rnd-data.js" ]; then
  RND_COUNT=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    async function check() {
      const prisma = new PrismaClient();
      try {
        const count = await prisma.rndDailyTask.count();
        process.stdout.write(String(count));
      } catch { process.stdout.write('0'); }
      finally { await prisma.\$disconnect(); }
    }
    check();
  " 2>/dev/null || echo "0")

  if [ "$RND_COUNT" -eq 0 ]; then
    echo "RND tables empty. Seeding RND data..."
    if ! node dist/prisma/seed-rnd-data.js 2>&1; then
      echo "WARNING: RND seed failed"
    fi
  else
    echo "RND data already exists ($RND_COUNT tasks), skipping."
  fi
else
  echo "RND seed prerequisites not found. Skipping."
fi

echo ""
echo "=== Step 4: Starting NestJS ==="
if [ -f "dist/src/main.js" ]; then
  exec node dist/src/main.js
elif [ -f "dist/main.js" ]; then
  exec node dist/main.js
else
  echo "ERROR: NestJS entrypoint not found in dist/ or dist/src/"
  exit 1
fi
