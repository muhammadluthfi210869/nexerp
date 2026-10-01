# [SCR-046] Penerimaan Barang Masuk (Inbound Goods & Receiving Slips)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/warehouse/inbound`
- **Menu Sidebar:** `4. GUDANG & LOGISTIK > Inbound Goods`
- **Hak Akses (RBAC):** `WAREHOUSE`, `QC`, `PPIC`, `SUPERADMIN`
- **Tujuan Operasional:** Pencatatan penerimaan fisik kiriman vendor (Purchase Order / Supplier Surat Jalan), pembuatan Laporan Penerimaan Barang (LPB), dan alokasi ke zona karantina QC.

---

## 2. Struktur Tabel Utama
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Masuk | `receivedDate` | `DD/MM/YYYY` | Left |
| 3 | No. LPB / Inbound | `inboundNumber` | `LPB-{YYYYMM}-{XXXX}` | Left |
| 4 | No. PO & Surat Jalan Vendor | `poDeliveryNo` | `PO-{XXX}` / `SJ-VENDOR` | Left |
| 5 | Supplier / Pengirim | `supplierName` | Nama Supplier PT | Left |
| 6 | Total Item & Qty | `itemSummary` | `4 Item (500 KG)` | Left |
| 7 | Status Inspeksi QC | `qcStatus` | Badge: `MENUNGGU_QC`, `PASSED`, `REJECT_PARTIAL` | Center |
| 8 | Status Putaway | `putawayStatus` | Badge: `KARANTINA`, `MASUK_RAK_GUDANG` | Center |
| 9 | Aksi | `actions` | Tombol: `Inspeksi QC`, `Cetak LPB`, `Alokasi Rak` | Center |
