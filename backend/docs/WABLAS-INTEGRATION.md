# Wablas Integration — Lead Capture DreamLab.id

> **Tanggal**: 2026-08-18
> **Status**: Source code synced, env configured, ready to deploy
> **Server target**: BIZNET (`/home/dreamlab/nexerp`)

---

## Arsitektur

```
[Customer klik CTA di dreamlab.id]
    -> SmartWhatsAppButton.tsx -> POST /api/lead-capture/track
[ERP catat click + generate tracking code DLxxxx]
    -> customer chat ke nomor sales di HP
[Wablas listener push ke webhook URL]
    -> POST /api/wa-gateway/webhook
[ERP -> WaWebhookService.handleGateway()]
    -> bridge ke LeadCaptureService
[updateFromWhatsApp() atau upsertOrphanLead()]
    -> appendLeadMessage -> maybeAutoExtract
[LLM MiniMax-M3 extract JSON dari chat history]
[Simpan ke DB sebagai LeadAttribute (suggestion)]
[Sales confirm di dashboard -> data final ke kolom first-class]
```

## Env yang dibutuhkan (sudah di backend/.env)

- WABLAS_API_HOST=https://tegal.wablas.com/
- WABLAS_TOKEN=3ToOe13ezYMPCSbrJhZlfQLIxDbooyuEusnPe4oOu1yHhkSiOBbHqTx
- WA_BUSINESS_PHONE=6287793032556
- WA_WEBHOOK_VERIFY_TOKEN=nexerp_wa_6ba5bf826fbfc1f454697f220c80e8788244dc38d5bed5ab
- LLM_PROVIDER=openai
- LLM_BASE_URL=https://api.minimaxi.com/v1
- LLM_API_KEY=sk-cp-R7m8kwXp_l3UL-KTCPqBIF15Th3YVDaxKiq8q8cNMmjUIIwdTS1naL06jsYsDeiq9m9LonBeeTMguf_ofDUR_WRJ87w22-JHw-nKvgxVDrXbCVbYZ9WJV-o
- LLM_MODEL=MiniMax-M3
- ORPHAN_DEDUP_WINDOW_MS=604800000

## Setup Wablas Dashboard (1x)

### A. Tambah Device (untuk tiap sales)

1. Login https://tegal.wablas.com/
2. Devices -> Add Device
3. Di HP sales (yang punya nomor WA aktif):
   - Buka WA -> Settings -> Linked Devices -> Link a Device
   - Scan QR yang muncul di dashboard Wablas
4. Repeat untuk Aurel (087712232389), Revita (081952417051), Zarkasi (087776550657)

### B. Setup Webhook URL

1. Dashboard Wablas -> Settings -> Webhook URL
2. Set: https://nexerp.id/api/wa-gateway/webhook
3. Pastikan method: POST
4. (Opsional) Set webhook secret di header X-Webhook-Token untuk security tambahan

### C. Cek Status Device

Pastikan semua device online (icon hijau) sebelum go-live.

## Test End-to-End

### Step 1: Test API Endpoint
```
curl https://nexerp.id/api/lead-capture/stats
curl -X POST https://nexerp.id/api/lead-capture/track -H "Content-Type: application/json" -d '{"intent":"Test","pageUrl":"audit-page"}'
```

### Step 2: Test Wablas Webhook
```
curl -X POST https://nexerp.id/api/wa-gateway/webhook -H "Content-Type: application/json" -d '{"phone":"081234567890","text":"[Kode: DLTEST123] Halo","name":"Tester"}'
```

### Step 3: Test AI Extraction
Kirim chat dengan info customer -> ERP auto-trigger extractAiForLead() via MiniMax -> Cek `/api/lead-capture/:id/attributes`

### Step 4: Test dari HP Sales
1. Buka HP sales (yang sudah scan QR ke Wablas)
2. Kirim chat ke nomor HP itu dari nomor lain
3. Cek di dashboard ERP -> lead baru masuk dengan status WA_CONTACTED

## Alur AI Extraction

### Input
Chat history dari LeadMessage table: [timestamp] [customer/agent]: message body

### Prompt ke MiniMax
Ekstrak fullName, company, productInterest, moq, budget, niche, brand, stage.
Ekstrak HANYA fakta yang ADA di percakapan. Anti-halusinasi.

### Output JSON
Setiap field disimpan ke tabel LeadAttribute (key, value, confidence, source, confirmed=false).
Stage suggestion disimpan di field aiStage LeadCapture.

### Konfirmasi Sales
Di Drawer UI: tombol Confirm/Reject/Edit per atribut.
Confirm -> petakan ke kolom first-class (fullName, company, dst).
Confirm stage -> pindahkan workflowStatus.

## Troubleshooting

- Endpoint /api/wa-gateway/webhook 404 -> Pastikan WaWebhookModule terdaftar di app.module.ts
- Wablas tidak kirim webhook -> Cek device online di dashboard, webhook URL benar
- AI extraction gagal -> Cek LLM_API_KEY valid, LLM_BASE_URL accessible
- Lead orphan numpuk -> Cek ORPHAN_DEDUP_WINDOW_MS cukup

## Monitoring Metrics

- Jumlah lead baru per hari
- AI extraction success rate
- Average confidence score
- Stage suggestion acceptance rate
- Round-robin distribution balance

