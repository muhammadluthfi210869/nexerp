# QA Gate — Fase 4: Frontend DNA Unification & Type-Safe API Layer

Tanggal: 2026-09-27
Branch: `feat/p08-contracts-subject-ownership`
Slice: **4.1, 4.2 & 4.3** — Dekomposisi `DnaInteractiveElements.tsx`, Type-Safe API Client Adapter & DNA Boundary Ratchet Hardening
Status: **BELUM SIAP KIRIM** (live smoke test, rollback teruji, dan P03 pending deploy)

---

## 0. Ringkas

Fase 4 menangani skalabilitas dan kebersihan arsitektur frontend tanpa menyebabkan regresi visual atau merusak DNA design system.

### Slice 4.1 — Dekomposisi `DnaInteractiveElements.tsx`
Membongkar mega-file `frontend/src/components/dna/DnaInteractiveElements.tsx` (1.559 baris, 35 exported symbols) menjadi 6 sub-modul atomik di bawah `frontend/src/components/dna/dna-interactive/`:

| Modul | Baris | Simbol Utama |
|---|--:|---|
| `inputs.tsx` | 313 | `DnaCurrencyInput`, `DnaNumberInput`, `DnaPercentageInput`, `DnaDatePicker`, `DnaSearchableSelect`, `DnaSwitch` |
| `modals.tsx` | 239 | `DnaCrudModal`, `DnaConfirmDialog`, `DnaVoidDialog` |
| `result-print.tsx` | 338 | `DnaResultModal`, `DnaPrintModal`, `DnaPrintItem`, `DnaPrintSignature`, `DnaExportButton` |
| `workflow.tsx` | 267 | `DnaLineItemsTable`, `DnaWorkflowBar` |
| `toast.tsx` | 44 | `useDnaToast`, `DnaToastProvider` |
| `layout.tsx` | 400 | `DnaFormSection`, `DnaCascadingAddress`, `DnaInfoCard`, `DnaCard` (legacy), `DnaRadioGroup`, `DnaStickyFooter` |
| `index.ts` | 13 | Barrel re-export seluruh 6 modul |
| `DnaInteractiveElements.tsx` | 10 | Fasad re-export 100% backward compatible |

### Slice 4.2 — Type-Safe API Client Adapter & `useApiQuery` Adoption
1. **Standarisasi Kontrak Respon & Client HTTP**:
   - `frontend/src/lib/api-client.ts`: Memperkenalkan generic `ApiResponse<T>`, `ApiPaginatedResponse<T>`, `unwrapData<T>`, typed `apiClient` helper (`get`, `post`, `patch`, `put`, `delete`), dan hook factory `createApiQueryHook`.
   - Unit test suite: `frontend/src/lib/__tests__/api-client.test.ts` (9 tests PASS).
2. **Hardening `useApiQuery`**:
   - Mengatur `retry: false` otomatis di lingkungan pengujian (`NODE_ENV === 'test'`) untuk mencegah test timeout pada skenario failure/error state.
3. **Adopsi pada Rute Acuan Emas (Golden Reference Routes)**:
   - `visual-dna/golden-reference/page.tsx`: Migrasi query `production-work-orders` dan `production-leads` ke `useApiQuery` + `unwrapData`.
   - `creative/finalized/page.tsx`: Migrasi `creative/finalized` query ke `useApiQuery` + `unwrapData`.
   - `penjualan/sales-orders/page.tsx`: Migrasi `commercial-sales-orders` dan `master-customers-dropdown` ke `useApiQuery` + `unwrapData`.

### Slice 4.3 — DNA Boundary & Dashboard Integrity Hardening
1. **Verifikasi Isolasi `@/components/ui`**:
   - Terverifikasi **0 file** di seluruh `frontend/src/app` yang mengimpor dari `@/components/ui`.
2. **Eliminasi Total `no-restricted-imports`**:
   - Mengarahkan sisa 3 import lawas pada `my-dashboard/page.tsx` (`KpiCard`, `SectionLabel`) dan `logistics/fleet/page.tsx` (`DashboardCard`) ke barrel terpadu `@/components/dna`.
   - Pelanggaran `no-restricted-imports` turun dari 3 menjadi **0 (ZERO)**.
3. **Penyempurnaan Ratchet Baseline (`scripts/dna-boundary-baseline.json`)**:
   - `no-restricted-imports`: 3 → 0.
   - `@typescript-eslint/no-unused-vars`: 807 → 805 (-2).
4. **Proteksi Integritas Dashboard Aureon Matrix**:
   - 13 dashboard departemen acuan (`old_erp/ACUAN_DASHBOARD`) tetap 100% terkunci pada styling Aureon Matrix tanpa substitusi komponen DNA operasional.
   - 12/12 dashboard snapshot tests (`dashboard/__tests__/*.snapshot.test.tsx`) PASS dengan zero visual drift.

---

## 1. Zero Visual Drift & Kontrak Publik Terjaga

- **100% Backward Compatible**: 109+ file yang mengimpor dari `@/components/dna` dan 2 file yang mengimpor langsung dari `DnaInteractiveElements` tidak mengalami perubahan path maupun signature.
- **DNA Boundary Ratchet**: Berhasil menurunkan `no-restricted-imports` menjadi 0 dan `@typescript-eslint/no-unused-vars` menjadi 805.
- **Aturan Dashboard**: 13 dashboard departemen acuan (`old_erp/ACUAN_DASHBOARD`) tetap terjaga dengan styling Aureon Matrix dan tidak diubah ke komponen DNA operasional.

---

## 2. Hasil Pengujian & Gerbang Kualitas

| Gerbang | Perintah | Hasil |
|---|---|---|
| Frontend Typecheck | `cd frontend && npx tsc --noEmit` | **rc 0** (0 error) |
| Backend Typecheck | `cd backend && npm run typecheck` | **rc 0** (0 error) |
| Frontend Vitest (Unit) | `npm test -- src/lib/__tests__/api-client.test.ts` | **1/1 files PASS**, **9/9 tests PASS** |
| Frontend Vitest (Decomposition) | `npm test -- src/components/dna/__tests__/dna-interactive-decomposition.test.tsx` | **1/1 files PASS**, **9/9 tests PASS** |
| Frontend Vitest (Behavior) | `npm test -- 'src/app/(dashboard)/creative/finalized/__tests__/p08-live-flow.behavior.test.tsx'` | **1/1 files PASS**, **27/27 tests PASS** |
| Frontend Vitest (Shape Guards) | `npm test -- 'src/app/(dashboard)/__tests__/live-shape-crash-guards.behavior.test.tsx'` | **1/1 files PASS**, **4/4 tests PASS** |
| Frontend Vitest (Dashboard Snapshots) | `npm test -- 'src/app/(dashboard)/dashboard/__tests__/'` | **6/6 files PASS**, **12/12 tests PASS** |
| Frontend Linter | `cd frontend && npm run lint` | **rc 0** (0 error) |
| DNA Boundary Gate | `node scripts/dna-boundary-gate.mjs` | **PASS (DNA boundary held, imports=0, unused=805)** |
| SSOT Validation | `node scripts/ssot/validate_ssot.js` | **19/19 PASS (CERTIFIED)** |
| Lifecycle Audit | `node scripts/ssot/audit_lifecycle_reconciliation.js` | **14/14 PASS** |
| Shell Test Suite | `bash scripts/__tests__/run-all.sh` | **26/26 PASS** |
