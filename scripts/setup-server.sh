#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NexERP — Setup Server Baru (dijalankan SATU KALI)
# ═══════════════════════════════════════════════════════════════
#  Cara pakai:
#    ssh root@<IP>
#    curl -fsSL https://raw.githubusercontent.com/.../setup-server.sh | bash
#    atau upload manual lalu: bash setup-server.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

echo ""
echo "═══════════════════════════════════════════════════"
echo "  🖥️  NEXERP — Setup Server"
echo "═══════════════════════════════════════════════════"

# ── 1. Install Prerequisites ──
echo ""
echo "📦 Install Docker + Git..."
apt-get update -qq
apt-get install -y -qq ca-certificates curl git

# Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

echo "  ✅ Docker: $(docker --version)"
echo "  ✅ Compose: $(docker compose version)"

# ── 2. Clone Repository ──
echo ""
echo "📂 Clone repository..."
cd /opt
if [ -d nexerp ]; then
  echo "  ⚠️  /opt/nexerp sudah ada, pull saja..."
  cd nexerp && git pull
else
  git clone https://github.com/muhammadluthfi210869/nexerp.git
  cd nexerp
fi

# ── 3. Setup .env ──
echo ""
echo "🔑 Setup .env..."
if [ ! -f .env ]; then
  cp .env.production.example .env
  echo "  ⚠️  File .env telah dibuat dari template."
  echo "  ⚠️  WAJIB diisi:"
  echo "     - JWT_SECRET (generate dengan: openssl rand -hex 64)"
  echo "     - DB_PASSWORD (ganti yang kuat)"
  echo "     - DOMAIN_NAME (domain kamu)"
  echo "     - NEXT_PUBLIC_API_URL (https://domainmu.com/api)"
  echo "     - CORS_ORIGIN (https://domainmu.com)"
  echo ""
  echo "  Edit sekarang: nano .env"
else
  echo "  ✅ .env sudah ada"
fi

# ── 4. Setup SSL ──
echo ""
echo "🔒 Setup SSL (Let's Encrypt)..."
if [ -n "${DOMAIN_NAME:-}" ]; then
  mkdir -p certbot/conf certbot/www
  docker compose --profile server run --rm certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    --email admin@${DOMAIN_NAME} --agree-tos --no-eff-email \
    -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME} || \
    echo "  ⚠️  SSL setup gagal. Jalankan manual nanti."
fi

# ── 5. Deploy ──
echo ""
echo "🚀 Deploy aplikasi..."
bash scripts/deploy.sh

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ SETUP SELESAI!"
echo "  📅 $(date)"
echo ""
echo "  📝 Perintah penting:"
echo "     Deploy:    cd /opt/nexerp && git pull && bash scripts/deploy.sh"
echo "     Logs:      docker compose logs -f"
echo "     Restart:   docker compose restart"
echo "═══════════════════════════════════════════════════"
