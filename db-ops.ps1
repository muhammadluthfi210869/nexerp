# ==============================================================================
# NEXERP DATABASE OPERATIONS & MIGRATION SAFETY MANAGER
# ==============================================================================
param(
    [Parameter(Position=0)]
    [ValidateSet("status", "backup", "restore", "migrate", "logs")]
    [string]$Action = "status"
)

$ErrorActionPreference = "Stop"

$IP = "103.93.134.215"
$User = "dreamlab"
$RemoteDir = "/home/dreamlab/nexerp"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NEXERP DATABASE OPERATIONS : $($Action.ToUpper())" -ForegroundColor Cyan
Write-Host "  Target VPS : ${User}@${IP}" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

switch ($Action) {
    "status" {
        Write-Host "`n--> Checking Prisma Migration Status on Production Database..." -ForegroundColor Yellow
        $script = @"
cd $RemoteDir
CONTAINER_ID=`$(sudo docker compose -p production-light ps -q backend 2>/dev/null)
if [ -n "`$CONTAINER_ID" ]; then
    echo '=== PRISMA MIGRATION STATUS ==='
    sudo docker exec `$CONTAINER_ID npx prisma migrate status || true
else
    echo 'Backend container is not running.'
fi
"@
        ssh "${User}@${IP}" $script
    }

    "backup" {
        Write-Host "`n--> Taking On-Demand Full Database Snapshot..." -ForegroundColor Yellow
        $script = @"
mkdir -p $RemoteDir/db-backups
CONTAINER_ID=`$(sudo docker compose -p production-light ps -q db 2>/dev/null)
if [ -n "`$CONTAINER_ID" ]; then
    BACKUP_FILE="$RemoteDir/db-backups/manual_backup_${Timestamp}.sql.gz"
    sudo docker exec `$CONTAINER_ID pg_dump -U erp_user erp_database | gzip > `$BACKUP_FILE
    SIZE=`$(du -h `$BACKUP_FILE | cut -f1)
    echo "--> [OK] Database backup saved: `$BACKUP_FILE (`$SIZE)"
else
    echo '[FAIL] PostgreSQL db container is not running.'
    exit 1
fi
"@
        ssh "${User}@${IP}" $script
    }

    "migrate" {
        Write-Host "`n--> Running Safe Migration with Automatic Pre-Backup..." -ForegroundColor Yellow
        $script = @"
set -e
mkdir -p $RemoteDir/db-backups
CONTAINER_DB=`$(sudo docker compose -p production-light ps -q db)
CONTAINER_BE=`$(sudo docker compose -p production-light ps -q backend)

echo '--> Step 1: Taking pre-migration safety backup...'
sudo docker exec `$CONTAINER_DB pg_dump -U erp_user erp_database | gzip > $RemoteDir/db-backups/pre_migrate_${Timestamp}.sql.gz
echo '--> Step 1 [OK] Backup saved.'

echo '--> Step 2: Applying pending migrations...'
sudo docker exec `$CONTAINER_BE npx prisma migrate deploy
echo '--> Step 2 [OK] Migrations applied successfully!'
"@
        ssh "${User}@${IP}" $script
    }

    "logs" {
        Write-Host "`n--> Fetching PostgreSQL Database Logs (last 50 lines)..." -ForegroundColor Yellow
        ssh "${User}@${IP}" "cd $RemoteDir && sudo docker compose -p production-light logs --tail=50 db"
    }

    "restore" {
        Write-Host "`n--> Available Database Backups on VPS:" -ForegroundColor Yellow
        ssh "${User}@${IP}" "ls -lh $RemoteDir/db-backups/*.sql.gz 2>/dev/null || echo 'No backups found.'"
        Write-Host "`nTo restore a specific backup, run rollback.ps1 -RestoreDatabase or execute via SSH." -ForegroundColor Cyan
    }
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  DB-OPS ACTION FINISHED: $Action" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
