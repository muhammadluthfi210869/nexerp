#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NexERP — Deploy ERP di Biznet (TANPA --build, anti-OOM di RAM 4GB)
#  Jalankan SETELAH migrate-to-biznet.sh selesai (file sudah di-transfer).
#  Cara pakai (di Biznet, setelah migrate):
#    cd ~/nexerp
#    bash scripts/deploy-biznet.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="$HOME/nexerp"
cd "$PROJECT_DIR"

echo "═══════════════════════════════════════"
echo "  🚀 DEPLOY ERP DI BIZNET (tanpa build)"
echo "═══════════════════════════════════════"

# ── 0. Pastikan .env ada ──
[ -f .env ] || { echo "❌ .env tidak ada — jalankan migrate-to-biznet.sh dulu"; exit 1; }
echo "✅ .env ditemukan"

# ── 1. Start database saja dulu ──
echo "▶ Start database..."
sudo docker compose -p production-light up -d db
echo "  ⏳ Tunggu DB siap (max 60 detik)..."
DB_OK=false
for i in $(seq 1 30); do
  if sudo docker exec production-light-db-1 pg_isready -U erp_user -d erp_database >/dev/null 2>&1; then
    DB_OK=true; echo "  ✅ DB siap"; break
  fi
  sleep 2
done
[ "$DB_OK" = "true" ] || { echo "❌ DB tidak siap. Cek: sudo docker logs production-light-db-1"; exit 1; }

# ── 2. Restore DB ERP (hanya kalau DB masih kosong) ──
if [ -f backups/migration-erp.sql ]; then
  TABLE_COUNT=$(sudo docker exec production-light-db-1 psql -U erp_user -d erp_database -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "ERR")
  echo "  Tabel saat ini: $TABLE_COUNT"
  if [ "$TABLE_COUNT" = "0" ] || [ "$TABLE_COUNT" = "ERR" ]; then
    echo "▶ Restore DB dari backups/migration-erp.sql..."
    sudo docker exec -i production-light-db-1 psql -U erp_user -d erp_database < backups/migration-erp.sql
    echo "  ✅ Restore DB ERP selesai"
  else
    echo "  ℹ️ DB sudah berisi data — SKIP restore (data aman)"
  fi
else
  echo "  ℹ️ backups/migration-erp.sql tidak ditemukan — SKIP restore"
fi

# ── 3. Up stack lengkap (tanpa --build, pakai image hasil transfer) ──
echo "▶ Start semua service (nginx, backend, frontend, certbot)..."
sudo docker compose -p production-light --profile server up -d
echo ""
echo "  Container yang berjalan:"
sudo docker compose -p production-light ps --format "  {{.Name}} | {{.Status}}"

# ── 4. Cron reload nginx (sama seperti Hetzner) ──
CRON=/etc/cron.d/nexerp-nginx-reload
if [ ! -f "$CRON" ]; then
  echo "▶ Buat cron nginx reload..."
  printf 'SHELL=/bin/bash\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n0 */6 * * * root docker exec production-light-nginx-1 nginx -s reload >/dev/null 2>&1 || true\n' | sudo tee "$CRON" >/dev/null
  echo "  ✅ Cron dibuat: $CRON"
else
  echo "  ℹ️ Cron sudah ada"
fi

# ── 5. Health check ──
echo "▶ Health check..."
sleep 5
BACKEND_HEALTH=$(curl -sf http://127.0.0.1:3001/health 2>/dev/null && echo OK || echo FAIL)
FRONTEND_HTTP=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 2>/dev/null || echo FAIL)
echo "  Backend /health : $BACKEND_HEALTH"
echo "  Frontend HTTP   : $FRONTEND_HTTP"

echo ""
echo "═══════════════════════════════════════"
echo "  ✅ DEPLOY ERP SELESAI"
echo "  Berikutnya di Biznet:"
echo "    bash scripts/setup-lead.sh"
echo "═══════════════════════════════════════"
