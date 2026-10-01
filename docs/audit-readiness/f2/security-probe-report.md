# F2-SECURITY — Probe Otonom (diukur langsung, bukan oleh agent)

Agent: orkus (probe skrip). Box: port 3211 / `audit_f2_finance`. Tanggal 2026-10-01.
Metode: ambil `/api/docs-json`, lalu panggil **seluruh** route terdaftar tanpa header
`Authorization` sama sekali. Tidak ada tebakan, tidak ada sampel.

---

## Angka utama

| | |
|---|---|
| Route terdaftar di Swagger | **1007** (524 GET, 339 POST, 95 PATCH, 37 DELETE, 12 PUT) |
| GET diprobes tanpa token | 524 |
| **GET yang benar-benar terlindungi** | **510 → 401** |
| **GET yang terbuka** | **14** |
| POST diprobes tanpa token (body `{}`, tidak menulis apa pun) | 339 |
| **POST yang benar-benar terlindungi** | **332 → 401** |
| **POST yang terbuka** | **7** |

**842 dari 863 route yang diuji sudah dikunci dengan benar.** F1 (D3-012) memprediksi
`JwtAuthGuard` bukan global sehingga "108 dari 113 controller tidak terlindungi" —
**prediksi itu salah besar**. Guard sudah terpasang di mana-mana. Ini koreksi yang sama pentingnya
dengan temuan baru, karena kalau D3-012 diteruskan apa adanya ke client, klaim keamanan
sistem ini akan terlihat jauh lebih buruk daripada kenyataanya.

---

### [F2-SEC-001] Tiga endpoint terbuka: anonim bisa menulis dan membaca data prospek
- Severity:    **CRITICAL**
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/marketing/landing-tracker.controller.ts:109-116`
               `backend/src/modules/lead-capture/lead-capture.controller.ts:129-131`
- Bukti:       Dipanggil **tanpa token apa pun**, dari luar:

  | request | status | akibat nyata |
  |---|---|---|
  | `POST /v1/marketing/landing-tracker/track` | **201** | baris masuk `landing_page_visits` |
  | `POST /v1/marketing/landing-tracker/conversion` | **201** | baris masuk `landing_page_conversions` lengkap dengan `nama`, `perusahaan`, **`hp`** |
  | `GET /v1/marketing/landing-tracker/visits` | **200** | payload yang saya suntikkan **terbaca kembali** |
  | `GET /v1/marketing/landing-tracker/conversions` | **200** | idem |
  | `POST /v1/lead-capture/track` | **200** | baris masuk `lead_captures` (121 → 122), membalikkan kode pelacakan + **link WhatsApp nomor bisnis** `wa.me/6281234567890` |

  Semua field DTO-nya `@IsOptional()` kecuali `pageUrl` (`landing-tracker.dto.ts:5`,
  `lead-capture.controller.ts:40-57`) — jadi payload valid cukup berisi satu string.
- Repro:
  ```bash
  curl -X POST http://<host>/v1/marketing/landing-tracker/conversion \
    -H 'content-type: application/json' \
    -d '{"pageUrl":"https://evil.example","nama":"X","hp":"0812"}'
  # → 201 Created, baris tersimpan. Tidak ada Authorization header.
  ```
- Dampak ke client: siapa pun di internet bisa (a) **menyuntikkan prospek palsu** ke corong
  penjualan — angka funnel yang dilihat manajemen bisa dibuat salah tanpa satu pungeh yang
 baris kode; (b) **membaca** seluruh data kunjungan dan konversi; (c) mengetahui nomor WhatsApp
  bisnis. Tidak ada jalur ini ke data keuangan, HR, atau pelanggan — jadi bukan kebocoran
  finansial, tapiintegritas data corong penjualan yang rusak.
- Lapis:       API + DB

  **Catatan severity.** Ini CRITICAL, bukan BLOCKER: tidak ada jalur ke uang atau ke data
  pelanggan. Ia BLOCKER hanya kalau ternyata ada tabel lain yang ikut terbuka — dan hasil
  probe menunjukkan tidak (`sales_invoices`, `ar_receipts`, `payroll`, `employees` semuanya
  401).

### [F2-SEC-002] Tujuh route lain terbuka tanpa token
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Bukti:       besides the three above:
  - `GET /v1` → `Hello World!` — halaman sisa, tidak seharusnya ada
  - `GET /v1/health` → 200 — **benar**, health check memang wajib publik
  - `GET /v1/lead-capture/round-robin/next` → 404, tapi **logika bisnis dieksekusi**
    ("No active round robin agents") tanpa token
  - `GET /v1/wa-webhook`, `GET /v1/webhooks/whatsapp`, `POST /v1/wa-gateway/webhook` →
    200 dengan body error. Webhook memang harus publik, tapi **verifikasi signature-nya
    belum diuji** — lihat catatan di bawah
  - `POST /v1/lead-capture/kommo-webhook` → 200 `{"received":0,"updated":0}`; `@Body() body: any`
    tanpa validasi, tapi payload uji saya tidak Writes — jadi **belum terbukti bisa menulis**,
   naik severity-nya ke CRITICAL kalau ternyata bisa
  - `GET /v1/events/{busdev,qc,maintenance,creative}` → error `"Body is unusable"`; ini galat
    sisi probe (respons body-bearing tanpa Content-Type yang bisa saya baca), **status sebenarnya
    belum terukur** — harus diulang
- Dampak ke client: hygiene. Tidak ada di antaranya yang saat ini menjadi jalur kebocoran
  financial, tapi `/v1` dan `round-robin/next` menjalankan logika tanpa autentikasi sama sekali.

### Yang BELUM terbukti (jangan diklaim ke client sebelum diuji)
1. **Signature webhook.** `wa-webhook` dan `webhooks/whatsapp` mengembalikan 200 dengan
   `{"error":"Verification failed"}` — jadi verifikasi ada. Tapi belum diuji apakah bisa
   dilewati dengan signature palsu. Kalau bisa, itu CRITICAL.
2. **Otorisasi lintas-peran.** Baru diuji *unauthenticated*. Belum diuji apakah user berrole
   rendah (misal `QC_LAB`) bisa membaca data keuangan dan HR. Itu_domain berbeda dari temuan ini
   dan harus jadi test tersendiri.
3. **Empat route `/v1/events/*`.** Status HTTP sebenarnya belum diketahui.

---

## Catatan metodologi

- Probe ini **tidak merusak apa pun**: POST dikirim dengan body `{}`, yang gagal validasi
  sebelum menyentuh database. Satu-satunya baris yang benar-benar tercipta adalah dari uji
  pembuktian F2-SEC-001, dan **semuanya sudah dihapus** — `landing_page_visits` = 0,
  `landing_page_conversions` = 0, `lead_captures` kembali ke 121, `sales_leads` = 0 baris `AUDIT_F2`.
- Angka 842/863 **tidak** berarti sistem 97% aman. Ia berarti 97% route menolak permintaan
  tanpa identitas. Yang belum diuji adalah apakah identitas yang *salah* ditolak dengan benar.
- Semua agent F2 lain yang sebelumnya tidak mengukur jumlah ini — mereka menguji satu domain
 endpoint saja. Angka ini hanya bisa didapat dengan menelusuri **seluruh** 1007 route.
