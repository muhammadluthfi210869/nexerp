# Gap Analysis & Parity Tracking: G-SERP vs NexERP

Folder ini memuat dokumen audit gap fitur, kolom, form input, modal, aksi, dan flow bisnis antara **ERP Lama (`kil.gserp.id`)** dan **NexERP**, dipecah rapi per fase sidebar.

---

## 📑 Daftar Dokumen Per Fase

| Dokumen | Modul / Cakupan | Status Audit | Status Dev |
| :--- | :--- | :---: | :---: |
| [00_ATURAN_EKSEKUSI_DAN_ZERO_MOCKUP_STANDARD.md](./00_ATURAN_EKSEKUSI_DAN_ZERO_MOCKUP_STANDARD.md) | **SOP & Zero-Mock Guarantee Contract** (Aturan Mutlak Full-Stack & Testing Operasional) | 🛡️ ACTIVE | 🏛️ BINDING |
| [01_FASE_1_MASTER_DATA.md](./01_FASE_1_MASTER_DATA.md) | Master Barang, Kategori, Supplier, Pelanggan, Gudang, Hak Akses, CoA, Sales Target, User & Role | ✅ AUDITED | ✅ 100% SELESAI & TERVERIFIKASI (Sub-Fase 1.1–1.7 LULUS) |
| [02_FASE_2_PENGADAAN_PURCHASING.md](./02_FASE_2_PENGADAAN_PURCHASING.md) | Permintaan Pembelian, Approval PO, Faktur Pembelian, DP, Pelunasan, Retur, 3-Way Match | ⏳ Pending | ⏳ Pending |
| [03_FASE_3_GUDANG_INVENTORY.md](./03_FASE_3_GUDANG_INVENTORY.md) | Kebutuhan Barang, Pembelian Masuk, Pengiriman, Mutasi/Transfer, Stok Opname, Penyesuaian | ⏳ Pending | ⏳ Pending |
| [04_FASE_4_CRM_LEADS_SALES.md](./04_FASE_4_CRM_LEADS_SALES.md) | Leads, Buku Tamu, Client Sample/Produksi/RO/Lost, SPK Penjualan, Bayar Sample, DP & Faktur Penjualan | ⏳ Pending | ⏳ Pending |
| [05_FASE_5_RND_FORMULASI.md](./05_FASE_5_RND_FORMULASI.md) | Penyesuaian Formulasi, Kelola Formulasi, Permintaan HPP, Sample RnD, Daily Tracking & Monitoring | ⏳ Pending | ⏳ Pending |
| [06_FASE_6_PRODUKSI_PENJADWALAN.md](./06_FASE_6_PRODUKSI_PENJADWALAN.md) | Batch Record, Jadwal & Realisasi (Mixing, Filling, Packaging) | ⏳ Pending | ⏳ Pending |
| [07_FASE_7_FINANCE_AKUNTANSI.md](./07_FASE_7_FINANCE_AKUNTANSI.md) | Kas Bank Masuk/Keluar, Rekonsiliasi, Pengajuan Dana, Jurnal Umum, Buku Besar, Neraca, Laba Rugi | ⏳ Pending | ⏳ Pending |
| [08_FASE_8_MODUL_BARU_SPEC.md](./08_FASE_8_MODUL_BARU_SPEC.md) | KPI Management Divisi & Orang, Communication Protocol, Project Control, Digimar Reports | ⏳ Pending | ⏳ Pending |

---

## 🔄 Alur Kolaborasi

1. **AI (Auditor & QA)**: Menjalankan Playwright browser crawling ke `kil.gserp.id`, mengekstrak semua field/kolom/aksi, lalu menuliskan detail gap di file fase terkait.
2. **Developer**: Membaca checklist gap dan melakukan koding perbaikan pada frontend, backend, dan database.
3. **AI (Recheck)**: Memvalidasi ulang tampilan & fungsi di browser setelah developer selesai melakukan perbaikan.
