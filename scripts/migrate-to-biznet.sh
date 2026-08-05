#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NexERP — MIGRATE Hetzner → Biznet
#  Dijalankan dari LAPTOP (Git Bash di Windows).
#  Membaca config dari backend/.env (HETZNER_IP, BIZNET_IP, dll).
#
#  Yang dilakukan:
#    1. Dump DB ERP (postgres15) + DB Lead (postgres17) di Hetzner
#    2. docker save 7 image aktif di Hetzner
#    3. Tar runtime files ERP + project lead → download ke laptop
#    4. Upload image + tar ke Biznet → docker load + extract
#    5. Restore DB dilakukan OLEH deploy-biznet.sh & setup-lead.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../backend/.env"
[ -f "$ENV_FILE" ] || { echo "❌ $ENV_FILE tidak ditemukan"; exit 1; }

# ── Load config migrasi dari backend/.env ──
get_var() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"' ; }
HETZNER_IP="$(get_var HETZNER_IP)"
BIZNET_IP="$(get_var BIZNET_IP)"
HETZNER_PATH="$(get_var HETZNER_DEPLOY_PATH)"
BIZNET_PATH="$(get_var BIZNET_DEPLOY_PATH)"
BIZNET_LEAD="$(get_var BIZNET_LEAD_PATH)"
HETZNER_USER="$(get_var SSH_USER)"
BIZNET_USER="$(get_var BIZNET_SSH_USER)"
SSH_KEY="$HOME/.ssh/id_rsa"
WORK="$HOME/migrate-biznet"

echo "═══════════════════════════════════════════"
echo "  🔁 MIGRATE Hetzner → Biznet"
echo "  Hetzner : $HETZNER_USER@$HETZNER_IP  path: $HETZNER_PATH"
echo "  Biznet  : $BIZNET_USER@$BIZNET_IP  path: $BIZNET_PATH"
echo "═══════════════════════════════════════════"

# ── 0. Cek akses SSH ──
echo "▶ Cek akses SSH..."
ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new -i "$SSH_KEY" "$HETZNER_USER@$HETZNER_IP" "echo '  ✓ Hetzner terhubung'" || { echo "❌ SSH Hetzner gagal"; exit 1; }
ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new -i "$SSH_KEY" "$BIZNET_USER@$BIZNET_IP" "echo '  ✓ Biznet terhubung'" || { echo "❌ SSH Biznet gagal"; exit 1; }

mkdir -p "$WORK"

# ── 1. Dump DB di Hetzner ──
echo ""
echo "▶ [1/5] Dump database (ERP + Lead)..."
ssh -o BatchMode=yes -i "$SSH_KEY" "$HETZNER_USER@$HETZNER_IP" "
  mkdir -p $HETZNER_PATH/backups /opt/dreamlab-lead/backups
  docker exec production-light-db-1 pg_dump -U erp_user -d erp_database > $HETZNER_PATH/backups/migration-erp.sql
  docker exec dreamlab-lead-db-lead-1 pg_dump -U dreamlab1 -d dreamlab > /opt/dreamlab-lead/backups/migration-lead.sql
  ls -lh $HETZNER_PATH/backups/migration-erp.sql /opt/dreamlab-lead/backups/migration-lead.sql
" || { echo "❌ Dump DB gagal"; exit 1; }

# ── 2. docker save image di Hetzner ──
echo ""
echo "▶ [2/5] docker save image (7 image aktif)..."
ssh -o BatchMode=yes -i "$SSH_KEY" "$HETZNER_USER@$HETZNER_IP" "
  docker save production-light-backend:latest production-light-frontend:latest postgres:15-alpine nginx:alpine certbot/certbot:latest postgres:17-alpine edoburu/pgbouncer:latest -o /root/images-migration.tar
  ls -lh /root/images-migration.tar
" || { echo "❌ docker save gagal"; exit 1; }

# ── 3. Tar runtime files + download ke laptop ──
echo ""
echo "▶ [3/5] Tar runtime files ERP & lead, download ke laptop..."
ssh -o BatchMode=yes -i "$SSH_KEY" "$HETZNER_USER@$HETZNER_IP" "cd $HETZNER_PATH && tar -czf - --exclude=.git --exclude=node_modules --exclude=.next --exclude=dist --exclude=*.log .env docker-compose.yml nginx.conf backend/dirlif-project-cbab4f5a2ec6.json backend/data backend/uploads frontend/public certbot backups/migration-erp.sql" > "$WORK/erp-runtime.tar.gz"
ssh -o BatchMode=yes -i "$SSH_KEY" "$HETZNER_USER@$HETZNER_IP" "cd /opt/dreamlab-lead && tar -czf - .env .env.production.example docker-compose-lead.yml deploy-lead.sh 00001_init_round_robin_leads.sql backups/migration-lead.sql" > "$WORK/lead-project.tar.gz"
gzip -t "$WORK/erp-runtime.tar.gz" && echo "  ✓ erp-runtime.tar.gz: $(ls -lh "$WORK/erp-runtime.tar.gz" | awk '{print $5}')"
gzip -t "$WORK/lead-project.tar.gz" && echo "  ✓ lead-project.tar.gz: $(ls -lh "$WORK/lead-project.tar.gz" | awk '{print $5}')"

# ── 4. Download image, upload semuanya ke Biznet ──
echo ""
echo "▶ [4/5] Transfer image ke Biznet (bisa lama ±4.6GB)..."
scp -o BatchMode=yes -i "$SSH_KEY" "$HETZNER_USER@$HETZNER_IP:/root/images-migration.tar" "$WORK/images-migration.tar"
scp -o BatchMode=yes -i "$SSH_KEY" "$WORK/images-migration.tar" "$WORK/erp-runtime.tar.gz" "$WORK/lead-project.tar.gz" "$BIZNET_USER@$BIZNET_IP:/home/$BIZNET_USER/transfer/"
echo "  ✓ Semua file terupload ke Biznet"

# ── 5. docker load + extract di Biznet ──
echo ""
echo "▶ [5/5] docker load image + extract files di Biznet..."
ssh -o BatchMode=yes -i "$SSH_KEY" "$BIZNET_USER@$BIZNET_IP" "
  sudo docker load -i /home/$BIZNET_USER/transfer/images-migration.tar
  mkdir -p $BIZNET_PATH $BIZNET_LEAD
  tar -xzf /home/$BIZNET_USER/transfer/erp-runtime.tar.gz -C $BIZNET_PATH
  tar -xzf /home/$BIZNET_USER/transfer/lead-project.tar.gz -C $BIZNET_LEAD
  echo '  ✓ extract selesai'
  ls -la $BIZNET_PATH/.env $BIZNET_PATH/certbot/conf $BIZNET_PATH/backend/dirlif-project-cbab4f5a2ec6.json $BIZNET_LEAD/.env
" || { echo "❌ Load/extract di Biznet gagal"; exit 1; }

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ MIGRATE TRANSFER SELESAI!"
echo ""
echo "  LANJUTKAN di Biznet (ssh dreamlab@$BIZNET_IP):"
echo "    1) bash scripts/deploy-biznet.sh   (start ERP + restore DB ERP)"
echo "    2) bash scripts/setup-lead.sh      (start lead DB + restore)"
echo ""
echo "  ⚠️  File sementara laptop: $WORK (hapus setelah sukses)"
echo "═══════════════════════════════════════════"
