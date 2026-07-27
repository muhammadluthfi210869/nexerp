#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NexERP Deploy — Satu perintah, langsung jadi
# ═══════════════════════════════════════════════════════════════
#  Cara pakai di SERVER:
#    cd /opt/nexerp
#    git pull
#    bash scripts/deploy.sh
#
#  Prinsip: file docker-compose.yml IDENTIK dengan lokal,
#  jadi apa yang berhasil di lokal PASTI berhasil di server.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

echo ""
echo "═══════════════════════════════════════════════════"
echo "  🚀 NEXERP DEPLOY"
echo "  $(date)"
echo "═══════════════════════════════════════════════════"

# ── 1. Cek .env ──
if [ ! -f .env ]; then
  echo "❌ File .env tidak ditemukan!"
  echo "   Copy dari .env.production.example:"
  echo "   cp .env.production.example .env"
  echo "   lalu isi JWT_SECRET dan nilai lainnya."
  exit 1
fi

# ── 2. Backup database ──
echo ""
echo "📦 Backup database..."
mkdir -p backups
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i 'db\|postgres' | head -1 || echo "")
if [ -n "$DB_CONTAINER" ] && docker exec "$DB_CONTAINER" pg_isready -U erp_user &>/dev/null; then
  BACKUP_FILE="backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql"
  docker exec "$DB_CONTAINER" pg_dumpall -U erp_user > "$BACKUP_FILE" 2>/dev/null && \
    echo "  ✅ Backup: $BACKUP_FILE ($(wc -c < "$BACKUP_FILE") bytes)" || \
    echo "  ⚠️  Backup gagal (lanjut deploy)"
else
  echo "  ⚠️  Tidak ada DB container yang berjalan (fresh deploy)"
fi

# ── 3. Pull code terbaru (sudah dilakukan sebelumnya via git pull) ──

# ── 4. Build & Deploy ──
echo ""
echo "🏗️  Build & Deploy..."
docker compose --profile server up -d --build

# ── 5. Health Check ──
echo ""
echo "⏳ Health check (max 60 detik)..."
BACKEND_PORT=${BACKEND_PORT:-3001}
HEALTHY=false
for i in $(seq 1 30); do
  sleep 2
  HEALTH=$(curl -sf http://localhost:$BACKEND_PORT/health 2>/dev/null || echo "FAIL")
  if [ "$HEALTH" != "FAIL" ]; then
    HEALTHY=true
    echo "  ✅ Backend sehat!"
    break
  fi
done

if [ "$HEALTHY" != "true" ]; then
  echo "  ❌ Health check gagal! Cek log:"
  docker compose logs --tail 30 backend
  echo ""
  echo "  ⚠️  Deploy mungkin gagal. Jalankan:"
  echo "     docker compose logs -f"
  exit 1
fi

# ── 6. Cleanup ──
echo ""
echo "🧹 Cleanup..."
docker image prune -f --filter "until=24h" 2>/dev/null || true
ls -t backups/*.sql 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true

# ── 7. Selesai ──
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ DEPLOY BERHASIL!"
echo "  📅 $(date)"
echo "═══════════════════════════════════════════════════"
