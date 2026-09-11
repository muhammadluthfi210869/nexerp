#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$FrontendRoot = "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Read-Utf8NoBom([string]$p) {
    return [System.IO.File]::ReadAllText($p, $utf8NoBom)
}

function Write-Utf8NoBom([string]$p, [string]$content) {
    [System.IO.File]::WriteAllText($p, $content, $utf8NoBom)
}

function Migrate-File {
    param([string]$Path)
    $abs = Join-Path $FrontendRoot $Path
    if (-not (Test-Path $abs)) {
        Write-Host "  MISSING: $abs"
        return @{ ok = $false; reason = "missing" }
    }
    $content = Read-Utf8NoBom $abs
    $original = $content

    # Capture all shadcn imports: import { X, Y } from "@/components/ui/Z";
    # Multiline-capable via (?s) dotall
    $uiImportPattern = '(?ms)^import\s*\{\s*([^{}]+?)\s*\}\s*from\s*"@/components/ui/[a-z\-]+";\s*\r?\n'

    $uiMatches = [regex]::Matches($content, $uiImportPattern)
    if ($uiMatches.Count -eq 0) {
        Write-Host "  SKIP: no @/components/ui imports"
        return @{ ok = $false; reason = "no_shcnd" }
    }

    # Collect shadcn names
    $shadcnNames = New-Object System.Collections.Generic.HashSet[string]
    foreach ($m in $uiMatches) {
        $names = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        foreach ($n in $names) { [void]$shadcnNames.Add($n) }
    }

    # Remove all shadcn import statements
    $content = [regex]::Replace($content, $uiImportPattern, '')

    $namesArr = @($shadcnNames | Sort-Object)
    $newImport = "import { $($namesArr -join ', ') } from ""@/components/dna"";`r`n"

    # Merge into existing barrel import (no subdir after /dna) if present
    $barrelPattern = '(?ms)^import\s*\{\s*([^{}]+?)\s*\}\s*from\s*"@/components/dna";\s*\r?\n'
    $barrelMatch = [regex]::Match($content, $barrelPattern)

    if ($barrelMatch.Success) {
        $existingNames = $barrelMatch.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        $merged = New-Object System.Collections.Generic.HashSet[string]
        foreach ($n in $existingNames) { [void]$merged.Add($n) }
        foreach ($n in $namesArr) { [void]$merged.Add($n) }
        $sortedMerged = @($merged | Sort-Object)
        $replacement = "import { $($sortedMerged -join ', ') } from ""@/components/dna"";`r`n"
        $content = $content.Substring(0, $barrelMatch.Index) + $replacement + $content.Substring($barrelMatch.Index + $barrelMatch.Length)
    } else {
        # Insert after the "use client" directive (or at top)
        $useClientIdx = $content.IndexOf('"use client"')
        if ($useClientIdx -ge 0) {
            $nl = $content.IndexOf("`n", $useClientIdx)
            if ($nl -ge 0) {
                $insertAt = $nl + 1
                # skip one blank line if present
                if ($content.Length -gt $insertAt -and $content[$insertAt] -eq "`r") { $insertAt++ }
                if ($content.Length -gt $insertAt -and $content[$insertAt] -eq "`n") { $insertAt++ }
                $content = $content.Substring(0, $insertAt) + $newImport + $content.Substring($insertAt)
            } else {
                $content = $newImport + $content
            }
        } else {
            $content = $newImport + $content
        }
    }

    if ($content -ne $original) {
        Write-Utf8NoBom $abs $content
        Write-Host "  MIGRATED: $($shadcnNames.Count) primitives -> barrel"
        return @{ ok = $true; count = $shadcnNames.Count }
    } else {
        Write-Host "  NO-CHANGE"
        return @{ ok = $false; reason = "no_change" }
    }
}

$targets = @(
    'src/app/(dashboard)/finance/cogs-request/page.tsx',
    'src/app/(dashboard)/warehouse/hub/page.tsx',
    'src/app/(dashboard)/warehouse/workstation/page.tsx'
)

Write-Host "=== Migration start ==="
$results = @()
foreach ($t in $targets) {
    Write-Host ""
    Write-Host "FILE: $t"
    try {
        $r = Migrate-File -Path $t
        $results += @{ file = $t; ok = $r.ok; reason = $r.reason; count = $r.count }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)"
        $results += @{ file = $t; ok = $false; reason = $_.Exception.Message }
    }
}
Write-Host ""
Write-Host "=== Summary ==="
$results | ForEach-Object { Write-Host "$($_.file) :: ok=$($_.ok) reason=$($_.reason) count=$($_.count)" }
