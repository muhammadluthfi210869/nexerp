$ErrorActionPreference = 'Stop'
$contractRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$contractPath = Join-Path $contractRoot 'docs/marketing/phase-1-contract.json'
$matrixPath = Join-Path $contractRoot 'docs/marketing/PHASE-1-FEATURE-MATRIX.csv'
$productDocPath = Join-Path $contractRoot 'docs/marketing/PHASE-1-PRODUCT-UI-CONTRACT.md'
$failures = [System.Collections.Generic.List[string]]::new()

function Add-Failure([string]$Message) {
    $failures.Add($Message)
}

function Test-UniqueValues {
    param([object[]]$Values, [string]$Label)
    $duplicates = @($Values | Group-Object | Where-Object Count -gt 1)
    foreach ($duplicate in $duplicates) {
        Add-Failure "$Label contains duplicate '$($duplicate.Name)'."
    }
}

foreach ($requiredFile in @($contractPath, $matrixPath, $productDocPath)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        Add-Failure "Required Phase 1 artifact is missing: $requiredFile"
    }
}

if ($failures.Count -eq 0) {
    try {
        $contract = Get-Content -Raw -LiteralPath $contractPath | ConvertFrom-Json
        $features = @(Import-Csv -LiteralPath $matrixPath)
    }
    catch {
        Add-Failure "Contract artifact could not be parsed: $($_.Exception.Message)"
    }
}

if ($failures.Count -eq 0) {
    if ($contract.contractVersion -notmatch '^\d+\.\d+\.\d+$') {
        Add-Failure 'contractVersion must use semantic versioning.'
    }
    if ($contract.status -ne 'FROZEN_FOR_PHASE_2') {
        Add-Failure 'Contract status must be FROZEN_FOR_PHASE_2.'
    }

    $routeIds = @($contract.routes | ForEach-Object id)
    $routePaths = @($contract.routes | ForEach-Object path)
    Test-UniqueValues $routeIds 'Route IDs'
    Test-UniqueValues $routePaths 'Route paths'

    foreach ($route in $contract.routes) {
        if ($route.path -notmatch '^/marketing/') {
            Add-Failure "Route '$($route.id)' is outside /marketing."
        }
    }

    $knownRoles = @($contract.roles)
    foreach ($capability in $contract.rbac.PSObject.Properties) {
        foreach ($role in @($capability.Value)) {
            if ($knownRoles -notcontains $role) {
                Add-Failure "RBAC '$($capability.Name)' uses unknown role '$role'."
            }
        }
    }

    foreach ($machine in $contract.statusMachines.PSObject.Properties) {
        $values = @($machine.Value.values)
        Test-UniqueValues $values "Status machine '$($machine.Name)'"
        foreach ($terminal in @($machine.Value.terminal)) {
            if ($values -notcontains $terminal) {
                Add-Failure "Terminal status '$terminal' is absent from '$($machine.Name)'."
            }
        }
        if ($machine.Value.legacyAliases) {
            foreach ($alias in $machine.Value.legacyAliases.PSObject.Properties) {
                if ($values -notcontains $alias.Value) {
                    Add-Failure "Legacy alias '$($alias.Name)' maps to unknown status '$($alias.Value)'."
                }
            }
        }
    }

    if ($features.Count -lt 25) {
        Add-Failure 'Feature matrix is unexpectedly incomplete.'
    }
    Test-UniqueValues @($features | ForEach-Object id) 'Feature IDs'
    Test-UniqueValues @($features | ForEach-Object acceptance_id) 'Acceptance IDs'

    foreach ($feature in $features) {
        if ($feature.id -notmatch '^DM-(TASK|SOC|REP|INT)-\d{3}$') {
            Add-Failure "Invalid feature ID '$($feature.id)'."
        }
        if (@('P0', 'P1', 'P2') -notcontains $feature.priority) {
            Add-Failure "Feature '$($feature.id)' has invalid priority '$($feature.priority)'."
        }
        if (@('R1', 'R2') -notcontains $feature.release) {
            Add-Failure "Feature '$($feature.id)' has invalid release '$($feature.release)'."
        }
        if ($routeIds -notcontains $feature.route_id) {
            Add-Failure "Feature '$($feature.id)' references unknown route '$($feature.route_id)'."
        }
        if ($feature.write_roles -ne 'NONE') {
            foreach ($role in $feature.write_roles.Split('|')) {
                if ($knownRoles -notcontains $role) {
                    Add-Failure "Feature '$($feature.id)' uses unknown write role '$role'."
                }
            }
        }
    }

    $currentRouteFiles = @(
        'frontend/src/app/(dashboard)/marketing/management-task/page.tsx',
        'frontend/src/app/(dashboard)/marketing/management-task/[member]/page.tsx',
        'frontend/src/app/(dashboard)/marketing/social-tracker/page.tsx'
    )
    foreach ($relativeFile in $currentRouteFiles) {
        if (-not (Test-Path -LiteralPath (Join-Path $contractRoot $relativeFile) -PathType Leaf)) {
            Add-Failure "Current contracted route file is missing: $relativeFile"
        }
    }

    $taskEntryPath = Join-Path $contractRoot 'frontend/src/app/(dashboard)/marketing/management-task/page.tsx'
    $taskEntry = Get-Content -Raw -LiteralPath $taskEntryPath
    if ($taskEntry -match 'localStorage') {
        Add-Failure 'Management Task entry must not route identity from localStorage.'
    }
    if ($taskEntry -notmatch 'management-task/overview') {
        Add-Failure 'Management Task entry must redirect to the canonical overview.'
    }

    $sidebarPath = Join-Path $contractRoot 'frontend/src/components/layout/Sidebar.tsx'
    $sidebar = Get-Content -Raw -LiteralPath $sidebarPath
    $sectionMatch = [regex]::Match($sidebar, 'const DIGIMAR_SECTIONS:[\s\S]*?const DESIGN_SECTIONS:')
    if (-not $sectionMatch.Success) {
        Add-Failure 'Digital Marketing sidebar section could not be located.'
    }
    else {
        $destinationCount = [regex]::Matches($sectionMatch.Value, 'id:\s*"dm-').Count
        if ($destinationCount -ne 4) {
            Add-Failure "Digital Marketing sidebar must contain exactly 4 destinations; found $destinationCount."
        }
    }
}

if ($failures.Count -gt 0) {
    Write-Host 'Phase 1 contract verification FAILED:' -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host " - $failure" -ForegroundColor Red
    }
    exit 1
}

Write-Host 'Phase 1 contract verification passed.' -ForegroundColor Green
Write-Host "Features: $($features.Count)"
Write-Host "Routes:   $($contract.routes.Count)"
Write-Host "Roles:    $($contract.roles.Count)"
Write-Host 'Digital Marketing sidebar destinations: 4'
exit 0
