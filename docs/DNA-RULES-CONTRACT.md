# DNA-RULES-CONTRACT.md
**Tanggal**: 2026-09-09
**Status**: 🔒 **BINDING CONTRACT** untuk seluruh implementasi NEX ERP

---

## 0. TUJUAN

Dokumen ini adalah **kontrak pengerjaan** yang harus dipatuhi semua agent (audit, frontend, backend, AI). Tujuannya untuk mencegah **hallucination**, **UI hardcode manual**, dan **drift dari spec**.

---

## 1. ZERO-HARDCODE-UI RULE

### 1.1 Sumber Tunggal UI
**Semua** komponen UI HARUS di-import dari:
```typescript
import { ... } from "@/components/dna";
```
Atau subpath:
```typescript
import { DnaTable } from "@/components/dna/table";
import { DnaButton } from "@/components/dna/forms";
```

### 1.2 DILARANG (Hardcode)
| Elemen | Yang Dilarang | Wajib Pakai |
|---|---|---|
| Tabel | `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>` | `<DnaTable>` + `<DnaTableRow>` + `<DnaTableCell>` |
| Form input | `<input type="text">` | `<DnaInput>` |
| Form input date | `<input type="date">` | `<DnaDatePicker>` |
| Select dropdown | `<select>`, `<option>` | `<DnaSelect>` atau `<DnaAutocomplete>` |
| Textarea | `<textarea>` | `<DnaTextarea>` |
| Checkbox | `<input type="checkbox">` | `<DnaCheckbox>` |
| Radio | `<input type="radio">` | `<DnaRadioGroup>` |
| Button | `<button className=...>` | `<DnaButton>` |
| Card | `<div className="rounded-2xl">` | `<DashboardCard>` atau `<DnaDataTableCard>` |
| Modal | `<div className="modal">` | `<DnaModal>` |
| Tabs | custom tab implementation | `<DnaTabs>` |
| Search | `<input type="search">` | `<DnaSearchBar>` |
| Filter dropdown | native `<select>` | `<DnaFilterDropdown>` |
| Avatar | `<img>` | `<DnaAvatar>` |
| Badge | `<span className="badge">` | `<DnaCell.Badge>` |
| Number formatting | `toLocaleString` raw | `<DnaNumberDisplay>` atau `formatIDR()` |
| Date formatting | `new Date().toLocaleDateString()` | `formatIDDate()` atau `<DnaDateDisplay>` |
| Currency | `Rp ${amount}` | `formatIDR(amount)` |

### 1.3 EXCEPTION (yang BOLEH hardcode)
| Elemen | Alasan |
|---|---|
| Layout shell (`<main>`, `<div>`, `<section>`) | Bukan komponen visual |
| Typography (`<h1>`, `<p>`, `<span>` teks biasa) | Bukan komponen visual |
| Custom graph canvas (Recharts, Chart.js) | Library eksternal yang sudah ada wrapper DNA |
| Icon (`lucide-react`) | Icon library |
| Animation primitives (framer-motion) | Utility |

### 1.4 Verifikasi
- CI/ESLint rule TBD: larang `from "@/components/ui/*"` kecuali barrel DNA
- `grep -r "@/components/ui/button" frontend/src/app` harusnya 0 hit (kecuali placeholder)

---

## 2. SPEC-COMPLIANCE RULE

### 2.1 Setiap Field WAJIB punya referensi SCR-NNN
Field di form / kolom di tabel HARUS bisa di-trace ke spec.

```typescript
// ✅ BENAR
<FormField
  label="Nama Pelanggan"          // ← dari SCR-043
  required
  source="SCR-043"               // ← spec-ref
  hint="Brand / Company Name*"
/>

// ❌ SALAH
<FormField label="Customer" />  // ← tidak ada referensi spec
```

### 2.2 Halaman Baru (yang BELUM ADA di codebase)
Untuk setiap SCR yang missing, generate:
- Halaman dengan route sesuai `nexerpRoute` di spec
- Top Metric Cards sesuai spec (urutan HARUS sama dengan Tab/Filter)
- Tabel dengan kolom sesuai spec
- Form input dengan field sesuai spec (wajib/opsional, tipe, hint)
- Action button sesuai spec
- Sub-tab / Modal sesuai spec jika applicable

