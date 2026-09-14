#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Setup WhatsApp + LLM env di server (idempotent)
#  Cara pakai DI SERVER (setelah git pull):
#    cd ~/nexerp
#    bash scripts/setup-whatsapp-env.sh
#
#  Lalu isi 2 SECRET manual di .env:
#    WA_ACCESS_TOKEN=...
#    LLM_API_KEY=...
#  Kemudian deploy.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

ENV_FILE="${1:-.env}"
[ -f "$ENV_FILE" ] || { echo "❌ $ENV_FILE tidak ada"; exit 1; }

# Backup dulu
cp "$ENV_FILE" "$ENV_FILE.bak-$(date +%Y%m%d-%H%M%S)"

# Blok var non-secret — hanya di-append kalau belum ada (idempotent)
append_if_missing() {
  local KEY="$1" VALUE="$2"
  if grep -q "^${KEY}=" "$ENV_FILE"; then
    echo "  ℹ️ ${KEY} sudah ada — skip"
  else
    echo "${KEY}=${VALUE}" >> "$ENV_FILE"
    echo "  ✅ ${KEY} ditambahkan"
  fi
}

echo "📝 Menambahkan variabel WhatsApp + LLM ke $ENV_FILE..."

append_if_missing "WA_BUSINESS_PHONE" "6287793032556"
append_if_missing "WA_WEBHOOK_VERIFY_TOKEN" "dreamlab_secret_2026"
append_if_missing "WA_PHONE_NUMBER_ID" "1250985101431319"
append_if_missing "WA_WABA_ID" "1580085997047909"
append_if_missing "ORPHAN_DEDUP_WINDOW_MS" "604800000"
append_if_missing "LLM_PROVIDER" "deepseek"
append_if_missing "LLM_BASE_URL" "https://api.deepseek.com/v1"
append_if_missing "LLM_MODEL" "deepseek-chat"
append_if_missing "NEXT_PUBLIC_WA_PHONE" "6287793032556"

echo ""
echo "━━━ STATUS SECRET ━━━"
grep -q "^WA_ACCESS_TOKEN=.\{10\}" "$ENV_FILE" && echo "  ✅ WA_ACCESS_TOKEN terisi" || echo "  ⚠️  WA_ACCESS_TOKEN KOSONG — isi manual di $ENV_FILE"
grep -q "^LLM_API_KEY=.\{10\}" "$ENV_FILE" && echo "  ✅ LLM_API_KEY terisi" || echo "  ⚠️  LLM_API_KEY KOSONG — isi manual di $ENV_FILE"

echo ""
echo "━━━ LANGKAH BERIKUT ─────────────────────────────"
echo "1. isi 2 secret di $ENV_FILE (WA_ACCESS_TOKEN & LLM_API_KEY)"
echo "2. deploy:  bash scripts/deploy.sh"
echo "   (atau sesuai flow Biznet kamu: migrate-to-biznet.sh → deploy-biznet.sh)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

