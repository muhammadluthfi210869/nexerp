#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Rollback production to previous known-good image tag (sub-10s)
# ═══════════════════════════════════════════════════════════════
#  Usage: bash scripts/rollback.sh [steps-back=1]
#  Example: bash scripts/rollback.sh 2   # 2 deploys back
#
#  This script does NOT use git revert. It uses Docker image tags
#  (set by scripts/deploy.sh after every build). Sub-10s revert on
#  Biznet VPS (4 GB RAM, no rebuild needed).
#
#  Image tags are timestamped (deploy-YYYYMMDD-HHMMSS). To list:
#    sudo docker images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' \
#      | grep production-light
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

STEPS="${1:-1}"
PROJECT="production-light"

echo "▶ Rolling back $STEPS deploy(s) on $PROJECT"
echo ""

# Find tagged images, sort by creation time (newest first)
BACKEND_TAGS=$(sudo docker images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' \
  | grep "^${PROJECT}-backend:" \
  | grep -v ':latest ' \
  | sort -k2 -r)

FRONTEND_TAGS=$(sudo docker images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' \
  | grep "^${PROJECT}-frontend:" \
  | grep -v ':latest ' \
  | sort -k2 -r)

echo "Backend image tag history:"
echo "$BACKEND_TAGS" | head -10
echo ""
echo "Frontend image tag history:"
echo "$FRONTEND_TAGS" | head -10
echo ""

# Pick target (skip STEPS newest)
BACKEND_TARGET=$(echo "$BACKEND_TAGS" | awk -v s="$STEPS" 'NR==s+1 {print $1; exit}' | sed 's/^.*://')
FRONTEND_TARGET=$(echo "$FRONTEND_TAGS" | awk -v s="$STEPS" 'NR==s+1 {print $1; exit}' | sed 's/^.*://')

if [ -z "$BACKEND_TARGET" ] || [ -z "$FRONTEND_TARGET" ]; then
  echo "❌ No older image tag found at step $STEPS back"
  echo "   Available steps: 0 (current) up to $(echo "$BACKEND_TAGS" | wc -l | tr -d ' ')"
  exit 1
fi

echo "▶ Rolling back to:"
echo "   backend:$BACKEND_TARGET"
echo "   frontend:$FRONTEND_TARGET"
echo ""

# Retag as :latest
sudo docker tag "${PROJECT}-backend:${BACKEND_TARGET}" "${PROJECT}-backend:latest"
sudo docker tag "${PROJECT}-frontend:${FRONTEND_TARGET}" "${PROJECT}-frontend:latest"

# Recreate containers (--no-build so we use the freshly tagged :latest)
sudo docker compose -p "$PROJECT" up -d --no-build backend frontend

# Health check
echo "▶ Waiting 10s for health..."
sleep 10
if curl -sf http://127.0.0.1:3001/health >/dev/null 2>&1; then
  echo "✅ Rollback complete. Verify at https://nexerp.id"
else
  echo "❌ Rollback target unhealthy — investigate manually"
  echo "   Backend logs: sudo docker logs ${PROJECT}-backend-1 --tail 50"
  exit 1
fi
