param(
  [switch]$CreateArchiveOnly
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$stageRoot = Join-Path $root "tmp\\marketing-frontend-only"
$archivePath = Join-Path $root "deploy-marketing-frontend-only.tar.gz"
$frontendRoot = Join-Path $root "frontend"
$stageFrontend = Join-Path $stageRoot "frontend"
$infraPaths = @(
  "docker-compose.prod.yml",
  "nginx.conf",
  "setup_hetzner.sh",
  "deploy-remote.sh"
)

$frontendPaths = @(
  ".dockerignore",
  "Dockerfile",
  "components.json",
  "next-env.d.ts",
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
  "eslint.config.mjs",
  "playwright.config.ts",
  "src/middleware.ts",
  "prisma",
  "public",
  "src"
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
    [string]$SourceRoot,
    [string]$RelativePath,
    [string]$DestinationRoot
  )

  $source = Join-Path $SourceRoot $RelativePath
  $destination = Join-Path $DestinationRoot $RelativePath

  if (-not (Test-Path -LiteralPath $source)) {
    Write-Warning "Skip missing path: $RelativePath"
    return
  }

  if ((Get-Item -LiteralPath $source).PSIsContainer) {
    if (Test-Path -LiteralPath $destination) {
      Remove-Item -LiteralPath $destination -Recurse -Force
    }

    Ensure-ParentDirectory -DestinationPath (Join-Path $destination "placeholder")
    $destinationParent = Split-Path -Parent $destination
    Copy-Item -LiteralPath $source -Destination $destinationParent -Recurse -Force
    return
  }

  Ensure-ParentDirectory -DestinationPath $destination
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

function Remove-RouteTree {
  param(
    [string]$DashboardRoot
  )

  $allowedDashboardEntries = @("layout.tsx", "error.tsx", "loading.tsx", "marketing")

  Get-ChildItem -LiteralPath $DashboardRoot -Force | ForEach-Object {
    if ($allowedDashboardEntries -contains $_.Name) {
      return
    }

    Remove-Item -LiteralPath $_.FullName -Recurse -Force
  }

  $appRoot = Split-Path -Parent $DashboardRoot
  $allowedAppEntries = @("layout.tsx", "page.tsx", "error.tsx", "not-found.tsx", "robots.ts", "sitemap.ts", "globals.css", "login", "(dashboard)")

  Get-ChildItem -LiteralPath $appRoot -Force | ForEach-Object {
    if ($allowedAppEntries -contains $_.Name) {
      return
    }

    Remove-Item -LiteralPath $_.FullName -Recurse -Force
  }
}

if (Test-Path -LiteralPath $stageRoot) {
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null
New-Item -ItemType Directory -Path $stageFrontend -Force | Out-Null

foreach ($path in $frontendPaths) {
  Copy-OverlayPath -SourceRoot $frontendRoot -RelativePath $path -DestinationRoot $stageFrontend
}

foreach ($path in $infraPaths) {
  Copy-OverlayPath -SourceRoot $root -RelativePath $path -DestinationRoot $stageRoot
}

Remove-RouteTree -DashboardRoot (Join-Path $stageFrontend "src\\app\\(dashboard)")

if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

Push-Location $stageRoot
try {
  & tar -czf $archivePath frontend docker-compose.prod.yml nginx.conf setup_hetzner.sh deploy-remote.sh
}
finally {
  Pop-Location
}

Write-Host "Marketing frontend-only archive ready: $archivePath" -ForegroundColor Green
Write-Host "Stage directory: $stageRoot" -ForegroundColor Cyan
Write-Host "Included frontend paths:"
$frontendPaths | ForEach-Object { Write-Host " - $_" }
