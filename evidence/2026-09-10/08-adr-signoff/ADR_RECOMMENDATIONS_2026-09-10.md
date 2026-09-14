# ADR Sign-off Recommendations — Phase 0 Evidence Freeze

**Tanggal**: 2026-09-10
**Status**: 🟡 RECOMMENDED (USER ACTION REQUIRED untuk sign-off final)
**Berlaku**: Sebelum R1 Backend Primitives (universal code, 3-pillar gudang, auto-journal, 3-tier approval, RBAC)

---

## Konteks

`docs/legacy-erp/backend/02_OPEN_ADR_TRACKER.md` lists 15 ADR yang masih pending. Dari situ, **4 ADR foundational WAJIB di-sign sebelum R1** karena semua backend primitive akan reference keputusan ini.

ADR lainnya bisa ditunda setelah R1 selesai.

---

## ADR-002: 12 Modul Final + Canonical Routes

**Status**: 🟡 PROPOSED → 🟢 SIGNED recommended

### Rekomendasi Keputusan

| Aspek | Keputusan |
|---|---|
| 12 modul final | YES (per master spec Bagian I & II) |
| Screen count | **176 screens (per JSON catalog)** — bukan 178 (per master spec Bagian II klaim) |
| Modul dengan screen detail (7 modul) | MOD-01 (107), MOD-02 (12), MOD-03 (8), MOD-04 (25), MOD-05 (4), MOD-07 (7), MOD-12 (13) |
| Modul tanpa screen detail (5 modul) | **MOD-06 Production, MOD-08 Design, MOD-09 Legality, MOD-10 Finance, MOD-11 HR** — **WAJIB di-re-nest** ke MOD-01 atau modul yang ada di JSON catalog |
| Route prefix final | **7 prefix** (sesuai JSON catalog): `/master`, `/scm`, `/bussdev`, `/rnd`, `/warehouse`, `/qc`, `/executive` |
| Re-nest strategy | Setiap Production/Legality/Finance/HR/Design screen yang ditemukan di MOD-01 → assign ke modul yang sesuai via audit per-SCR. Tidak menambah route prefix baru. |

### Catatan
- 178 vs 176 mismatch: **JSON catalog menang sebagai SSOT** (otomatis generated dari master spec, lebih akurat).
- 5 modul tanpa screen detail: ini **engineering debt** dari spec legacy yang harus di-handle dengan re-nest, bukan dengan menambah screens baru di spec (yang akan jadi drift lagi).
- Route 7 prefix (vs 12 modul) adalah **acceptable** — banyak modul share route prefix yang sama dengan MOD-01 (Master). Ini pattern legacy yang sudah dipakai.

### Sign-off Statement
```
ADR-002 SIGNED by [user] on [date].
- Screen count: 176 (JSON catalog = SSOT)
- Modul architecture: 12 modul, 7 dengan route prefix aktif
- Re-nest strategy: production/finance/HR/legal/design → MOD-01 atau modul lain via per-SCR audit
- Route prefix final: 7 prefix per legacy G-SERP pattern
```

---

## ADR-003: Universal Code Format

**Status**: 🟡 PROPOSED → 🟢 SIGNED recommended

### Rekomendasi Keputusan

| Aspek | Keputusan |
|---|---|
| 2 varian format | **KEDUA aktif** (toggleable per user preference, default = ringkas) |
| Format lengkap | `DL-{DIV}-{TYPE}-{DDMMYYYY}-{seq4}` — contoh: `DL-FIN-SO-29062026-0001` |
| Format ringkas | `{TYPE}-{DDMMYYYY}-{seq4}` — contoh: `SO-29062026-0001` |
| Sequence | **GLOBAL, NO RESET** sejak sistem hidup (per master spec Bagian I.1) |
| Counter table | `universal_sequence_counter` di Prisma (atomic increment via outbox pattern) |
| Local exception (SCR-105 DP Pembelian) | **RESOLVE** dengan konversi: format `DPB-YYMM-XXXX` → `DL-FIN-DPB-DDMMYYYY-{seq}` atau tetap lokal dengan ADR-003 sub-decision |

### Catatan
- DP Pembelian `DPB-YYMM-XXXX` adalah **inconsistency** di spec legacy. Pilihannya: (a) migrate ke format universal, (b) biarkan lokal dengan alasan legacy.
- **Rekomendasi**: migrate ke format universal, supaya downstream screen (faktur, payment) bisa join via sequence.
- Implementation: tabel `UniversalSequence` di Prisma dengan field `(type, date, counter)` UNIQUE compound. Generate via service `UniversalCodeEngine`.

### Sign-off Statement
```
ADR-003 SIGNED by [user] on [date].
- Format: 2 varian (lengkap + ringkas), user toggleable, default ringkas
- Sequence: GLOBAL, no-reset, atomic via outbox
- DP Pembelian exception: RESOLVED → migrate to universal format
```

---

## ADR-005: Approval Threshold + SoD Policy

**Status**: 🟡 PROPOSED → 🟢 SIGNED recommended

### Rekomendasi Keputusan

| Aspek | Keputusan |
|---|---|
| Threshold Director | **> 50jt → Director approval** (per master spec Bagian I.2) |
| Jenjang | **Staff → Head → Finance → Director (jika > 50jt)** |
| Segregation of Duties | **STRICT** — self-approval ditolak sistem |
| Jenjang Head skip | Head boleh skip 1 step di Fund Request (per spec) — implemented di engine |
| Override | **TIDAK ADA** tanpa Director approval (Director hanya bisa escalate, bukan override) |
| Audit trail | **WAJIB** — setiap approval transition di-log dengan timestamp + actor + reason |

