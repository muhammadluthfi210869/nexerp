param(
    [switch]$SkipRehearsal
)

$ErrorActionPreference = 'Continue'
$phaseRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendRoot = Join-Path $phaseRoot 'backend'
$migrationPath = Join-Path $backendRoot 'prisma/migrations/20260910150000_marketing_task_social_foundation/migration.sql'
$results = [System.Collections.Generic.List[object]]::new()

function Invoke-PhaseCheck {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command,
        [string[]]$Arguments
    )

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
    finally {
        Pop-Location
    }
    $results.Add([pscustomobject]@{ Check = $Name; ExitCode = $code })
}

function Test-Phase2Migration {
    Write-Host "`n=== Phase 2 migration policy ===" -ForegroundColor Cyan
    $code = 0
    if (-not (Test-Path -LiteralPath $migrationPath -PathType Leaf)) {
        Write-Error "Phase 2 migration is missing: $migrationPath"
        $code = 1
    }
    else {
        $sql = Get-Content -Raw -LiteralPath $migrationPath
        if ($sql -match '(?im)^\s*(DROP|TRUNCATE|DELETE\s+FROM)\b') {
            Write-Error 'Phase 2 migration contains a destructive statement.'
            $code = 1
        }
        foreach ($table in @(
            'marketing_brands',
            'marketing_task_checklist_items',
            'social_post_media',
            'social_post_metric_snapshots',
            'marketing_reporting_periods',
            'brand_channel_metrics',
            'weekly_social_reports',
            'story_daily_metrics',
            'marketing_channel_funnels',
            'marketing_integration_connections',
            'marketing_integration_sync_jobs'
        )) {
            if ($sql -notmatch [regex]::Escape('"' + $table + '"')) {
                Write-Error "Required Phase 2 table is absent from migration: $table"
                $code = 1
            }
        }
    }
    $results.Add([pscustomobject]@{ Check = 'Phase 2 migration policy'; ExitCode = $code })
}

Invoke-PhaseCheck 'Phase 1 contract' $phaseRoot 'powershell' @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    (Join-Path $phaseRoot 'scripts/verify-marketing-phase1.ps1')
)
Invoke-PhaseCheck 'Prisma schema validation' $backendRoot 'npx' @('prisma', 'validate', '--schema', 'prisma/schema')
Invoke-PhaseCheck 'Migration ledger audit (read only)' $backendRoot 'npm' @('run', 'db:audit-migrations')
Test-Phase2Migration
Invoke-PhaseCheck 'Marketing backend typecheck' $backendRoot 'npm' @('run', 'typecheck:marketing')
Invoke-PhaseCheck 'Marketing backend tests' $backendRoot 'npm' @('run', 'test:marketing')

if (-not $SkipRehearsal) {
    Invoke-PhaseCheck 'Disposable migration rehearsal' $backendRoot 'npm' @('run', 'db:rehearse-marketing-phase2')
}

Write-Host "`n=== Phase 2 summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize
$failed = @($results | Where-Object { $_.ExitCode -ne 0 })
if ($failed.Count -gt 0) {
    Write-Error "Phase 2 verification has $($failed.Count) failing check(s)."
    exit 1
}

Write-Host 'Phase 2 database foundation checks passed.' -ForegroundColor Green
exit 0
