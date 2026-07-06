# ERP Testing & Deployment Scripts

Semua script untuk testing, load test, reconciliation, dan DR.

## Prasyarat

| Tool | Install | Untuk |
|------|---------|-------|
| PowerShell 5.1+ | Built-in Windows | API E2E tests |
| Playwright | `npm install` di `frontend/` | UI smoke tests |
| k6 | `winget install k6` | Load test |
| psql | PostgreSQL client | Reconciliation SQL |
| Docker | Docker Desktop | DR drill |

## Cara Pakai

### 1. API E2E Tests (10 scenario)
```powershell
.\scripts\e2e-api-tests.ps1
```
Tests: Lead creation, pipeline advance, sample request, SO, invoice, cancel, stock check.

### 2. Playwright UI Smoke Tests (18 tests)
```powershell
cd frontend
npx playwright test tests/e2e/smoke-forms/
```
Tests: Auth flow, form input per divisi, cross-division visibility, error resilience.

### 3. Load Test (k6)
```powershell
# Dapatkan JWT token dulu
$r = Invoke-WebRequest -Uri "http://localhost:3002/auth/login" -Method Post `
  -Body '{"email":"admin@nexerp.id","password":"password123"}' -ContentType "application/json"
$token = ($r.Content | ConvertFrom-Json).access_token

k6 run scripts/load-test.js --env JWT=$token --env BASE_URL=http://localhost:3002
```
Scenario: 6 concurrent VUs, 30s duration, 6 endpoint mix (read/write).

### 4. Month-End Reconciliation SQL
```bash
psql -d erp_db -f scripts/reconcile-month-end.sql
```
Checks: Trial balance, period rollover, AR aging, stock accuracy, P&L, balance sheet.

### 5. Disaster Recovery Drill
```bash
bash scripts/dr-drill.sh
```
Fase: Check backup -> Stop services -> Drop DB -> Restore -> Start -> Smoke test.

### 6. Daily Reconciliation Cron (deploy ke server)
```bash
# Crontab (every day at 06:00)
0 6 * * * /path/to/scripts/daily-reconcile.sh
```

## Hasil Test Terakhir (2026-06-26)

| Test | Result |
|------|--------|
| API E2E (10 scenario) | ✅ 10/10 PASS |
| Playwright UI (18 tests) | ✅ 18/18 PASS |
| k6 Load Test (6 VUs, 30s) | ✅ 112/112 requests, 0 errors, p95=60ms |

> **Note**: Pada dev server, gunakan --workers=1 untuk menghindari timeout karena Next.js compilation.