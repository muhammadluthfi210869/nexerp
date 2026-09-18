#!/bin/sh
set -e

echo "=== 🟢 NEXERP INIT-DB (consolidated main) ==="
echo "DATABASE_URL is: ${DATABASE_URL:-(NOT SET!)}"

# ── Create persistent data directories ──
mkdir -p /app/data
chmod 755 /app/data

echo "Waiting 8 seconds for database to be ready..."
sleep 8

echo "=== Step 1: prisma migrate deploy (canonical, idempotent) ==="
# Policy (Phase P04 canonical migration standard):
#   1. Execute `prisma migrate deploy` to safely apply pending migrations.
#   2. Unmanaged schema sync or unsafe data-loss bypass is forbidden.
#   3. On failure, log loudly and persist drift marker so container avoids boot-looping.
DRIFT_MARKER="/app/data/.schema-drift-acknowledged"

if [ -f "$DRIFT_MARKER" ]; then
  echo "🔴🔴🔴 🔔 SCHEMA DRIFT ACK MARKER PRESENT — migrate deploy SKIPPED this boot."
  echo "    Contents: $(cat "$DRIFT_MARKER")"
  echo "    ⚠️  DB schema may be OUT OF SYNC with code. Starting app anyway"
  echo "    (traffic > boot-loop). Operator MUST review and delete:"
  echo "    $DRIFT_MARKER"
else
  set +e
  npx prisma migrate deploy 2>&1
  MIGRATE_EXIT=$?
  set -e

  if [ $MIGRATE_EXIT -ne 0 ]; then
    echo "⚠️  prisma migrate deploy failed (exit code $MIGRATE_EXIT). Writing drift marker."
    echo "migration-failed $(date -Iseconds): exit code $MIGRATE_EXIT" > "$DRIFT_MARKER"
  else
    echo "✅ prisma migrate deploy succeeded"
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

  FINAL_COUNT=$(COUNT_USERS 2>/dev/null || echo "0")
  echo "Users after seed: $FINAL_COUNT"
else
  echo "✅ $USER_COUNT users already exist, skipping seed."
fi

echo "=== Step 2.5: Apply idempotent role grants + orphan reassignment (RC1/RC2 fix) ==="
# These scripts grant MARKETING+DIGIMAR roles to the 5-user DIGIMAR roster
# and reassign tasks previously owned by non-marketing users (e.g. Super Admin
# picked by defaultOwner fallback). Both are idempotent: safe on every boot.
RUN_SQL_FILE() {
  node << NODEEOF
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const sql = fs.readFileSync(process.argv[1], 'utf8');
prisma.$executeRawUnsafe(sql).then(r => { console.log('  result:', r); return prisma.$disconnect(); }).catch(e => { console.error('  SQL_ERROR:', e.message); process.exit(1); });
NODEEOF
}

if [ -f /app/scripts/db-grant-digimar-roles.sql ]; then
  echo "Applying scripts/db-grant-digimar-roles.sql..."
  RUN_SQL_FILE /app/scripts/db-grant-digimar-roles.sql 2>&1 \
    && echo "✅ role grants applied" \
    || echo "⚠️  role grants failed (continuing)"
fi
if [ -f /app/scripts/db-reassign-orphan-tasks.sql ]; then
  echo "Applying scripts/db-reassign-orphan-tasks.sql..."
  RUN_SQL_FILE /app/scripts/db-reassign-orphan-tasks.sql 2>&1 \
    && echo "✅ orphan tasks reassigned" \
    || echo "⚠️  orphan reassignment failed (continuing)"
fi

echo "=== Step 3: Starting NestJS ==="
exec node dist/main
