#!/bin/bash
# Post-deploy check of the one thing /v1/health cannot see: that a real document comes out.
#
# The PDF engine renders with Chromium, which is a *request-time* dependency of the image.
# When it was missing, the engine swallowed the render failure and returned a one-line
# placeholder PDF with HTTP 200 — so health was green, exports were broken, and nothing said
# so. This script asks for a document and refuses anything that is not one.
#
# Usage:
#   PROBE_EMAIL=you@example.com PROBE_PASSWORD=... bash scripts/verify-pdf-live.sh
#   BASE_URL=http://localhost:3002/v1 PROBE_EMAIL=... PROBE_PASSWORD=... bash scripts/verify-pdf-live.sh
set -euo pipefail

BASE_URL="${BASE_URL:-https://nexerp.id/api}"
MIN_BYTES="${MIN_BYTES:-5000}"

: "${PROBE_EMAIL:?set PROBE_EMAIL (a real account on the target)}"
: "${PROBE_PASSWORD:?set PROBE_PASSWORD (never hardcoded here)}"

TMP_PDF="$(mktemp)"
trap 'rm -f "$TMP_PDF"' EXIT

echo "PDF live probe → $BASE_URL"

LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PROBE_EMAIL\",\"password\":\"$PROBE_PASSWORD\"}")
# sed rather than jq: this runs on the VPS, where jq is not guaranteed to exist.
TOKEN=$(printf '%s' "$LOGIN" | sed -nE 's/.*"access_?[Tt]oken":"([^"]*)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo "FAIL: login ditolak ($PROBE_EMAIL) — tidak bisa menguji PDF tanpa sesi"
  exit 1
fi

HTTP=$(curl -s -o "$TMP_PDF" -w "%{http_code}" \
  -X POST "$BASE_URL/document-automation/pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentType":"QUOTATION","documentNumber":"PROBE-LIVE-001","data":{"clientName":"Live Probe","items":[{"productName":"Probe Item","quantity":10,"unitPrice":25000,"subtotal":250000}]}}')

SIZE=$(wc -c < "$TMP_PDF" | tr -d ' ')
echo "HTTP $HTTP, $SIZE bytes"

if [ "$HTTP" != "200" ]; then
  echo "FAIL: renderer tidak mengembalikan 200 — ini jawaban jujur, bukan dokumen"
  head -c 400 "$TMP_PDF"; echo
  exit 1
fi

if ! head -c 5 "$TMP_PDF" | grep -q "%PDF-"; then
  echo "FAIL: keluaran bukan PDF"
  exit 1
fi

if grep -aq "Deterministic Document Snapshot" "$TMP_PDF"; then
  echo "FAIL: placeholder deterministic — Chromium tidak ada di image ini"
  exit 1
fi

if [ "$SIZE" -le "$MIN_BYTES" ]; then
  echo "FAIL: hanya $SIZE bytes (ambang $MIN_BYTES) — placeholder, bukan dokumen"
  exit 1
fi

echo "PASS: dokumen nyata dari server live ($SIZE bytes)"
