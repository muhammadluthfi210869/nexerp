#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  DISASTER RECOVERY DRILL — run ON THE VPS
# ═══════════════════════════════════════════════════════════════
#  Usage:
#    bash scripts/dr-drill.sh [backup-file]
#    (default backup: newest backups/snapshot-*.sql.gz)
#
#  Rehearses, against the live containers:
#    1. snapshot present and non-empty
#    2. stack stopped            (docker compose, canonical file)
#    3. database dropped + recreated
#    4. snapshot restored        (pg_dumpall plain SQL -> psql)
#    5. stack started again
#    6. backend health + row-count sanity
#
#  Canonical naming (single-branch, 2026-09): compose file is
#  docker-compose.yml, project `production-light`, backend on :3001.
#  This script previously pointed at a retired compose filename and a
#  retired backend port, so every drill failed from step 2 onward.
#  scripts/__tests__/p21-disaster-recovery.test.sh locks that regression.
#
#  Fail-closed: no step is swallowed, ON_ERROR_STOP=1 on the restore, and
#  any failed step exits non-zero. A drill that "passes" without restoring
#  is worse than no drill.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-production-light}"
DB_CONTAINER="${DB_CONTAINER:-${COMPOSE_PROJECT}-db-1}"
DB_USER="${DB_USER:-erp_user}"
DB_NAME="${DB_NAME:-erp_database}"
ADMIN_DB="${ADMIN_DB:-postgres}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/v1/health}"
RTO_LIMIT_S="${RTO_LIMIT_S:-900}"

LOG_DIR="${LOG_DIR:-/var/log/erp}"
mkdir -p "$LOG_DIR" 2>/dev/null || LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/dr-drill-$(date +%Y%m%d-%H%M).log"

START_TIME=$(date +%s)

log() { printf '%s\n' "$1" | tee -a "$LOG"; }

log "=== DISASTER RECOVERY DRILL $(date) ==="
log "compose: $COMPOSE_FILE  project: $COMPOSE_PROJECT  db: $DB_CONTAINER"
log ""

# ── PHASE 1: backup present ────────────────────────────────────
log "[1/6] Verifying backup..."
BACKUP_FILE="${1:-}"
if [ -z "$BACKUP_FILE" ]; then
  BACKUP_FILE="$(ls -1t backups/snapshot-*.sql.gz 2>/dev/null | head -1 || true)"
fi
if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  log "  FAIL: no snapshot found (run scripts/db-snapshot.sh first)"
  exit 1
fi
if [ ! -s "$BACKUP_FILE" ]; then
  log "  FAIL: snapshot $BACKUP_FILE is empty"
  exit 1
fi
BACKUP_SIZE=$(wc -c < "$BACKUP_FILE" | tr -d ' ')
log "  PASS: $BACKUP_FILE ($BACKUP_SIZE bytes)"

# ── PHASE 2: stop the stack ────────────────────────────────────
log "[2/6] Stopping services..."
docker compose -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" down 2>&1 | tee -a "$LOG"
log "  PASS: services stopped"

# ── PHASE 3: recreate the database ─────────────────────────────
RESTORE_START=$(date +%s)
log "[3/6] Recreating database $DB_NAME..."
sudo docker start "$DB_CONTAINER" >/dev/null 2>&1 || true
sudo docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$ADMIN_DB" -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" 2>&1 | tee -a "$LOG"
sudo docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$ADMIN_DB" -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"$DB_NAME\";" 2>&1 | tee -a "$LOG"
log "  PASS: database recreated"

# ── PHASE 4: restore ───────────────────────────────────────────
# The snapshot is `pg_dumpall` plain SQL, so it is replayed through psql —
# `pg_restore` only reads custom/tar/directory archives and would fail here.
log "[4/6] Restoring from $BACKUP_FILE..."
if gunzip -c "$BACKUP_FILE" | sudo docker exec -i "$DB_CONTAINER" \
     psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q 2>&1 | tee -a "$LOG"; then
  RESTORE_END=$(date +%s)
  log "  PASS: restore completed in $((RESTORE_END - RESTORE_START))s"
else
  log "  FAIL: restore failed — see $LOG"
  exit 1
fi

# ── PHASE 5: start the stack ───────────────────────────────────
log "[5/6] Starting services..."
docker compose -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" up -d 2>&1 | tee -a "$LOG"
log "  PASS: services started"

# ── PHASE 6: health + data sanity ──────────────────────────────
log "[6/6] Running smoke test..."
HEALTH=""
for _ in $(seq 1 30); do
  HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
  [ "$HEALTH" = "200" ] && break
  sleep 4
done
if [ "$HEALTH" != "200" ]; then
  log "  FAIL: health check returned ${HEALTH:-no-response} at $HEALTH_URL"
  exit 1
fi
log "  PASS: health check (HTTP $HEALTH)"

TABLES=$(sudo docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -At \
  -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")
ROWS=$(sudo docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -At \
  -c "SELECT COALESCE(sum(n_live_tup), 0) FROM pg_stat_user_tables;")
log "  PASS: $TABLES tables present, ~$ROWS rows restored"

if [ "$TABLES" -lt 50 ]; then
  log "  FAIL: only $TABLES tables — restore looks partial"
  exit 1
fi

END_TIME=$(date +%s)
RTO=$((END_TIME - START_TIME))
log ""
log "============================================"
log "  DISASTER RECOVERY DRILL COMPLETE"
log "  Total time (RTO): ${RTO}s   (budget ${RTO_LIMIT_S}s)"
log "  Restore time:     $((RESTORE_END - RESTORE_START))s"
log "  Log: $LOG"
log "============================================"

if [ "$RTO" -gt "$RTO_LIMIT_S" ]; then
  log "  FAIL: RTO ${RTO}s exceeds budget ${RTO_LIMIT_S}s"
  exit 1
fi

exit 0
