# ERP FROM ZERO - Automated Deployment to Biznet (103.93.134.215)
# This script forwards execution to the hardened production pipeline (deploy-production.ps1)

$scriptPath = Join-Path $PSScriptRoot "deploy-production.ps1"
if (Test-Path $scriptPath) {
    & $scriptPath @args
} else {
    Write-Host "Error: deploy-production.ps1 not found in $PSScriptRoot" -ForegroundColor Red
    exit 1
}
