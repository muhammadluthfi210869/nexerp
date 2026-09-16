#!/bin/bash
# =============================================
# Daily ERP Reconciliation & Health Check
# Deploy: sudo cp daily-reconcile.sh /etc/cron.daily/erp-reconcile
# Crontab: 0 6 * * * root /scripts/daily-reconcile.sh
# =============================================

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-erp_db}"
DB_USER="${DB_USER:-erp}"
DB_PASS="${DB_PASS:-}"
API_URL="${API_URL:-http://localhost:3002}"
AUTH_EMAIL="${AUTH_EMAIL:-admin@nexerp.id}"
AUTH_PASS="${AUTH_PASS:-password123}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"  # Optional: Slack/Teams webhook

LOG_DIR="/var/log/erp"
LOG_FILE="$LOG_DIR/reconcile-$(date +%Y%m%d).log"
mkdir -p "$LOG_DIR"

echo "=== ERP Daily Reconciliation $(date) ===" | tee "$LOG_FILE"

# 1. Health Check
echo "[1/5] Health check..." | tee -a "$LOG_FILE"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/system/health" 2>/dev/null)
if [ "$HEALTH" = "200" ]; then
  echo "  PASS: Health check (HTTP $HEALTH)" | tee -a "$LOG_FILE"
else
  echo "  FAIL: Health check (HTTP $HEALTH)" | tee -a "$LOG_FILE"
  curl -s -X POST "$ALERT_WEBHOOK" -d '{"text":"ERP Health check FAILED"}' 2>/dev/null
fi

# 2. Auth Check
echo "[2/5] Auth check..." | tee -a "$LOG_FILE"
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$AUTH_EMAIL\",\"password\":\"$AUTH_PASS\"}" | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
if [ -n "$TOKEN" ]; then
  echo "  PASS: Auth OK" | tee -a "$LOG_FILE"
else
  echo "  FAIL: Auth failed" | tee -a "$LOG_FILE"
fi

AUTH="Authorization: Bearer $TOKEN"

# 3. API Smoke Test
echo "[3/5] API smoke test..." | tee -a "$LOG_FILE"
LEADS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$API_URL/bussdev/leads?limit=1" 2>/dev/null)
MATERIALS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$API_URL/master/materials?limit=1" 2>/dev/null)
echo "  Leads: HTTP $LEADS | Materials: HTTP $MATERIALS" | tee -a "$LOG_FILE"

# 4. Database Reconciliation (if psql available)
echo "[4/5] DB reconciliation..." | tee -a "$LOG_FILE"
if command -v psql &> /dev/null; then
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT CASE
      WHEN ROUND(SUM(debit)::numeric,2) = ROUND(SUM(credit)::numeric,2)
      THEN 'PASS: Trial Balance BALANCED'
      ELSE 'FAIL: Trial Balance UNBALANCED'
    END AS result
    FROM journal_entries WHERE deleted_at IS NULL;
  " 2>&1 | tee -a "$LOG_FILE"

  DISCREPANCIES=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT COUNT(*) FROM material_items m
    WHERE m.current_stock != COALESCE(
      (SELECT SUM(quantity) FROM inventory_transactions
       WHERE material_id = m.id AND type = 'INBOUND' AND deleted_at IS NULL), 0)
      - COALESCE(
      (SELECT SUM(quantity) FROM inventory_transactions
       WHERE material_id = m.id AND type = 'OUTBOUND' AND deleted_at IS NULL), 0)
      AND m.deleted_at IS NULL;
  " 2>/dev/null | tr -d ' ')

  echo "  Stock discrepancies: $DISCREPANCIES" | tee -a "$LOG_FILE"
else
  echo "  Skipped: psql not available" | tee -a "$LOG_FILE"
fi

# 5. Alert if issues found
echo "[5/5] Checking for alerts..." | tee -a "$LOG_FILE"
if grep -q "FAIL\|UNBALANCED\|discrepancies" "$LOG_FILE" 2>/dev/null; then
  echo "  ALERT: Issues detected!" | tee -a "$LOG_FILE"
  if [ -n "$ALERT_WEBHOOK" ]; then
    curl -s -X POST "$ALERT_WEBHOOK" -d "{\"text\":\"ERP Alert: Issues found in reconciliation - $(date)\"}" 2>/dev/null
  fi
else
  echo "  All systems nominal." | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "=== Done $(date) ===" | tee -a "$LOG_FILE"
