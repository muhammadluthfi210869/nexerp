#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NexERP Deploy — pull image GHCR, tanpa build di VPS
# ═══════════════════════════════════════════════════════════════
#  Cara pakai di SERVER (VPS Biznet):
#    cd /home/dreamlab/nexerp
#    git pull --ff-only origin main          # compose/nginx/scripts terbaru
#    bash scripts/deploy.sh                  # deploy :latest
#    bash scripts/deploy.sh <git-sha>        # deploy SHA tertentu
#
#  Image dibangun CI (GitHub Actions) → ghcr.io/muhammadluthfi210869/
#  nexerp/{backend,frontend}:<sha>. VPS hanya pull → up -d.
#  Rollback: bash scripts/rollback.sh <sha>
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

DEPLOY_SHA="${1:-latest}"
# Proyek compose LAMA diteruskan supaya volume postgres_data tidak berubah
# (rename project = volume baru = data hilang). Nama boleh diganti nanti
# lewat prosedur rebind volume yang terencana.
COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-production-light}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/v1/health}"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  🚀 NEXERP DEPLOY — $DEPLOY_SHA"
echo "  $(date)"
echo "═══════════════════════════════════════════════════"

# ── 1. Cek .env ──
if [ ! -f .env ]; then
  echo "❌ File .env tidak ditemukan! Copy dari .env.production.example dan isi."
  exit 1
fi

# ── 2. Backup database ──
echo "📦 Backup database..."
mkdir -p backups
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep "${COMPOSE_PROJECT}.*db" | head -1 || echo "")
if [ -n "$DB_CONTAINER" ] && docker exec "$DB_CONTAINER" pg_isready -U erp_user &>/dev/null; then
  BACKUP_FILE="backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql.gz"
  docker exec "$DB_CONTAINER" pg_dumpall -U erp_user | gzip > "$BACKUP_FILE" \
    && echo "  ✅ Backup: $BACKUP_FILE ($(wc -c < "$BACKUP_FILE") bytes)" \
    || echo "  ⚠️  Backup gagal (lanjut deploy)"
else
  echo "  ⚠️  Tidak ada DB container '${COMPOSE_PROJECT}-db' yang berjalan (fresh deploy?)"
fi

# ── 3. Pull image dari GHCR ──
echo ""
echo "📥 Pull image (tag: $DEPLOY_SHA)..."
echo "   (asumsi: 'docker login ghcr.io' sudah dilakukan SEKALI di VPS — lihat DEPLOY.md)"
export IMAGE_TAG="$DEPLOY_SHA"
docker compose -p "$COMPOSE_PROJECT" --profile server pull backend frontend
docker compose -p "$COMPOSE_PROJECT" config --quiet   # validasi compose + env

# ── 4. Up (tanpa build!) ──
echo ""
echo "🏗️  Restart services (image GHCR, tanpa build)..."
docker compose -p "$COMPOSE_PROJECT" --profile server up -d

# ── 5. Health gate ──
echo ""
echo "🩺 Health gate..."
OK=0
for i in $(seq 1 30); do
  sleep 2
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then OK=1; break; fi
done
if [ "$OK" -eq 1 ]; then
  echo "  ✅ Backend sehat setelah $((i * 2))s"
else
  echo "  ❌ Backend TIDAK sehat dalam 60s — cek log:"
  docker compose -p "$COMPOSE_PROJECT" logs --tail 40 backend
  echo ""
  echo "  Rollback cepat: bash scripts/rollback.sh <sha_sebelumnya>"
  exit 1
fi

# ── 6. Verifikasi domain ──
if command -v verify-deploy >/dev/null 2>&1 || [ -f scripts/verify-deploy.sh ]; then
  bash scripts/verify-deploy.sh https://nexerp.id || echo "  ⚠️  verify-deploy ada warning (lihat di atas)"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ DEPLOY SELESAI — $DEPLOY_SHA"
echo "═══════════════════════════════════════════════════"
