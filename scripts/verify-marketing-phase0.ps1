param(
    [switch]$SkipDatabase
)

$ErrorActionPreference = 'Continue'
$phaseRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
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

Invoke-PhaseCheck 'Backend build' (Join-Path $phaseRoot 'backend') 'npm' @('run', 'build')
Invoke-PhaseCheck 'Marketing backend typecheck' (Join-Path $phaseRoot 'backend') 'npm' @('run', 'typecheck:marketing')
Invoke-PhaseCheck 'Marketing task/social unit tests' (Join-Path $phaseRoot 'backend') 'npm' @('run', 'test:marketing')
Invoke-PhaseCheck 'Marketing task/social frontend typecheck' (Join-Path $phaseRoot 'frontend') 'npm' @('run', 'typecheck:marketing')

if (-not $SkipDatabase) {
    Invoke-PhaseCheck 'Marketing database inventory (read only)' (Join-Path $phaseRoot 'backend') 'npm' @('run', 'db:status')
    Invoke-PhaseCheck 'Prisma migration history (read only)' (Join-Path $phaseRoot 'backend') 'npx' @('prisma', 'migrate', 'status')
}

Write-Host "`n=== Phase 0 summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.ExitCode -ne 0 })
if ($failed.Count -gt 0) {
    Write-Error "Phase 0 preflight has $($failed.Count) failing check(s). Do not deploy migrations."
    exit 1
}

Write-Host 'Phase 0 checks passed.' -ForegroundColor Green
exit 0
