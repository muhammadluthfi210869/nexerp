# 🧪 ULTIMATE TESTING PLAN: DIVISI LEGALITAS (APJ) V4

## 1. PENDAHULUAN
Dokumen ini merinci rencana pengujian menyeluruh untuk modul Legalitas (APJ) pada ERP Aureon. Fokus utama adalah pada **Smart-Gates**, **Komunikasi Antar-Divisi**, dan **Integritas Data** sesuai dengan spesifikasi di `docs/general docs/legalitas.md`.

---

## 2. RUANG LINGKUP PENGUJIAN
### A. Jalur Kepatuhan Formula (Legal ↔ R&D)
- Validasi INCI terhadap Master INCI.
- Mekanisme Tiga Tombol APJ (Approve, Minor Adjustment, Fatal Reject).
- Penguncian/Pembukaan Phase Builder R&D.

### B. Jalur Sensor Kemasan (Legal ↔ BusDev ↔ SCM)
- Review Artwork oleh APJ.
- Pemblokiran PO SCM jika Artwork belum disetujui.

### C. Jalur Eksekusi Pabrik (Smart-Gates)
- Pemblokiran PO SCM untuk kemasan komersial sebelum nomor BPOM terbit.
- Pemblokiran tombol Filling & Packaging di Produksi sebelum nomor BPOM NA dimasukkan.

### D. Jalur Pembiayaan PNBP (Legal ↔ Finance)
- Request Biaya Legal oleh APJ.
- Validasi status `isPaid` oleh Finance sebelum advance ke tahap `EVALUATION`.

### E. Dashboard & Reporting
- Akurasi KPI Cards (Bottleneck, Velocity, Risk).
- Integritas data pada tabel analitik.

---

## 3. SKENARIO PENGUJIAN DETAIL

### 3.1. Functional Testing (Internal Legalitas)
| ID | Skenario | Langkah | Hasil Diharapkan |
| :--- | :--- | :--- | :--- |
| LG-01 | Create BPOM Record | Input data pendaftaran baru di Pipeline. | Record tersimpan dengan status `DRAFT`. |
| LG-02 | Advance Stage | Klik 'Advance Stage' dari DRAFT ke SUBMITTED. | Status berubah, log history tercatat di `logHistory`. |
| LG-03 | PNBP Request | Klik 'Request Biaya' pada item pipeline. | Terbit record di `PNBPRequest` dan muncul di dashboard Finance. |
| LG-04 | Master INCI Import | Upload file CSV berisi database INCI. | Data masuk ke tabel `MasterINCI` dengan kategori yang benar. |
| LG-05 | Staff Performance | Lakukan 5 approval dan 2 reject. | Dashboard staff mengupdate `done` dan `winRate` secara real-time. |

### 3.2. Communication Protocol & Smart-Gates (Inter-Module)
| ID | Skenario | Langkah | Hasil Diharapkan |
| :--- | :--- | :--- | :--- |
| SG-01 | SCM Gate (Artwork) | SCM mencoba buat PO Packaging untuk lead tanpa approval artwork. | Sistem melempar `ForbiddenException` (Artwork not approved). |
| SG-02 | SCM Gate (Approval) | APJ klik `Approve Artwork`. SCM buat PO lagi. | PO berhasil dibuat. |
| SG-03 | Prod Gate (Mixing) | Produksi mulai tahap MIXING untuk produk `WAITING_BPOM`. | Diizinkan (Soft-Gate). |
| SG-04 | Prod Gate (Filling) | Produksi mencoba masuk tahap FILLING tanpa nomor BPOM NA. | Sistem melempar `ForbiddenException` (BPOM NA missing). |
| SG-05 | Prod Gate (Unblock) | APJ input nomor BPOM NA. Produksi klik FILLING. | Tombol aktif dan proses bisa berlanjut. |
| SG-06 | R&D Gate (Minor Fix) | APJ pilih `Minor Adjustment` pada formula. | Gembok formula R&D terbuka (status `MINOR_COMPLIANCE_FIX`). |
| SG-07 | R&D Gate (Reject) | APJ pilih `Fatal Reject`. | Formula lama diarsip (`ARCHIVED`), R&D wajib buat baru. |

### 3.3. Data Integrity & Boundary Testing
| ID | Skenario | Langkah | Hasil Diharapkan |
| :--- | :--- | :--- | :--- |
| DI-01 | Payment Validation | Coba ubah status ke `EVALUATION` saat `isPaid` masih false. | Backend menolak perubahan status (State Machine enforcement). |
| DI-02 | Audit Trail | Lakukan 10x perubahan status cepat. | Tabel `legal_timeline_logs` memiliki 10 entry lengkap dengan timestamp dan user. |
| DI-03 | Expiry Warning | Set tanggal kadaluarsa BPOM ke H+85. | Muncul di KPI Card 'Under 90 Days' dan 'Critical Action'. |
| DI-04 | Formula Check | Input formula dengan bahan kategori `PROHIBITED`. | API `/validate-formula` mengembalikan `canProceed: false` dan daftar pelanggaran. |
| DI-05 | Zero Logic | Lead tanpa pipeline sama sekali. | SCM/Produksi harus tetap aman (Default allowed atau default blocked tergantung kebijakan). |

---

## 4. RENCANA EKSEKUSI (TESTING PIPELINE)
1. **Unit Testing (Jest)**: Fokus pada `LegalityService` untuk logika state machine dan `validateFormula`.
2. **Integration Testing (Playwright/Supertest)**: Simulasi user flow dari R&D -> Legal -> Finance -> SCM -> Produksi.
3. **Stress Test**: Simulasi 50+ pendaftaran BPOM serentak untuk mengecek performa `RegulatoryPipeline` grid.
4. **Manual Audit**: Verifikasi visual pada dashboard (Glass-Card style) dan filter-filter tabel.

---

## 5. CATATAN QA (CRITICAL GAPS)
> [!WARNING]
> Saat ini fungsi `validateFormula` masih di-mock (selalu return LOW risk). Pengujian sesungguhnya baru bisa dilakukan setelah logic engine pencocokan INCI diimplementasikan.

> [!IMPORTANT]
> Pastikan integrasi Finance benar-benar menggunakan flag `isPaid` dari tabel `PNBPRequest`, bukan sekadar input manual dari APJ untuk menghindari kecurangan data.
