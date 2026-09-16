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
# Auto-resolve short git SHA to full 40-char SHA if passed as git commit ref
if [ "$DEPLOY_SHA" != "latest" ]; then
  FULL_SHA=$(git rev-parse "$DEPLOY_SHA" 2>/dev/null || echo "")
  if [ -n "$FULL_SHA" ]; then
    DEPLOY_SHA="$FULL_SHA"
  fi
fi

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

# ── 2b. Cleanup disk space (hapus image lama & cache agar disk tidak penuh) ──
echo "🧹 Membersihkan image lama dan build cache..."
docker image prune -af --filter "until=1h" || true
docker builder prune -af || true
echo "  📊 Kapasitas Disk Saat Ini:"
df -h /

# ── 3. Pull image dari GHCR ──
echo ""
echo "🧹 Membersihkan image lama untuk mengamankan ruang disk..."
docker image prune -af --filter "until=2h" 2>/dev/null || true

echo "📥 Pull image (tag: $DEPLOY_SHA)..."
echo "   (asumsi: 'docker login ghcr.io' sudah dilakukan SEKALI di VPS — lihat DEPLOY.md)"
export IMAGE_TAG="$DEPLOY_SHA"

REPO_PREFIX="ghcr.io/muhammadluthfi210869/nexerp"
for img in backend frontend; do
  if [ "$DEPLOY_SHA" != "latest" ] && docker image inspect "${REPO_PREFIX}/${img}:${DEPLOY_SHA}" >/dev/null 2>&1; then
    echo "  ✅ Image ${img}:${DEPLOY_SHA} sudah cached di VPS, skip pull"
  else
    echo "  ⬇️  Pulling ${img}:${DEPLOY_SHA}..."
    docker compose -p "$COMPOSE_PROJECT" --profile server pull "${img}"
  fi
done
docker compose -p "$COMPOSE_PROJECT" config --quiet   # validasi compose + env

# ── 4. Up (tanpa build!) ──
echo ""
echo "🏗️  Restart services (image GHCR, tanpa build)..."
docker compose -p "$COMPOSE_PROJECT" --profile server up -d --force-recreate

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

# ── 6. Verifikasi domain (smoke test 6/6) ──
if [ -f scripts/test-deploy.sh ]; then
  echo ""
  echo "🔍 Menjalankan smoke test pasca-deploy..."
  bash scripts/test-deploy.sh https://nexerp.id/api || echo "  ⚠️  test-deploy ada warning (lihat di atas)"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ DEPLOY SELESAI — $DEPLOY_SHA"
echo "═══════════════════════════════════════════════════"
