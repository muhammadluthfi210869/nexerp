param(
  [switch]$CreateArchiveOnly
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$stageRoot = Join-Path $root "tmp\\marketing-only-deploy"
$archivePath = Join-Path $root "deploy-marketing-only.tar.gz"

$marketingPaths = @(
  # Marketing-specific
  "frontend/Dockerfile",
  "frontend/src/app/(dashboard)/marketing",
  "frontend/src/components/marketing",
  "frontend/src/components/layout/Sidebar.tsx",
  "frontend/src/components/layout/FormShell.tsx",
  "frontend/src/components/dna",
  "frontend/src/lib/marketing-members.ts",
  "frontend/src/lib/utils.ts",
  "backend/package.json",
  "backend/package-lock.json",
  "backend/src/modules/marketing",
  "backend/src/modules/analytics/services/analytics.service.ts",
  "backend/data/marketing-prototype-state.json",
  "backend/init-db.sh",
  "backend/prisma/seed-master.ts",
  "backend/prisma/migrations",
  "backend/prisma/schema/marketing.prisma",
  # Prisma schema fix (HEAD has duplicate models)
  "backend/prisma/schema/production.prisma",
  "backend/prisma/schema/qc.prisma",
  "backend/prisma/schema/rnd.prisma"
)

function Ensure-ParentDirectory {
  param([string]$DestinationPath)
  $parent = Split-Path -Parent $DestinationPath
  if (-not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }
}

function Copy-OverlayPath {
  param(
    [string]$RelativePath
  )

  $source = Join-Path $root $RelativePath
  $destination = Join-Path $stageRoot $RelativePath

  if (-not (Test-Path -LiteralPath $source)) {
    Write-Warning "Skip missing path: $RelativePath"
    return
  }

  if ((Get-Item -LiteralPath $source).PSIsContainer) {
    if (Test-Path -LiteralPath $destination) {
      Remove-Item -LiteralPath $destination -Recurse -Force
    }

    Ensure-ParentDirectory -DestinationPath $destination
    Copy-Item -LiteralPath $source -Destination (Split-Path -Parent $destination) -Recurse -Force
    return
  }

  Ensure-ParentDirectory -DestinationPath $destination
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

if (Test-Path -LiteralPath $stageRoot) {
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

Push-Location $root
try {
  $headTar = Join-Path $stageRoot "head-snapshot.tar"
  git archive --format=tar HEAD -o $headTar
  tar -xf $headTar -C $stageRoot
  Remove-Item -LiteralPath $headTar -Force

  foreach ($path in $marketingPaths) {
    Copy-OverlayPath -RelativePath $path
  }

  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }

  Push-Location $stageRoot
  try {
    $packageEntries = @(
      "backend",
      "frontend",
      "docker-compose.prod.yml",
      "nginx.conf",
      "setup_hetzner.sh"
    )

    & tar -czf $archivePath @packageEntries
  }
  finally {
    Pop-Location
  }

  Write-Host "Marketing-only archive ready: $archivePath" -ForegroundColor Green
  Write-Host "Stage directory: $stageRoot" -ForegroundColor Cyan
  Write-Host "Overlay paths:" -ForegroundColor Yellow
  $marketingPaths | ForEach-Object { Write-Host " - $_" }

  if (-not $CreateArchiveOnly) {
    Write-Host ""
    Write-Host "=== DEPLOYING TO BIZNET SERVER ===" -ForegroundColor Cyan

    $IP = "103.93.134.215"
    $User = "dreamlab"
    $RemoteDir = "/home/dreamlab/nexerp"

    Write-Host "Uploading to Biznet ($IP)..." -ForegroundColor Yellow
    scp $archivePath "${User}@${IP}:/home/${User}/deploy.tar.gz"

    if ($LASTEXITCODE -ne 0) {
      Write-Host "SCP UPLOAD FAILED!" -ForegroundColor Red
      exit 1
    }

    Write-Host "Extracting + deploying on Biznet server..." -ForegroundColor Yellow
    $RemoteCmd = "cd $RemoteDir && tar -xzf ~/deploy.tar.gz && sudo docker compose -p production-light up -d --build backend frontend && sudo docker image prune -f"

    ssh "${User}@${IP}" $RemoteCmd

    if ($LASTEXITCODE -ne 0) {
      Write-Host "Remote deployment may have had issues (check output above)." -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "MARKETING-ONLY DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "Open: https://nexerp.id" -ForegroundColor Green
  }
}
finally {
  Pop-Location
}
