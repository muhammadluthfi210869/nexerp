# Legacy ERP Crawl Status (in progress)

## Login berhasil
- URL: https://kil.gserp.id
- Email: zaki@dreamlab.id (configured in environment)
- Password: [REDACTED_PER_P00_SECURITY_POLICY] (configured in environment)
- Session cookie: `ci_session=...`, `csrf_cookie_gs=...`
- CSRF handling: per-form token via hidden input `csrf_gs`

## Menu discovery
- Total unique URLs di homepage: **138**
- Total kategori: **87**
- HTML size homepage: 234,599 bytes

### Kategori utama:
- **Manage (CRUD)**: customer, supplier, goods, user, role, warehouse, coa, formulation, dll (~30-an halaman)
- **Approval workflows**: purchase, sales, sample, return, goods-request, cogs (~10 halaman)
- **Production**: schedule-mixing/filling/packaging + production-mixing/filling/packaging (6 halaman)
- **Reports**: balance-sheet, general-ledger, profit-loss, stock, stock-valuation, trial-balance, mutation-goods, follow-up-customer, guest-book (~10 halaman)
- **Dashboards**: 22 halaman (business-development, customer, finance, rnd, production, purchasing, legality, hr (HTTP 500), dll)
- **Sales pipeline**: leads, sales-sample, sales, sales-invoice, sales-payment, sales-return
- **Purchase pipeline**: purchase-request, purchase, purchase-in, purchase-invoice, purchase-payment, purchase-return

## File references untuk SSOT
- `/CRAWL STATUS` (this file)
- `/tmp/menu_urls.txt` — 138 URLs (di sandbox)
- `/tmp/cookies.txt` — session cookie

## Next steps (perlu konfirmasi user)
1. Read NEX_ERP_SCREEN_AND_API_CATALOG.json untuk cross-reference menu vs spec
2. Read KPI_REFERENCE.md untuk KPI definitions
3. Read API_CONTRACT.yaml untuk API contract
4. Spawn parallel subagents untuk crawl per-domain
5. Produce SSOT (Single Source of Truth) document
6. Build gap matrix: live vs NEX spec vs docs