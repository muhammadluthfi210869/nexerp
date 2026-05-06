# FASE 8: EKSPANSI STRATEGIS & EKSEPSI
*Dokumen Spesifikasi Input UI - Modul Marketing & Penanganan Darurat*

## 1. Form Kinerja Iklan Harian (Role: Digimar / BD)
*Fungsi: Mencatat pengeluaran harian (*Burn Rate*) untuk dikalkulasikan menjadi CPL dan ROAS di Dashboard Eksekutif.*F

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Tanggal Laporan | Date | Wajib | Data historis per hari |
| Platform Ads | Dropdown | Wajib | Meta (FB/IG), TikTok, Google |
| Nama Campaign | Teks | Wajib | Untuk membedakan strategi iklan |
| Total Biaya Iklan (Spend)| Angka (Rp) | Wajib | Uang yang dibakar hari itu |
| Total Reach/Impresi | Angka | Opsional | Metrik *awareness* |
| Jumlah Leads Masuk | Angka | Wajib | Akan divalidasi dengan jumlah *Leads* aktual di CRM |

---

## 2. Form Resolusi Karantina/Reject (Role: Head of Manufacture)
*Fungsi: Mengeksekusi barang gagal dari hasil QC agar tidak menumpuk menjadi nilai mati di neraca persediaan.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| No. Ref QC / Batch | Dropdown (Search)| Wajib | Hanya menampilkan antrean barang berstatus `REJECTED` |
| Nama Barang/Material | Teks (Readonly) | Otomatis | Ditarik dari dokumen referensi |
| Qty Karantina | Angka (Readonly) | Otomatis | Jumlah barang yang tertahan |
| Tindakan Eksekusi | Dropdown | Wajib | `Pemusnahan (Disposal)`, `Olah Ulang (Rework)`, `Retur ke Supplier` |
| Akun Kerugian (CoA) | Dropdown (Search)| Wajib | *Auto-filter* ke akun Biaya Kerugian Produksi |
| Bukti Eksekusi | File Upload | Opsional | Foto pemusnahan atau Berita Acara |

---

## 3. Form Master Override / Bypass (Role: Super Admin - Zaki)
*Fungsi: Pintu darurat sistemik (*Emergency Hatch*) untuk melompati protokol *Hard Gate* karena alasan bisnis yang mendesak. Mengunci akuntabilitas pada level tertinggi.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Pilih Dokumen Tertahan | Dropdown (Search)| Wajib | Mencari SO, PO, atau Batch yang terkunci sistem |
| Jenis Gembok (Gate) | Teks (Readonly) | Otomatis | Menampilkan alasan kunci (Misal: "Menunggu DP" atau "Menunggu Halal") |
| Alasan Override | Teks (Area) | Wajib | Alasan *Force Majeure* (Wajib minimal 50 karakter) |
| Konfirmasi Risiko | Checkbox | Wajib | "Saya mengerti risiko Bypass ini dan bertanggung jawab penuh." |
| Security PIN | Password | Wajib | Autentikasi lapis kedua (2FA) khusus Super Admin |