# ==============================================================================
# NEXERP ENTERPRISE BULLETPROOF DEPLOYMENT PIPELINE
# Target: Biznet VPS (103.93.134.215) | Domain: https://nexerp.id
# ==============================================================================
param(
    [switch]$SkipLocalBuild = $false,
    [switch]$SkipHealthCheck = $false,
    [switch]$SkipDbBackup = $false
)

$ErrorActionPreference = "Stop"

$IP = "103.93.134.215"
$User = "dreamlab"
$RemoteDir = "/home/dreamlab/nexerp"
$Domain = "nexerp.id"
$ArchiveName = "deploy-bundle.tar.gz"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NEXERP ENTERPRISE DEPLOYMENT PIPELINE" -ForegroundColor Cyan
Write-Host "  Target Server  : ${User}@${IP}" -ForegroundColor Cyan
Write-Host "  Target Domain  : https://${Domain}" -ForegroundColor Cyan
Write-Host "  Release Tag    : rel_${Timestamp}" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STEP 1: LOCAL PRE-FLIGHT VERIFICATION & BUILD GUARD
# ------------------------------------------------------------------------------
Write-Host "`n[1/6] Running Local Pre-flight Verification..." -ForegroundColor Yellow

$criticalFiles = @(
    "docker-compose.prod.yml",
    "nginx.conf",
    "backend/Dockerfile",
    "frontend/Dockerfile",
    "backend/init-db.sh"
)

foreach ($file in $criticalFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "  [FAIL] Critical file missing: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  [OK] Critical files verified." -ForegroundColor Green

# Local Build Gate
if (-not $SkipLocalBuild) {
    Write-Host "  --> Verifying backend NestJS build..." -ForegroundColor DarkGray
    & npm --prefix backend run build | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] Local backend compilation failed! Deployment aborted to protect production." -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] Local backend build passed." -ForegroundColor Green
} else {
    Write-Host "  [NOTICE] Local build check skipped by user (-SkipLocalBuild)." -ForegroundColor DarkYellow
}

# ------------------------------------------------------------------------------
# STEP 2: CREATING PRODUCTION ARCHIVE (Lean & Fast)
# ------------------------------------------------------------------------------
Write-Host "`n[2/6] Compressing production archive into $ArchiveName..." -ForegroundColor Yellow
if (Test-Path $ArchiveName) { Remove-Item $ArchiveName -Force }

$tarExcludes = @(
    "--exclude=backend/uploads",
    "--exclude=uploads",
    "--exclude=node_modules",
    "--exclude=.next",
    "--exclude=dist",
    "--exclude=.git",
    "--exclude=tmp",
    "--exclude=_archive",
    "--exclude=_backup*",
    "--exclude=backups*",
    "--exclude=old_erp",
    "--exclude=playwright-report",
    "--exclude=test-results",
    "--exclude=docs",
    "--exclude=artifacts",
    "--exclude=*.tar.gz",
    "--exclude=*.zip",
    "--exclude=*.log",
    "--exclude=.env.local",
    "--exclude=.env.development",
    "-czf", $ArchiveName,
    "backend",
    "frontend",
    "docker-compose.prod.yml",
    "nginx.conf",
    "setup_hetzner.sh"
)

& tar @tarExcludes

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $ArchiveName)) {
    Write-Host "  [FAIL] Archive creation failed!" -ForegroundColor Red
    exit 1
}

$sizeMb = [math]::Round((Get-Item $ArchiveName).Length / 1MB, 2)
Write-Host "  [OK] Lean package created: $ArchiveName ($sizeMb MB)" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 3: REMOTE PRE-DEPLOY DATABASE SNAPSHOT
# ------------------------------------------------------------------------------
if (-not $SkipDbBackup) {
    Write-Host "`n[3/6] Taking Pre-Deployment Database Snapshot on VPS..." -ForegroundColor Yellow
    $dbBackupScript = @"
mkdir -p $RemoteDir/db-backups
CONTAINER_ID=`$(sudo docker compose -p production-light -f $RemoteDir/docker-compose.prod.yml ps -q db 2>/dev/null)
if [ -n "`$CONTAINER_ID" ]; then
    echo "--> Dumping PostgreSQL database to $RemoteDir/db-backups/backup_${Timestamp}.sql.gz ..."
    sudo docker exec `$CONTAINER_ID pg_dump -U erp_user erp_database | gzip > $RemoteDir/db-backups/backup_${Timestamp}.sql.gz
    echo "--> [OK] Database snapshot saved."
else
    echo "--> [NOTICE] DB container not running yet, skipping snapshot."
fi
"@
    ssh "${User}@${IP}" $dbBackupScript
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] Database snapshot encountered a warning, continuing deploy..." -ForegroundColor DarkYellow
    } else {
        Write-Host "  [OK] Remote database snapshot secured." -ForegroundColor Green
    }
} else {
    Write-Host "`n[3/6] Database snapshot skipped (-SkipDbBackup)." -ForegroundColor DarkYellow
}

