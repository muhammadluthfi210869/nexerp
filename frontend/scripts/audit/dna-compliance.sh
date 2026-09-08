#!/bin/bash
# dna-compliance.sh — A1.3: Verify operational pages only import from @/components/dna
# Usage: ./dna-compliance.sh
# Exit 0 = clean, Exit 1 = violation

set -e

VIOLATIONS=$(grep -rEln "from ['\"]@/components/ui/" frontend/src \
  --include="*.tsx" --include="*.ts" \
  | grep -v "/components/dna/" \
  | grep -v "/dna-visual/" \
  | grep -v "/components/ui/" \
  | grep -v "/dashboard" \
  | grep -v "/marketing/" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "🚫 DNA VIOLATIONS — operational pages import raw UI:"
  echo "$VIOLATIONS"
  echo ""
  echo "Lihat ADR-007. Gunakan DNA components dari @/components/dna/*"
  exit 1
fi

echo "✅ DNA clean — operational pages 100% DNA"
exit 0
