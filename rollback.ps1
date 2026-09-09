# ==============================================================================
# NEXERP EMERGENCY INSTANT ROLLBACK SCRIPT (5-SECOND REVERT)
# Target: Biznet VPS (103.93.134.215) | Domain: https://nexerp.id
# ==============================================================================
param(
    [switch]$RestoreDatabase = $false
)

$ErrorActionPreference = "Stop"

$IP = "103.93.134.215"
$User = "dreamlab"
$RemoteDir = "/home/dreamlab/nexerp"
$Domain = "nexerp.id"

Write-Host "========================================================" -ForegroundColor Red
Write-Host "  NEXERP EMERGENCY INSTANT ROLLBACK PROTOCOL" -ForegroundColor Red
Write-Host "  Target Server : ${User}@${IP}" -ForegroundColor Red
Write-Host "  Target Domain : https://${Domain}" -ForegroundColor Red
Write-Host "========================================================" -ForegroundColor Red

Write-Host "`n[1/3] Checking rollback checkpoints on VPS..." -ForegroundColor Yellow

$rollbackScript = @"
set -e
cd $RemoteDir

echo '--> Checking if previous rollback images exist...'
BACKEND_ROLLBACK=`$(sudo docker images -q production-light-backend:rollback 2>/dev/null)
FRONTEND_ROLLBACK=`$(sudo docker images -q production-light-frontend:rollback 2>/dev/null)

if [ -z "`$BACKEND_ROLLBACK" ] || [ -z "`$FRONTEND_ROLLBACK" ]; then
    echo '[FAIL] Rollback checkpoint images not found on server!'
    exit 1
fi

echo '--> Re-tagging rollback images to latest...'
sudo docker tag production-light-backend:rollback production-light-backend:latest
sudo docker tag production-light-frontend:rollback production-light-frontend:latest

echo '--> Restarting containers with rollback version in 5s...'
sudo docker compose -p production-light up -d --no-build backend frontend

echo '--> [OK] Containers restored to previous snapshot.'
"@

ssh "${User}@${IP}" $rollbackScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Container rollback failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Containers successfully reverted to previous release." -ForegroundColor Green

# Optional: Restore Database Snapshot
if ($RestoreDatabase) {
    Write-Host "`n[2/3] Restoring most recent Database Snapshot..." -ForegroundColor Yellow
    $dbRestoreScript = @"
cd $RemoteDir/db-backups
LATEST_BACKUP=`$(ls -t backup_*.sql.gz 2>/dev/null | head -n 1)

if [ -z "`$LATEST_BACKUP" ]; then
    echo '[FAIL] No database snapshot found to restore!'
    exit 1
fi

echo "--> Restoring database from `$LATEST_BACKUP ..."
CONTAINER_ID=`$(sudo docker compose -p production-light -f $RemoteDir/docker-compose.prod.yml ps -q db)
gunzip -c "`$LATEST_BACKUP" | sudo docker exec -i `$CONTAINER_ID psql -U erp_user -d erp_database
echo "--> [OK] Database restored from `$LATEST_BACKUP."
"@
    ssh "${User}@${IP}" $dbRestoreScript
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Database snapshot successfully restored." -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Database restore encountered an issue, check logs." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "`n[2/3] Database restore skipped (use -RestoreDatabase if DB revert is also needed)." -ForegroundColor DarkGray
}

Write-Host "`n[3/3] Verifying Restored System Health..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $apiRes = Invoke-WebRequest -Uri "https://${Domain}/api/v1/system/health" -Method Get -TimeoutSec 10 -UseBasicParsing
    Write-Host "  Rollback Healthcheck : HTTP $($apiRes.StatusCode) OK" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] Healthcheck probe after rollback returned: $_" -ForegroundColor DarkYellow
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  ROLLBACK COMPLETE: SYSTEM RESTORED!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
