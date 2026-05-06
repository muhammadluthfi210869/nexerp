# 🚀 World-Class VPS Deployment Guide

This guide will walk you through deploying your **Marketing Intelligence Dashboard** to your new VPS using Docker. This method ensures that the environment is "Plek Ketiplek" (identical) to your development setup.

## 1. Prepare Your VPS
Connect to your VPS via SSH (use Terminal/PowerShell):
```bash
ssh root@your-vps-ip
```

### Install Docker (One-Liner for Ubuntu/Debian)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## 2. Upload Your Code
The easiest way is to use Git. Create a repository on GitHub/GitLab, push your code, and then clone it on the VPS:
```bash
git clone https://github.com/your-repo/erp-from-zero.git
cd erp-from-zero
```

## 3. Configuration
I have already created the `docker-compose.yml` for you in the project root. You just need to update the IP address:

1. Open the file: `nano docker-compose.yml`
2. Find `NEXT_PUBLIC_API_URL`
3. Change `your-vps-ip` to your real VPS IP (e.g., `http://123.45.67.89:3001`)
4. Save and Exit (`Ctrl+O`, `Enter`, `Ctrl+X`)

## 4. Launch 🚀
Run this command in the root folder of the project:
```bash
docker compose up -d --build
```
This will:
- Build the **Backend** (NestJS)
- Build the **Frontend** (Next.js)
- Start the **Database** (PostgreSQL)
- Run everything in the background (`-d`)

## 5. Initialize Database
Once the containers are running, you need to run the migrations and seeding:
```bash
# Run Migrations
docker compose exec backend npx prisma migrate deploy

# Seed Marketing Data (Simulation April 2026)
docker compose exec backend npx ts-node prisma/seed-marketing.ts
```

## 6. Accessing the Dashboard
- **Frontend**: `http://your-vps-ip:3000`
- **Backend API**: `http://your-vps-ip:3001`

---

### Tips for World-Class Stability:
- **Nginx & SSL**: Use Nginx as a reverse proxy to add HTTPS (SSL) via Certbot.
- **Auto-Restart**: `restart: always` in `docker-compose.yml` (already added) ensures your app starts automatically if the VPS reboots.
- **Logs**: View logs with `docker compose logs -f backend`.