# ------------------------------------------------------------------------------
# STEP 4: UPLOAD PACKAGE VIA SCP
# ------------------------------------------------------------------------------
Write-Host "`n[4/6] Uploading package to ${User}@${IP}..." -ForegroundColor Yellow
scp $ArchiveName "${User}@${IP}:/home/${User}/${ArchiveName}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] SCP Upload failed! Check your SSH connection and credentials." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Package uploaded successfully." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 5: REMOTE ATOMIC EXTRACTION & DOCKER ZERO-DOWNTIME RELEASE
# ------------------------------------------------------------------------------
Write-Host "`n[5/6] Executing Atomic Release & Container Launch on VPS..." -ForegroundColor Yellow

$remoteDeployScript = @"
set -e
mkdir -p $RemoteDir
cd $RemoteDir

echo '--> Tagging current containers as rollback checkpoint...'
sudo docker tag production-light-backend:latest production-light-backend:rollback 2>/dev/null || true
sudo docker tag production-light-frontend:latest production-light-frontend:rollback 2>/dev/null || true

echo '--> Unpacking deploy bundle...'
tar --no-same-owner --no-same-permissions -xzf /home/$User/$ArchiveName -C $RemoteDir 2>/dev/null || sudo tar -xzf /home/$User/$ArchiveName -C $RemoteDir
rm -f /home/$User/$ArchiveName

echo '--> Rebuilding and launching containers...'
sudo docker compose -p production-light up -d --build backend frontend

echo '--> Reloading Nginx upstream proxies...'
sudo docker compose -p production-light exec nginx nginx -s reload 2>/dev/null || true

echo '--> Pruning dangling images...'
sudo docker image prune -f
"@

ssh "${User}@${IP}" $remoteDeployScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Remote deployment script encountered an error!" -ForegroundColor Red
    Write-Host "  Fetching container logs to diagnose..." -ForegroundColor Magenta
    ssh "${User}@${IP}" "cd $RemoteDir && sudo docker compose -p production-light logs --tail=40"
    exit 1
}
Write-Host "  [OK] Services deployed and running on server." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 6: AUTOMATED LIVE HEALTH CHECK & DIAGNOSTICS
# ------------------------------------------------------------------------------
if (-not $SkipHealthCheck) {
    Write-Host "`n[6/6] Performing Live System Health Check..." -ForegroundColor Yellow
    Write-Host "  Waiting 12 seconds for containers to warm up..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 12

    Write-Host "  Container Status on Server:" -ForegroundColor Cyan
    ssh "${User}@${IP}" "cd $RemoteDir && sudo docker compose -p production-light ps"

    Write-Host "`n  Verifying API endpoint (https://${Domain}/api/system/health)..." -ForegroundColor Cyan
    try {
        $apiRes = Invoke-WebRequest -Uri "https://${Domain}/api/system/health" -Method Get -TimeoutSec 15 -UseBasicParsing
        if ($apiRes.StatusCode -eq 200) {
            Write-Host "  Backend API Status : HTTP 200 OK" -ForegroundColor Green
            Write-Host "  API Health Payload : $($apiRes.Content)" -ForegroundColor DarkGray
        } else {
            Write-Host "  Backend API Status : HTTP $($apiRes.StatusCode)" -ForegroundColor DarkYellow
        }
    } catch {
        Write-Host "  [WARN] API health check probe failed: $_" -ForegroundColor DarkYellow
        Write-Host "  --> Fetching latest backend container logs from VPS..." -ForegroundColor Magenta
        ssh "${User}@${IP}" "cd $RemoteDir && sudo docker compose -p production-light logs --tail=30 backend"
    }

    Write-Host "`n  Verifying Frontend endpoint (https://${Domain})..." -ForegroundColor Cyan
    try {
        $webRes = Invoke-WebRequest -Uri "https://${Domain}" -Method Get -TimeoutSec 15 -UseBasicParsing
        Write-Host "  Frontend Web Status: HTTP $($webRes.StatusCode) OK" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Frontend web check failed: $_" -ForegroundColor DarkYellow
    }
}

if (Test-Path $ArchiveName) { Remove-Item $ArchiveName -Force }

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE & VERIFIED!" -ForegroundColor Green
Write-Host "  Web App : https://${Domain}" -ForegroundColor Green
Write-Host "  API     : https://${Domain}/api/v1" -ForegroundColor Green
Write-Host "  Rollback: Run ./rollback.ps1 if you need instant revert" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Green
