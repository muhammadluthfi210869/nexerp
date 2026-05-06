# Revised Implementation Plan: Event-Driven Communication Protocol V4
**Versi**: 2.0 (Strict Event-Driven & Operational Alignment)
**Tujuan**: Mengimplementasikan protokol komunikasi maklon kosmetik yang selaras dengan arsitektur Event-Driven V4, memastikan aliran data fisik dan digital tidak saling bertabrakan.

---

## 🏗️ FASE 1: Database & ActivityStream Schema (The Event Hub)
Penguatan skema untuk mendukung pelacakan real-time lintas divisi.

### Langkah Kerja:
1.  **ActivityStream Model**: Menambahkan tabel `ActivityStream` yang mencatat:
    *   `senderDivision` (Enum: BD, RND, FINANCE, SCM, etc.)
    *   `eventType` (Enum: GATE_OPENED, GATE_BLOCKED, MANUAL_LOG, OVERRIDE)
    *   `payload` (JSON untuk data spesifik seperti nomor BPOM atau nominal bayar).
2.  **Operational Flags**: 
    *   `isBpomApproved` pada model `Packaging`.
    *   `stockStatus` (Enum: READY, SHORTAGE) pada model `SalesOrder` (hasil kalkulasi BOM).
3.  **Real-time Ready**: Memastikan field `createdAt` memiliki presisi milidetik untuk sinkronisasi stream.

### Parameter Keberhasilan (Definition of Done):
*   [ ] Model `ActivityStream` terhubung ke `SalesLead` dan siap menampung log otomatis dari setiap departemen.
*   [ ] Skema database mendukung pemisahan blokir antara *Raw Material* dan *Packaging*.

---

## ⚙️ FASE 2: Backend Logic & Specialized Hard-Gates (The Protocol)
Implementasi filter logika yang membedakan perlakuan terhadap material fisik.

### Langkah Kerja:
1.  **Gate 1: DP 50% (Hard Lock)**: Mencegah transisi ke fase produksi jika verifikasi Finance belum mencapai minimal 50% dari DP Invoice.
2.  **Gate 2: BPOM Selective Block**:
    *   Izinkan pembuatan PO untuk **Raw Material** meski BPOM belum keluar.
    *   Blokir total (Hard Lock) pembuatan PO untuk **Packaging** (Kemasan) jika status BPOM NA belum `DONE`.
3.  **Gate 3: BOM Check (Ready to Produce)**:
    *   Sebelum SO masuk ke status `READY_TO_PRODUCE`, sistem wajib melakukan validasi stok terhadap Bill of Materials (BOM).
    *   Jika stok material (Raw + Packaging) tidak mencukupi, status tertahan di `WAITING_MATERIAL`.

### Parameter Keberhasilan (Definition of Done):
*   [ ] Script `test-po-packaging` gagal dijalankan jika BPOM NA null.
*   [ ] Script `test-po-raw-material` berhasil dijalankan meski BPOM NA null.
*   [ ] Transisi ke `READY_TO_PRODUCE` mengembalikan error jika pengecekan BOM gagal.

---

## ⏱️ FASE 3: Event-Driven Handover & SLA (The Workflow)
Mengotomatiskan aliran informasi saat gate terbuka.

### Langkah Kerja:
1.  **Event Emitters**: Setiap kali gate terbuka (misal: DP terverifikasi), sistem memancarkan event untuk:
    *   Insert log ke `ActivityStream`.
    *   Membuka modul R&D atau SCM secara otomatis.
2.  **Critical Delay Monitoring**: Menghitung waktu tunggu di setiap gate. Jika gate tertahan > 3 hari, trigger alert `BOTTLENECK` ke Head Ops.

### Parameter Keberhasilan (Definition of Done):
*   [ ] Log masuk ke `ActivityStream` secara otomatis tanpa input manual dari user saat status berubah.

---

## 🎨 FASE 4: Frontend HUD & Activity Stream Render (The Interface)
Visualisasi aliran data real-time di profil Leads.

### Langkah Kerja:
1.  **Leads Profile Stream**: Merender data dari `ActivityStream` di sisi profil Leads untuk melihat sejarah komunikasi antar divisi (Finance ➡️ BD ➡️ SCM).
2.  **Operational HUD**: Menampilkan indikator stok (BOM Status) dan BPOM status yang secara visual memandu user apa yang harus dilakukan selanjutnya.
3.  **Emergency Override UI**: Form khusus untuk bypass gate dengan audit trail yang masuk ke `ActivityStream` sebagai tipe `OVERRIDE`.

### Parameter Keberhasilan (Definition of Done):
*   [ ] User SCM dapat melihat alasan kenapa PO Kemasan diblokir langsung di dashboard mereka.
*   [ ] Aliran log komunikasi tampil urut dan real-time di profil Leads.

---

## 🏁 FASE 5: End-to-End Operational Testing
Memastikan tidak ada logika fisik yang ditabrak.

### Langkah Kerja:
1.  **Physical Simulation**: Simulasi alur di mana Bahan Baku datang duluan (Raw Material PO OK), tapi produksi tidak bisa mulai karena Kemasan belum datang (Packaging PO Blocked by BPOM).
2.  **BOM Stress Test**: Simulasi pesanan massal untuk menguji akurasi Gate BOM Check.

### Parameter Keberhasilan (100% Tepat):
*   [ ] Sistem berhasil membedakan *Raw Material* vs *Packaging* secara konsisten.
*   [ ] Tidak ada SO yang masuk ke produksi tanpa stok yang valid (BOM Check Passed).

---
**Setiap fase wajib melalui User Acceptance Test (UAT) teknis sebelum berlanjut.**
