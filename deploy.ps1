# ERP FROM ZERO - Final Automated Deployment
$IP = "5.223.80.88"
$User = "root"

Clear-Host
Write-Host "STARTING FINAL DEPLOYMENT..." -ForegroundColor Cyan

# 1. Clean and Archive
Write-Host "Archiving files..." -ForegroundColor Yellow
if (Test-Path "deploy.tar.gz") { Remove-Item "deploy.tar.gz" -Force }

tar -czf deploy.tar.gz backend frontend docker-compose.prod.yml nginx.conf setup_hetzner.sh deploy-remote.sh

if ($LASTEXITCODE -ne 0) {
    Write-Host "ARCHIVE FAILED!" -ForegroundColor Red
    exit
}

# 2. Upload
Write-Host "Uploading to Hetzner..." -ForegroundColor Yellow
scp deploy.tar.gz "${User}@${IP}:/root/"

# 3. Remote Execution
Write-Host "Running Setup on Server..." -ForegroundColor Yellow
$RemoteCmd = "cd /root && tar -xzf deploy.tar.gz && chmod +x setup_hetzner.sh deploy-remote.sh && ./setup_hetzner.sh && ./deploy-remote.sh"

ssh "${User}@${IP}" $RemoteCmd

Write-Host ""
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "-------------------------------------------------------"
Write-Host "Open: https://nexerp.id"
Write-Host "-------------------------------------------------------"
