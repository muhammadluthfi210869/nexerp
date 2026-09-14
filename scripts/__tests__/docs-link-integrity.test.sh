#!/bin/bash
# Regression: dokumen navigasi wajib ada dan saling terhubung (dunia 1-branch).
# Update 2026-09 konsolidasi: docs/BridgePattern.md DIHAPUS (bridge workflow
# retired — production-light diarsipkan, main satu-satunya branch production).
set -euo pipefail
cd "$(dirname "$0")/../.."

MISSING=0
for DOC in \
  "ARCHITECTURE.md" \
  "DEPLOY.md" \
  "RUNBOOK.md" \
  "docs/INDEX.md"
do
  if [ ! -f "$DOC" ]; then
    echo "❌ $DOC missing"
    MISSING=$((MISSING + 1))
  fi
done

# Artefak bridge tidak boleh hidup lagi
for GONE in "docs/BridgePattern.md" "scripts/bridge-to-production-light.sh"; do
  if [ -f "$GONE" ]; then
    echo "❌ $GONE masih ada — harusnya dihapus saat konsolidasi"
    MISSING=$((MISSING + 1))
  fi
done

# CLAUDE.md harus menavigasi ke dokumen-dokumen ini
for DOC in "ARCHITECTURE.md" "DEPLOY.md" "RUNBOOK.md" "docs/INDEX.md"; do
  if ! grep -qF "$DOC" CLAUDE.md; then
    echo "❌ CLAUDE.md missing link to $DOC"
    MISSING=$((MISSING + 1))
  fi
done

# CLAUDE.md tidak boleh lagi merujuk workflow branch ganda
if grep -qiE "bridge-to-production-light|production-light branch" CLAUDE.md; then
  echo "❌ CLAUDE.md masih merujuk workflow production-light/bridge"
  MISSING=$((MISSING + 1))
fi

# docs/INDEX.md harus link ke dokumen utama
for LINK in "ARCHITECTURE.md" "DEPLOY.md" "RUNBOOK.md" "qa-gate"; do
  if ! grep -qF "$LINK" docs/INDEX.md; then
    echo "❌ docs/INDEX.md missing link to $LINK"
    MISSING=$((MISSING + 1))
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo "❌ Navigasi dokumen rusak ($MISSING item)"
  exit 1
fi

echo "✅ Dokumen navigasi utuh + bebas artefak bridge"
exit 0