### 2.3 Halaman Existing (yang SUDAH ADA di codebase)
Untuk setiap gap (input hilang, kolom salah, action missing):
- Tambahkan field/kolom/action sesuai spec
- JANGAN rename/ubah field existing tanpa konfirmasi (backward compatibility)
- Jika ada field "ghost" yang tidak ada di spec, **Tandai sebagai drift**, jangan auto-hapus

### 2.4 Verifikasi
- Tiap page.tsx WAJIB ada `// SPEC: SCR-NNN` comment di header
- Untuk halaman multi-SCR, list SEMUA SCR yang di-cover
- Field yang bukan dari spec WAJIB di-mark `// NON-SPEC:` (drift candidate)

---

## 3. VISUAL-DNA-5-LAYER RULE

Setiap halaman WAJIB punya 5 layer sesuai `VISUAL_DNA.md`:

| Layer | Komponen | Lokasi |
|---|---|---|
| L01 | Top Metric Cards (4-6 cards) | `<DnaTopMetrics>` |
| L02 | Filter Bar (Search + filter chips) | `<DnaFilterBar>` |
| L03 | Tab Navigation (jika applicable) | `<DnaTabs>` |
| L04 | Toolbar (action buttons + bulk actions) | `<DnaToolbar>` |
| L05 | Data Table | `<DnaTable>` |

Halaman tanpa L01-L05 (misal: halaman form, modal) → gunakan `<DnaPageContainer>` + `<DnaPageHeader>`.

---

## 4. BUSINESS-RULE-ENGINE RULE

7 aturan bisnis utama yang HARUS enforced:

| # | Rule | SCR Ref |
|---|---|---|
| R1 | Universal Code Engine — kode generated, tidak manual | SCR-030, 080, Bagian I.1 |
| R2 | 3-Pilar Gudang — Bagus/Reject/Free wajib | SCR-091, Bagian I.3 |
| R3 | Auto-Jurnal — Dr = Cr (balanced) | SCR-079, 080, Bagian I.4 |
| R4 | Approval 3-tier — Head → Finance → Director (>50jt) | Bagian I.2 |
| R5 | AR Gatekeeper — HELD/RELEASED state | SCR-002, SCR-101 |
| R6 | Client Escrow — 0% menyentuh P&L | SCR-077 |
| R7 | Period Lock — Soft Lock warning, Hard Lock read-only | SCR-070 |

---

## 5. AGENT-OUTPUT FORMAT

Semua agent (audit + implementation) WAJIB output markdown dengan struktur:

```markdown
## <Page/Component Name>
- **Path**: `/path/to/file`
- **SPEC**: SCR-NNN (or N/A)
- **Category**: List | Form | Detail | Dashboard

### Gaps Detected
| # | Type | Severity | Description | DNA Component | Spec Ref |
|---|---|---|---|---|---|
| 1 | MISSING_FIELD | HIGH | Field X tidak ada | DnaInput | SCR-NNN |
| 2 | HARDCODED_UI | CRITICAL | Pakai `<input>` raw | DnaDatePicker | - |
| 3 | WRONG_TYPE | MEDIUM | type=text harusnya type=date | DnaDatePicker | - |

### Fix Plan
1. Ganti `<input>` dengan `<DnaDatePicker>` line 245
2. Tambah field `nama_field` per SCR-NNN
3. ...
```

---

## 6. EXCLUSION

Yang TIDAK boleh diubah dalam fase audit/preparation:
- `frontend/src/components/dna/**/*.tsx` (DNA component library itu sendiri)
- `VISUAL_DNA.md` (spek Visual DNA)
- `docs/legacy-erp/*` (spec — read-only)

Yang BOLEH ditambah:
- File baru di `frontend/src/app/**/page.tsx`
- File baru di `frontend/src/components/dna/**` (extended DNA components)
- File baru di `backend/src/modules/**`
- File baru di `backend/prisma/**`

---

## 7. SIGN-OFF

Kontrak ini mengikat semua agent. Pelanggaran = rollback.

**Mode**: STRICT
**Audit baseline**: `docs/_AUDIT_FULL_REPORT_2026-09-09.md` (Score 62/100)
**Target**: Score 90+ dalam 5 sprint
