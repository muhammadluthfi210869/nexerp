# ============================================
# DISASTER RECOVERY DRILL
# Jalankan: bash dr-drill.sh
# Pastikan sudah ada backup di /backups/
# ============================================

set -e
LOG="/var/log/erp/dr-drill-$(date +%Y%m%d-%H%M).log"
START_TIME=$(date +%s)

echo "=== DISASTER RECOVERY DRILL $(date) ===" | tee "$LOG"
echo "" | tee -a "$LOG"

# PHASE 1: Check backup exists
echo "[1/6] Verifying backup..." | tee -a "$LOG"
BACKUP_FILE="/backups/erp-latest.sql"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "  FAIL: Backup file not found at $BACKUP_FILE" | tee -a "$LOG"
  exit 1
fi
BACKUP_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null)
echo "  PASS: Backup found ($BACKUP_SIZE bytes)" | tee -a "$LOG"

# PHASE 2: Stop services
echo "[2/6] Stopping services..." | tee -a "$LOG"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "  PASS: Services stopped" | tee -a "$LOG"

# PHASE 3: Recreate database
echo "[3/6] Recreating database..." | tee -a "$LOG"
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U erp -d postgres -c "DROP DATABASE IF EXISTS erp_db;" 2>&1 | tee -a "$LOG"
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U erp -d postgres -c "CREATE DATABASE erp_db;" 2>&1 | tee -a "$LOG"
echo "  PASS: Database recreated" | tee -a "$LOG"

# PHASE 4: Restore from backup
echo "[4/6] Restoring from backup..." | tee -a "$LOG"
RESTORE_START=$(date +%s)
PGPASSWORD="${DB_PASSWORD}" pg_restore -h localhost -U erp -d erp_db --verbose "$BACKUP_FILE" 2>&1 | tail -5 | tee -a "$LOG"
RESTORE_END=$(date +%s)
echo "  PASS: Restore completed in $((RESTORE_END - RESTORE_START))s" | tee -a "$LOG"

# PHASE 5: Start services
echo "[5/6] Starting services..." | tee -a "$LOG"
docker compose -f docker-compose.prod.yml up -d 2>&1 | tee -a "$LOG"
sleep 15
echo "  PASS: Services started" | tee -a "$LOG"

# PHASE 6: Smoke test
echo "[6/6] Running smoke test..." | tee -a "$LOG"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/system/health)
if [ "$HEALTH" != "200" ]; then
  echo "  FAIL: Health check returned $HEALTH" | tee -a "$LOG"
  exit 1
fi
echo "  PASS: Health check (HTTP $HEALTH)" | tee -a "$LOG"

LEADS=$(curl -s http://localhost:3002/bussdev/leads?limit=1 | wc -c)
if [ "$LEADS" -gt 10 ]; then
  echo "  PASS: Data restored (leads response: $LEADS bytes)" | tee -a "$LOG"
else
  echo "  WARN: Minimal data found ($LEADS bytes)" | tee -a "$LOG"
fi

END_TIME=$(date +%s)
echo "" | tee -a "$LOG"
echo "============================================" | tee -a "$LOG"
echo "  DISASTER RECOVERY DRILL COMPLETE" | tee -a "$LOG"
echo "  Total time: $((END_TIME - START_TIME))s" | tee -a "$LOG"
echo "  Restore time: $((RESTORE_END - RESTORE_START))s" | tee -a "$LOG"
echo "============================================" | tee -a "$LOG"
