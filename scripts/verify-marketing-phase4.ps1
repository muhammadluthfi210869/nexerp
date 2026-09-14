param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Continue'
$phaseRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendRoot = Join-Path $phaseRoot 'backend'
$frontendRoot = Join-Path $phaseRoot 'frontend'

$taskWorkspacePath = Join-Path $frontendRoot 'src/app/(dashboard)/marketing/management-task/TaskWorkspace.tsx'
$socialPlannerPath = Join-Path $frontendRoot 'src/app/(dashboard)/marketing/social-tracker/SocialPlanner.tsx'
$reportingPath = Join-Path $frontendRoot 'src/app/(dashboard)/marketing/social-tracker/reporting/MarketingReporting.tsx'
$integrationsPath = Join-Path $frontendRoot 'src/app/(dashboard)/marketing/social-tracker/integrations/MarketingIntegrations.tsx'
$hooksPath = Join-Path $frontendRoot 'src/hooks/useCanonicalMarketing.ts'

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

function Test-Phase4FrontendFiles {
    Write-Host "`n=== Phase 4 Canonical Frontend Route & Component Contract ===" -ForegroundColor Cyan
    $code = 0
    $requiredFiles = @($taskWorkspacePath, $socialPlannerPath, $reportingPath, $integrationsPath, $hooksPath)
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
            Write-Error "Missing required production component: $file"
            $code = 1
        }
    }

    # Verify zero calls to /marketing/prototype in frontend marketing directory
    $mktDir = Join-Path $frontendRoot 'src/app/(dashboard)/marketing'
    $tsFiles = Get-ChildItem -Path $mktDir -Filter *.tsx -Recurse
    foreach ($f in $tsFiles) {
        $content = Get-Content -Raw -LiteralPath $f.FullName
        if ($content -match '/marketing/prototype') {
            Write-Error "Found prototype endpoint call in production file: $($f.FullName)"
            $code = 1
        }
    }

    if ($code -eq 0) {
        Write-Host "All canonical frontend files present and zero prototype calls detected." -ForegroundColor Green
    }
    $results.Add([pscustomobject]@{ Check = 'Canonical Frontend Files & Zero Prototype Calls'; ExitCode = $code })
}

Test-Phase4FrontendFiles
Invoke-PhaseCheck 'Marketing backend typecheck' $backendRoot 'npm' @('run', 'typecheck:marketing')
Invoke-PhaseCheck 'Marketing backend tests (79 unit tests)' $backendRoot 'npm' @('run', 'test:marketing')
Invoke-PhaseCheck 'Marketing frontend typecheck' $frontendRoot 'npm' @('run', 'typecheck:marketing')
Invoke-PhaseCheck 'Frontend canonical hook tests (Vitest)' $frontendRoot 'npx' @('vitest', 'run', 'src/hooks/useCanonicalMarketing.test.ts')
Invoke-PhaseCheck 'Active database migration ledger audit' $backendRoot 'npm' @('run', 'db:audit-migrations')

if (-not $SkipBuild) {
    Invoke-PhaseCheck 'Backend production build' $backendRoot 'npm' @('run', 'build')
}

Write-Host "`n=== Phase 4 & Hardening Verification Summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize
$failed = @($results | Where-Object { $_.ExitCode -ne 0 })
if ($failed.Count -gt 0) {
    Write-Error "Phase 4 verification failed with $($failed.Count) failing check(s)."
    exit 1
}

Write-Host "`nAll Phase 4 & Hardening Quality Gates PASSED." -ForegroundColor Green
exit 0
