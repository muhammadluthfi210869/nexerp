#!/bin/bash
# Regression: CI harus mem-push image ke GHCR per-SHA dan TIDAK lagi punya
# bridge-size-guard (artefak workflow dua-branch yang sudah diarsipkan).
set -euo pipefail
cd "$(dirname "$0")/../.."

CI=".github/workflows/ci.yml"
FAIL=0

grep -q "push-images" "$CI" || { echo "❌ ci.yml tidak punya job push-images"; FAIL=1; }
grep -q "ghcr.io" "$CI" || { echo "❌ ci.yml tidak merujuk ghcr.io"; FAIL=1; }
grep -qE "backend:\\\$\\{\\{ github\\.sha \\}\\}|backend:\$\{\{ *github\.sha *\}\}" "$CI" || \
  { echo "❌ ci.yml tidak men-tag image dengan github.sha"; FAIL=1; }
grep -qi "bridge-size-guard" "$CI" && { echo "❌ ci.yml masih punya bridge-size-guard"; FAIL=1; }
# Hanya baris trigger branches: yang diperiksa (komentar historis boleh menyebut nama branch lama)
if grep -E "branches:.*production-light" "$CI" | grep -qv "^\s*#"; then
  echo "❌ ci.yml masih men-trigger production-light"; FAIL=1
fi

[ "$FAIL" -eq 0 ] && echo "✅ CI = build+test gate + push GHCR per-SHA, bebas artefak bridge" && exit 0
exit 1
