param(
    [switch]$SkipRehearsal
)

$ErrorActionPreference = 'Continue'
$phaseRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendRoot = Join-Path $phaseRoot 'backend'
$frontendRoot = Join-Path $phaseRoot 'frontend'
$controllerPath = Join-Path $backendRoot 'src/modules/marketing/canonical/canonical-marketing.controller.ts'
$servicePath = Join-Path $backendRoot 'src/modules/marketing/canonical/canonical-marketing.service.ts'
$foundationMigrationPath = Join-Path $backendRoot 'prisma/migrations/20260910150000_marketing_task_social_foundation/migration.sql'
$migrationPath = Join-Path $backendRoot 'prisma/migrations/20260910170000_marketing_api_idempotency/migration.sql'
$results = [System.Collections.Generic.List[object]]::new()

function Invoke-PhaseCheck {
    param([string]$Name, [string]$WorkingDirectory, [string]$Command, [string[]]$Arguments)
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    Push-Location -LiteralPath $WorkingDirectory
    try {
        & $Command @Arguments
        $code = $LASTEXITCODE
        if ($null -eq $code) { $code = 0 }
    }
    catch {
        Write-Error $_
        $code = 1
    }
    finally { Pop-Location }
    $results.Add([pscustomobject]@{ Check = $Name; ExitCode = $code })
}

function Test-Phase3Contract {
    Write-Host "`n=== Phase 3 API and migration policy ===" -ForegroundColor Cyan
    $code = 0
    foreach ($path in @($controllerPath, $servicePath, $foundationMigrationPath, $migrationPath)) {
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
            Write-Error "Required Phase 3 file is missing: $path"
            $code = 1
        }
    }
    if ($code -eq 0) {
        $controller = Get-Content -Raw -LiteralPath $controllerPath
        foreach ($route in @(
            "@Get('tasks')", "@Post('tasks')", "@Patch('tasks/:id/status')",
            "@Post('tasks/:taskId/checklist')", "@Post('tasks/:taskId/comments')",
            "@Get('projects')", "@Post('projects')", "@Get('brands')", "@Post('brands')",
            "@Get('social/reports')", "@Post('social/reports/channel-metrics')",
            "@Get('social/integrations')", "@Post('social/integrations')",
            "@Post('social/integrations/sync')"
        )) {
            if (-not $controller.Contains($route)) {
                Write-Error "Required canonical route is missing: $route"
                $code = 1
            }
        }
        foreach ($checkedMigration in @($foundationMigrationPath, $migrationPath)) {
            $sql = Get-Content -Raw -LiteralPath $checkedMigration
            if ($sql -match '(?im)^\s*(DROP|TRUNCATE|DELETE\s+FROM)\b') {
                Write-Error "Marketing foundation migration contains a destructive statement: $checkedMigration"
                $code = 1
            }
        }
        $sql = Get-Content -Raw -LiteralPath $migrationPath
        if ($sql -notmatch 'marketing_idempotency_keys') {
            Write-Error 'Persistent idempotency table is absent from Phase 3 migration.'
            $code = 1
        }
        $service = Get-Content -Raw -LiteralPath $servicePath
        foreach ($marker in @('VERSION_CONFLICT', 'IDEMPOTENCY_KEY_REUSED', 'aes-256-gcm', 'pg_advisory_xact_lock')) {
            if ($service -notmatch [regex]::Escape($marker)) {
                Write-Error "Required service safety marker is missing: $marker"
                $code = 1
            }
        }
    }
    $results.Add([pscustomobject]@{ Check = 'Phase 3 API and migration policy'; ExitCode = $code })
}

Test-Phase3Contract
Invoke-PhaseCheck 'Prisma schema validation' $backendRoot 'npx' @('prisma', 'validate', '--schema', 'prisma/schema')
Invoke-PhaseCheck 'Marketing backend typecheck' $backendRoot 'npm' @('run', 'typecheck:marketing')
Invoke-PhaseCheck 'Marketing backend tests' $backendRoot 'npm' @('run', 'test:marketing:ci')
Invoke-PhaseCheck 'Marketing frontend typecheck' $frontendRoot 'npm' @('run', 'typecheck:marketing')
Invoke-PhaseCheck 'Backend production build' $backendRoot 'npm' @('run', 'build')

if (-not $SkipRehearsal) {
    Invoke-PhaseCheck 'Phase 3 disposable service rehearsal' $backendRoot 'npm' @('run', 'db:rehearse-marketing-phase3')
}

Write-Host "`n=== Phase 3 summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize
$failed = @($results | Where-Object { $_.ExitCode -ne 0 })
if ($failed.Count -gt 0) {
    Write-Error "Phase 3 verification has $($failed.Count) failing check(s)."
    exit 1
}

Write-Host 'Phase 3 canonical backend checks passed.' -ForegroundColor Green
exit 0
