#requires -Version 5.1
$ErrorActionPreference = 'SilentlyContinue'
Set-Location "C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend"

$files = @(
'src/app/(dashboard)/finance/accounting/auto-journal/page.tsx',
'src/app/(dashboard)/finance/accounting/coa/page.tsx',
'src/app/(dashboard)/finance/actual-costing/page.tsx',
'src/app/(dashboard)/finance/ap-aging/page.tsx',
'src/app/(dashboard)/finance/assets/page.tsx',
'src/app/(dashboard)/finance/audit-ledger/page.tsx',
'src/app/(dashboard)/finance/bank-accounts/page.tsx',
'src/app/(dashboard)/finance/bank-reconciliation/page.tsx',
'src/app/(dashboard)/finance/bayar-sample/page.tsx',
'src/app/(dashboard)/finance/bayar/page.tsx',
'src/app/(dashboard)/finance/bills/page.tsx',
'src/app/(dashboard)/finance/budget/page.tsx',
'src/app/(dashboard)/finance/cash-in/page.tsx',
'src/app/(dashboard)/finance/cash-out/page.tsx',
'src/app/(dashboard)/finance/client-escrow/page.tsx',
'src/app/(dashboard)/finance/closing/page.tsx',
'src/app/(dashboard)/finance/cogs-request-rnd/page.tsx',
'src/app/(dashboard)/finance/cogs-request/page.tsx',
'src/app/(dashboard)/finance/collections/page.tsx',
'src/app/(dashboard)/finance/dashboard-advanced/page.tsx',
'src/app/(dashboard)/finance/fund-requests/page.tsx',
'src/app/(dashboard)/finance/fund/page.tsx',
'src/app/(dashboard)/finance/inventory-valuation/page.tsx',
'src/app/(dashboard)/finance/invoices/page.tsx',
'src/app/(dashboard)/finance/journal/page.tsx',
'src/app/(dashboard)/finance/jurnal/page.tsx',
'src/app/(dashboard)/finance/kas/page.tsx',
'src/app/(dashboard)/finance/lap-keuangan/page.tsx',
'src/app/(dashboard)/finance/penjualan-finance/page.tsx',
'src/app/(dashboard)/finance/petty-cash/page.tsx',
'src/app/(dashboard)/finance/piutang/page.tsx',
'src/app/(dashboard)/finance/reports/page.tsx',
'src/app/(dashboard)/finance/tax-transactions/page.tsx',
'src/app/(dashboard)/finance/transactions/page.tsx',
'src/app/(dashboard)/finance/xendit/page.tsx',
'src/app/(dashboard)/warehouse/adjustment/AdjustmentClient.tsx',
'src/app/(dashboard)/warehouse/components/AuditTables.tsx',
'src/app/(dashboard)/warehouse/components/Rankings.tsx',
'src/app/(dashboard)/warehouse/hub/page.tsx',
'src/app/(dashboard)/warehouse/inbound/page.tsx',
'src/app/(dashboard)/warehouse/release/ReleaseClient.tsx',
'src/app/(dashboard)/warehouse/transfers/page.tsx',
'src/app/(dashboard)/warehouse/workstation/page.tsx',
'src/app/(dashboard)/production/mixing/page.tsx',
'src/app/(dashboard)/production/filling/page.tsx',
'src/app/(dashboard)/production/packaging/page.tsx',
'src/app/(dashboard)/production/page.tsx',
'src/app/(dashboard)/inventory/production-warehouse/page.tsx',
'src/app/(dashboard)/inventory/formula-adjustment-production/page.tsx'
)

Write-Host "=== Files with shadcn ui imports ==="
$total = 0
$bothCount = 0
foreach ($f in $files) {
    if (-not (Test-Path $f)) {
        Write-Host "MISSING: $f"
        continue
    }
    $content = Get-Content $f -Raw
    $uiMatches = [regex]::Matches($content, 'from "@/components/ui/')
    $dnaMatches = [regex]::Matches($content, 'from "@/components/dna')
    $ui = $uiMatches.Count
    $dna = $dnaMatches.Count
    if ($ui -gt 0) {
        $total++
        if ($dna -gt 0) { $bothCount++ }
        $prims = ([regex]::Matches($content, '"@/components/ui/([a-z\-]+)"') | ForEach-Object { $_.Groups[1].Value }) -join ','
        Write-Host "ui=$ui dna=$dna PRIMS=$prims :: $f"
    }
}
Write-Host ""
Write-Host "Files needing migration: $total"
Write-Host "Files with both ui+dna already: $bothCount"
