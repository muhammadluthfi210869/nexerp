# Route Mapping v2 — Auto-Generated from Actual Files

**Generated**: 2026-09-10T12:54:50.414Z
**Source**: `frontend/src/app/(dashboard)/` (actual page.tsx files)
**Method**: keyword scoring + manual overrides for ambiguous cases
**Total pages**: 229
**Classified**: 229
**Remaining REVIEW**: 0

## Distribution by Hybrid Function

| Function | Pages | % |
|---|---|---|
| /finance | 35 | 15% |
| /master | 25 | 11% |
| /exec | 24 | 10% |
| /samples | 22 | 10% |
| /inventory | 22 | 10% |
| /penjualan | 21 | 9% |
| /quality | 20 | 9% |
| /pembelian | 20 | 9% |
| /production | 15 | 7% |
| /approvals | 13 | 6% |
| /reports | 12 | 5% |

## Next Steps

1. User review this map for any final corrections
2. Once approved, execute atomic batch reorg per function:
   - Rename folders from current URLs to /<function>/...
   - Update imports/references
   - Run vitest after each batch
3. Update Sidebar.tsx to show grouped menu per function
4. Build RBAC menu filter (4 layers deep)

## Key Findings

- ERP frontend has **229 page.tsx files** (not 176 as legacy spec claimed) — 53 NEW pages added beyond legacy
- **172 unique URL prefixes** at top level — flat structure needs reorg
- **22 divisions** in frontend (finance, hr, production, marketing, etc.) NOT in legacy ERP spec — these are new additions
- Sidebar.tsx (1400+ lines) is the primary UX surface needing restructure
