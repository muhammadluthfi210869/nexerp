#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NexERP — Setup Server Biznet Neo Lite (Ubuntu 26.04)
#  Dijalankan SATU KALI di server Biznet, sebagai user `dreamlab`.
#  Cara pakai (dari laptop):
#    ssh dreamlab@<IP_BIZNET> 'bash -s' < scripts/setup-server.sh
#  atau: upload file ini lalu:  bash scripts/setup-server.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

. /etc/os-release
echo "═══════════════════════════════════════"
echo "  NEXERP — SETUP BIZNET SERVER"
echo "  OS: $PRETTY_NAME"
echo "═══════════════════════════════════════"

# 1) Timezone = UTC (SAMAKAN dengan Hetzner — krusial untuk SLA "hari ini")
sudo timedatectl set-timezone Etc/UTC
echo "✅ Timezone: $(timedatectl | grep 'Time zone')"

# 2) Prerequisites
echo "📦 Install prerequisite..."
sudo apt-get update -qq
sudo apt-get install -y -qq ca-certificates curl git

# 3) Docker Engine + Compose Plugin (deteksi Ubuntu/Debian otomatis)
if command -v docker >/dev/null 2>&1; then
  echo "✅ Docker sudah ada: $(docker --version)"
else
  echo "📦 Install Docker..."
  sudo install -m 0755 -d /etc/apt/keyrings
  if [ "$ID" = "ubuntu" ]; then DOCKER_REPO="ubuntu"; else DOCKER_REPO="debian"; fi
  curl -fsSL "https://download.docker.com/linux/$DOCKER_REPO/gpg" | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$DOCKER_REPO $VERSION_CODENAME stable" | sudo tee /etc/apt/sources.list.d/docker.list
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo systemctl enable --now docker
fi
echo "✅ Compose: $(docker compose version)"

# 4) User saat ini ke group docker
sudo usermod -aG docker "$(whoami)"
echo "✅ User '$(whoami)' masuk group docker (re-login SSH dibutuhkan)."

# 5) Swap 4 GB (jaring pengaman RAM 4GB)
if ! sudo swapon --show | grep -q /swapfile; then
  echo "📦 Buat swap 4GB..."
  sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q /swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi
echo "✅ Swap: $(sudo swapon --show | tail -1)"

# 6) Folder project (milik user dreamlab — tanpa sudo untuk operasi file)
mkdir -p "$HOME/nexerp" "$HOME/dreamlab-lead" "$HOME/transfer"
echo "✅ Folder:"
echo "   - $HOME/nexerp         (ERP production-light)"
echo "   - $HOME/dreamlab-lead  (Sistem 2: lead DB dreamlab)"
echo "   - $HOME/transfer       (staging transfer)"

# 7) Clone repo ERP (production-light) — untuk build & versi kode
if [ ! -d "$HOME/nexerp/.git" ]; then
  echo "📦 Clone repo production-light..."
  git clone -b production-light https://github.com/muhammadluthfi210869/nexerp.git "$HOME/nexerp"
else
  echo "✅ Repo sudah ada di $HOME/nexerp"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ SETUP SELESAI!"
echo "  ⚠️  KELUAR & MASUK SSH DULU supaya group docker aktif,"
echo "     lalu di LAPTOP jalankan:  bash scripts/migrate-to-biznet.sh"
echo "═══════════════════════════════════════════════════"
