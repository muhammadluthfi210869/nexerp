# [SCR-030] Permintaan Pembelian / PR (Purchase Requisition)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/pembelian/purchase-requests`
- **Legacy GsERP URL:** `/purchase-request`
- **Menu Sidebar:** `4. PEMBELIAN & PENGADAAN > Permintaan Pembelian (PR)` (DIPULIHKAN DARI STATUS HILANG)
- **Hak Akses (RBAC):** `PURCHASING`, `PPIC`, `RND`, `HEAD_DEPT`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Pengajuan kebutuhan pengadaan bahan baku, bahan kemas, atau perlengkapan pabrik oleh departemen peminta sebelum diterbitkan Purchase Order (PO).

---

## 2. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Pengajuan`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Pengajuan | `requestDate` | `DD/MM/YYYY` | Left |
| 3 | No. PR | `prNumber` | Clickable Link: `PR-{YYYYMMDD}-{XXXX}` | Left |
| 4 | Pemohon / Dept | `requesterDept` | Nama Pemohon (Bold) + Departemen | Left |
| 5 | Kategori Pengadaan | `category` | Badge 1 Baris: `BAHAN_BAKU`, `BAHAN_KEMAS`, `OPERASIONAL_PABRIK` | Center |
| 6 | Estimasi Total Nilai | `estimatedTotal` | `Rp #.##0` (Font tabular-nums) | Right |
| 7 | Tingkat Urgensi | `urgency` | Badge 1 Baris: `NORMAL`, `URGENT_PRODUKSI` | Center |
| 8 | Status Approval | `status` | Badge 1 Baris: `DRAFT`, `WAITING_HEAD`, `WAITING_FINANCE`, `APPROVED`, `REJECTED`, `PO_CREATED` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat`, `Approval`, `Buat PO` | Center |

---

## 3. Secondary Window: Form Input PR (Centered Floating Modal)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`).
- **Trigger:** Tombol `+ Buat Permintaan Pembelian`.

| Nama Field | Input Mode | Tipe Komponen | Validasi | Keterangan & Auto-Rules |
|---|---|---|---|---|
| No. Dokumen PR | **AUTO-GENERATE** | Text (Read-Only) | Mandatory | Format: `PR-{YYYYMMDD}-{XXXX}` |
| Tanggal Dibutuhkan | Manual Input | DatePicker | Mandatory | Tanggal barang harus tiba di gudang |
| Kategori Akun CoA | Manual Input | Select | Mandatory | 110401 Bahan Baku, 110402 Bahan Kemas, 510201 Perlengkapan |
| Keperluan / Alasan | Manual Input | TextArea | Mandatory | Contoh: "Kebutuhan SPK Batch 500 Kg Brand X" |
| Keranjang Barang | Dynamic Grid | Table Multi-line | Mandatory | Bahan (SearchSelect), Qty Diminta, Satuan, Estimasi Harga Satuan |

---

## 4. Alur Persetujuan Bertingkat (Approval Matrix)
* Total $\le$ Rp 10.000.000 $\rightarrow$ Cukup Disetujui Head Department.
* Total > Rp 10.000.000 sampai Rp 50.000.000 $\rightarrow$ Disetujui Head Dept + Finance Manager.
* Total > Rp 50.000.000 $\rightarrow$ Wajib Disetujui Direktur.
