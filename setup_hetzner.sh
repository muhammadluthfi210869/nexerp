#!/bin/bash

# ERP FROM ZERO - Hetzner Server Setup Script
# Run this on your Ubuntu server

echo "🚀 Starting Server Setup..."

# 1. Update System
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker
if ! [ -x "$(command -v docker)" ]; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# 3. Install Docker Compose
if ! [ -x "$(command -v docker compose)" ]; then
    echo "📦 Installing Docker Compose..."
    sudo apt-get install docker-compose-plugin -y
fi

# 4. Create Directory Structure
echo "📂 Creating Directories..."
mkdir -p backend/uploads/creative
mkdir -p certbot/conf
mkdir -p certbot/www

# 5. Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env template... PLEASE EDIT THIS FILE!"
    cat <<EOT >> .env
DOMAIN_NAME=yourdomain.com
DB_USER=erp_admin
DB_PASSWORD=$(openssl rand -base64 12)
DB_NAME=erp_production
JWT_SECRET=$(openssl rand -base64 32)
EOT
fi

echo "✅ Setup Complete!"
echo "-------------------------------------------------------"
echo "NEXT STEPS:"
echo "1. Edit the .env file: 'nano .env'"
echo "2. Point your Domain A Records to this IP ($DOMAIN_NAME and api.$DOMAIN_NAME)"
echo "3. Run the app: 'docker compose -f docker-compose.prod.yml up -d'"
echo "4. (Optional) Run certbot for SSL after app is running."
echo "-------------------------------------------------------"
