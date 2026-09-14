#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NexERP — Setup Sistem 2: Dreamlab Lead DB (round-robin website)
#  Jalankan SETELAH migrate-to-biznet.sh (file lead sudah di-transfer)
#  dan SETELAH deploy-biznet.sh (pilihan, bisa urut terpisah).
#  Cara pakai (di Biznet):
#    cd ~/dreamlab-lead
#    bash scripts/setup-lead.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

LEAD_DIR="$HOME/dreamlab-lead"
cd "$LEAD_DIR"

echo "═══════════════════════════════════════"
echo "  🚀 SETUP DREAMLAB-LEAD DI BIZNET"
echo "═══════════════════════════════════════"

# ── 0. Pastikan file penting ada ──
[ -f docker-compose-lead.yml ] || { echo "❌ docker-compose-lead.yml tidak ada — jalankan migrate dulu"; exit 1; }
[ -f .env ] || { echo "❌ .env tidak ada"; exit 1; }
echo "✅ Compose + .env ditemukan"

# ── 1. Start stack lead (postgres:17 + pgbouncer) ──
echo "▶ Start postgres:17 + pgbouncer..."
sudo docker compose -p dreamlab-lead -f docker-compose-lead.yml up -d

# ── 2. Restore DB lead (hanya kalau DB masih kosong) ──
if [ -f backups/migration-lead.sql ]; then
  TABLE_COUNT=$(sudo docker exec dreamlab-lead-db-lead-1 psql -U dreamlab1 -d dreamlab -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "ERR")
  echo "  Tabel saat ini: $TABLE_COUNT"
  if [ "$TABLE_COUNT" = "0" ] || [ "$TABLE_COUNT" = "ERR" ]; then
    echo "▶ Restore DB lead dari backups/migration-lead.sql..."
    sudo docker exec -i dreamlab-lead-db-lead-1 psql -U dreamlab1 -d dreamlab < backups/migration-lead.sql
    echo "  ✅ Restore DB lead selesai"
  else
    echo "  ℹ️ DB lead sudah berisi data — SKIP restore"
  fi
else
  echo "  ℹ️ backups/migration-lead.sql tidak ditemukan — SKIP restore"
fi

# ── 3. Verifikasi ──
echo ""
echo "  Container lead:"
sudo docker compose -p dreamlab-lead -f docker-compose-lead.yml ps --format "  {{.Name}} | {{.Status}}"
BIZNET_IP_FULL=$(hostname -I 2>/dev/null | awk '{print $1}')
echo ""
echo "═══════════════════════════════════════"
echo "  ✅ SETUP LEAD SELESAI"
echo ""
echo "  ⏭️  LANGKAH CUTOVER (di dashboard Vercel):"
echo "  Ubah Environment Variable DATABASE_URL menjadi:"
echo "  postgresql://dreamlab1:<PASSWORD>@${BIZNET_IP_FULL}:6432/dreamlab?sslmode=require"
echo ""
echo "  ⚠️  PASSWORD = LEAD_DB_PASSWORD di ~/dreamlab-lead/.env"
echo "  ⚠️  Pastikan port 6432 tidak diblokir firewall Biznet"
echo "═══════════════════════════════════════"
