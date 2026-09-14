#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NexERP Rollback — switch IMAGE_TAG ke SHA/GHCR tag sebelumnya
# ═══════════════════════════════════════════════════════════════
#  Usage:
#    bash scripts/rollback.sh <sha>      # rollback ke commit SHA tertentu
#    bash scripts/rollback.sh            # tampilkan 15 tag terakhir di GHCR cache lokal
#
#  Image per-SHA di-push CI selamanya → rollback tinggal ganti tag.
#  Kalau image-nya masih ter-cache di VPS, TIDAK pull ulang → <10 detik.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

PREFIX="ghcr.io/muhammadluthfi210869/nexerp"
COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-production-light}"
TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  echo "Image backend yang tersedia lokal (terbaru dulu):"
  docker images --format '{{.Repository}}:{{.Tag}}  {{.CreatedAt}}' \
    | grep "${PREFIX}/backend:" | head -15
  exit 0
fi

echo "▶ Rollback $COMPOSE_PROJECT → $TARGET"

for svc in backend frontend; do
  if docker image inspect "${PREFIX}/${svc}:${TARGET}" >/dev/null 2>&1; then
    echo "  ✅ Image ${svc}:${TARGET} sudah ada lokal — skip pull"
  else
    echo "  📥 Pull ${svc}:${TARGET} dari GHCR..."
    IMAGE_TAG="$TARGET" docker compose -p "$COMPOSE_PROJECT" pull "$svc"
  fi
done

export IMAGE_TAG="$TARGET"
docker compose -p "$COMPOSE_PROJECT" --profile server up -d backend frontend

echo ""
echo "🩺 Health gate..."
OK=0
for i in $(seq 1 20); do
  sleep 2
  if curl -sf "${HEALTH_URL:-http://127.0.0.1:3001/health}" >/dev/null 2>&1; then OK=1; break; fi
done
if [ "$OK" -eq 1 ]; then
  echo "  ✅ Backend sehat — rollback ke $TARGET selesai"
else
  echo "  ❌ Masih tidak sehat — cek: docker compose -p $COMPOSE_PROJECT logs --tail 50 backend"
  exit 1
fi
