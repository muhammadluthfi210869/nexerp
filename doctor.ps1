# ==============================================================================
# NEXERP SYSTEM DOCTOR & VPS HEALTH DIAGNOSTIC TOOL
# ==============================================================================
param(
    [switch]$FollowLogs = $false,
    [string]$Service = "backend"
)

$ErrorActionPreference = "Continue"

$IP = "103.93.134.215"
$User = "dreamlab"
$RemoteDir = "/home/dreamlab/nexerp"
$Domain = "nexerp.id"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NEXERP SYSTEM DOCTOR & SERVER DIAGNOSTICS" -ForegroundColor Cyan
Write-Host "  Target VPS : ${User}@${IP}" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. VPS Host Metrics
Write-Host "`n[1/5] VPS Hardware & Resource Consumption:" -ForegroundColor Yellow
$metricScript = @"
echo '--- CPU & UPTIME ---'
uptime
echo ''
echo '--- RAM USAGE (MB) ---'
free -m
echo ''
echo '--- DISK STORAGE (GB) ---'
df -h / | tail -n 1
"@
ssh "${User}@${IP}" $metricScript

# 2. Docker Containers Health
Write-Host "`n[2/5] Docker Containers Runtime State:" -ForegroundColor Yellow
ssh "${User}@${IP}" "cd $RemoteDir && sudo docker compose -p production-light ps"

# 3. Live Resource Usage per Container
Write-Host "`n[3/5] Live Container Resource Limits (CPU & RAM):" -ForegroundColor Yellow
ssh "${User}@${IP}" "sudo docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}'"

# 4. HTTP / Endpoint Probes
Write-Host "`n[4/5] Public Health Probes:" -ForegroundColor Yellow
try {
    $apiRes = Invoke-WebRequest -Uri "https://${Domain}/api/system/health" -Method Get -TimeoutSec 10 -UseBasicParsing
    Write-Host "  API Endpoint (https://${Domain}/api/system/health) : HTTP $($apiRes.StatusCode) OK" -ForegroundColor Green
    Write-Host "  Payload: $($apiRes.Content)" -ForegroundColor DarkGray
} catch {
    Write-Host "  API Endpoint (https://${Domain}/api/system/health) : [FAILED] $_" -ForegroundColor Red
}

try {
    $webRes = Invoke-WebRequest -Uri "https://${Domain}" -Method Get -TimeoutSec 10 -UseBasicParsing
    Write-Host "  Web App (https://${Domain})                             : HTTP $($webRes.StatusCode) OK" -ForegroundColor Green
} catch {
    Write-Host "  Web App (https://${Domain})                             : [FAILED] $_" -ForegroundColor Red
}

# 5. Recent Logs Dump
Write-Host "`n[5/5] Recent Log Snip ($Service - last 25 lines):" -ForegroundColor Yellow
if ($FollowLogs) {
    Write-Host "Streaming live logs (Ctrl+C to exit)..." -ForegroundColor Cyan
    ssh "${User}@${IP}" "cd $RemoteDir && sudo docker compose -p production-light logs -f $Service"
} else {
    ssh "${User}@${IP}" "cd $RemoteDir && sudo docker compose -p production-light logs --tail=25 $Service"
    Write-Host "`nTip: Run './doctor.ps1 -FollowLogs -Service backend' to tail live logs." -ForegroundColor DarkGray
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  DIAGNOSTIC INSPECTION COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