### Catatan
- Approval adalah **highest-risk primitive** karena涉及 uang. SoD strict adalah best practice audit.
- Director override tanpa threshold = **anti-pattern** yang akan di-bypass untuk menghindari audit.
- Rekomendasi audit tahunan: review approval log untuk find "rubber stamping" pattern.

### Sign-off Statement
```
ADR-005 SIGNED by [user] on [date].
- Threshold: 50jt → Director
- Jenjang: Staff → Head → Finance → Director (if > 50jt)
- SoD: STRICT (no self-approval)
- Override: NONE (Director cannot bypass)
- Audit: MANDATORY log per transition
```

---

## ADR-007: Visual DNA 5-Layer Order

**Status**: 🟡 PROPOSED → 🟢 SIGNED recommended

### Rekomendasi Keputusan

| Aspek | Keputusan |
|---|---|
| DNA source of truth | `docs/design/LAYOUT_GOVERNANCE.md` + `docs/DNA-RULES-CONTRACT.md` + `frontend/src/components/dna/COMPONENT_INVENTORY.md` |
| 5-layer order | **Per LAYOUT_GOVERNANCE.md** (sudah ada) |
| Enforcement | ESLint rule `no-raw-ui-import-on-operational` aktif di CI (sudah defined di Phase 0 §A.4) |
| Marketing exception | **YES** — marketing BUKAN operational, boleh raw UI per ADR-014 |
| Visual regression | Chromatic/Percy snapshot baseline dibuat setelah R1 selesai |

### Catatan
- DNA-Layer order HARUS sign dulu karena ini akan dipakai untuk SEMUA division. Drift di sini = drift di 176 screens.
- `LAYOUT_GOVERNANCE.md` sudah ada per Phase 0 REALIGN NOTICE → tidak perlu create new doc, cukup sign sebagai canonical.
- **WAJIB**: visual regression baseline Chromatic sebelum R2 (busdev) mulai. Tanpa baseline, tidak bisa detect drift antar division.

### Sign-off Statement
```
ADR-007 SIGNED by [user] on [date].
- DNA source: LAYOUT_GOVERNANCE.md + DNA-RULES-CONTRACT.md + dna/COMPONENT_INVENTORY.md
- 5-layer order: per LAYOUT_GOVERNANCE.md
- Enforcement: ESLint no-raw-ui-import-on-operational + Husky pre-commit
- Marketing exception: ADR-014 (raw UI allowed)
- Visual regression: Chromatic baseline SET before R2
```

---

## ADR yang BELUM WAJIB (bisa ditunda)

| ADR | Topik | Bisa ditunda karena |
|---|---|---|
| ADR-001 | Canonical Screen Count (176 vs 178) | Sudah ter-resolve lewat ADR-002 (JSON = SSOT) |
| ADR-004 | Vendor/Customer Code Prefix | Tidak blocking backend primitive |
| ADR-006 | Maximum KPI Cards | Tidak blocking primitive, UI-only |
| ADR-008 | Dashboard vs Marketing Visual Exception | Sub-decision dari ADR-007 + 014 |
| ADR-009 | Negative-Stock Policy | Operational rule, batch record R-level |
| ADR-010 | Costing Method + Rounding | Operational rule, finance R-level |
| ADR-011 | Retention / Backup / RPO / RTO | Infrastructure, bisa di Phase 5 Hardening |
| ADR-012 | Release Train Order | Eksekusi, bukan blocking |
| ADR-013 | Legacy shadcn (`frontend/src/components/ui/`) | Cleanup strategy, R1 selesai baru apply |
| ADR-014 | Marketing Module Exception (DNA-Only) | Sub-decision ADR-007, tapi boleh sign parallel |
| ADR-015 | Commitlint Strict vs Flexible | Process tweak, low risk |

---

## Cara Sign-off (per Phase 0 README)

Update `docs/legacy-erp/backend/02_OPEN_ADR_TRACKER.md`:
1. Ubah status dari 🟡 PROPOSED → 🟢 SIGNED
2. Isi kolom `Decision` dengan teks sign-off di atas
3. Tambah baris `Signed by: [user] | Signed at: [date]`

Contoh:
```markdown
### ADR-002: 12 Modul Final + Canonical Routes
- **Status**: 🟢 SIGNED
- **Signed by**: Muhammad Luthfi
- **Signed at**: 2026-09-10
- **Decision**: Screen count 176 (JSON = SSOT). 7 route prefix. 5 modul tanpa detail → re-nested via per-SCR audit.
```

---

## Recommended Sequence

1. **Sign ADR-002 dulu** (modul + route = fondasi paling awal)
2. **Sign ADR-003** (universal code = backend primitive #1)
3. **Sign ADR-005** (approval = backend primitive #2)
4. **Sign ADR-007** (visual DNA = frontend primitive #1)

Lalu mulai R1 Backend Primitives (universal code engine → 3-tier approval → RBAC → outbox base).

---

## File Reference

- Source: `docs/legacy-erp/backend/02_OPEN_ADR_TRACKER.md`
- Phase 0 README: `docs/legacy-erp/backend/README.md`
- Strict Policies (DNA enforcement): `docs/legacy-erp/backend/STRICT_POLICIES_ADDENDUM.md` §A
- Memory: `delivery_strategy`, `r1_release_scope`, `dna_only_policy`, `module_integration`

---

**Setelah ADR 4 foundational di-sign, Phase 0 Evidence Freeze fully complete (kecuali VPS SSH/DB backup yang butuh maintenance window).**
