#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Standalone DB snapshot (run before risky deploys)
# ═══════════════════════════════════════════════════════════════
#  Usage: bash scripts/db-snapshot.sh
#  Output: backups/snapshot-YYYYMMDD-HHMMSS.sql.gz
#
#  Run on VPS. Restoring:
#    gunzip -c backups/snapshot-XXX.sql.gz \
#      | sudo docker exec -i production-light-db-1 psql -U erp_user -d erp_database
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$BACKUP_DIR"

DB_CONTAINER="production-light-db-1"
DB_USER="erp_user"

OUT="$BACKUP_DIR/snapshot-$TS.sql"
echo "▶ Dumping $DB_CONTAINER to $OUT.gz..."
sudo docker exec "$DB_CONTAINER" pg_dumpall -U "$DB_USER" > "$OUT"
gzip "$OUT"

echo ""
echo "✅ $OUT.gz"
ls -lh "$OUT.gz"

# Auto-prune: keep last 10 snapshots
COUNT=$(ls -1 "$BACKUP_DIR"/snapshot-*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
if [ "$COUNT" -gt 10 ]; then
  PRUNE=$((COUNT - 10))
  ls -1t "$BACKUP_DIR"/snapshot-*.sql.gz | tail -n "$PRUNE" | xargs -I{} rm -f -- {}
  echo "🧹 Pruned $PRUNE old snapshot(s), keeping 10 newest"
fi

echo ""
echo "Recent snapshots:"
ls -lht "$BACKUP_DIR"/snapshot-*.sql.gz 2>/dev/null | head -5
