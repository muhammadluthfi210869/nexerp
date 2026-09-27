#!/bin/bash
# Guards the deterministic install against the drift that broke CI on PR #11.
#
# `backend/package.json` gained the WA self-QR dependencies and the lock file was
# never regenerated. Locally nothing noticed — node_modules already had the
# packages, so every gate passed. CI was the first clean install and it died at
# `npm ci` with EUSAGE. A lock file is the only thing that makes "we tested this
# revision" reproducible, so this gate reads it directly instead of trusting the
# developer's node_modules.
#
# Red first: run against the pre-fix lock (`git show 3180497f:backend/package-lock.json`)
# and this gate reports `whatsapp-web.js`, `qrcode`, `qrcode-terminal` and
# `@types/qrcode` missing, exit 1. Against the fixed lock it exits 0.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECKER="$ROOT/scripts/check-lockfile-sync.mjs"

fail=0
check() { # check <label> <command...>
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "  ✅ $label"
  else
    echo "  ❌ $label"
    fail=1
  fi
}

[ -f "$CHECKER" ] || { echo "  ❌ checker tidak ada: $CHECKER"; exit 1; }

echo "Lockfile sync guard"

# 1. The three trees CI installs must each have a lock file, and it must agree
#    with its package.json.
for t in . backend frontend; do
  check "package.json ada: $t" test -f "$ROOT/$t/package.json"
  check "package-lock.json ada: $t" test -f "$ROOT/$t/package-lock.json"
done
check "package.json ↔ package-lock.json sinkron (root, backend, frontend)" \
  node "$CHECKER"

# 2. The checker must be able to fail — a guard that cannot go red is decoration.
#    Rebuild the exact defect (a package.json dep absent from the lock) in a temp
#    tree and require a non-zero exit.
TMP="$(mktemp -d)"
mkdir -p "$TMP/backend"
cat > "$TMP/backend/package.json" <<'JSON'
{ "name": "fixture", "dependencies": { "definitely-not-locked": "1.0.0" } }
JSON
cat > "$TMP/backend/package-lock.json" <<'JSON'
{ "name": "fixture", "lockfileVersion": 3, "packages": { "": { "dependencies": {} } } }
JSON
check "menolak dep yang tidak ada di lock (exit non-zero)" \
  bash -c "! node '$CHECKER' '$TMP/backend' >/dev/null 2>&1"
rm -rf "$TMP"

# 3. CI must run the install that this gate is protecting.
CI="$ROOT/.github/workflows/ci.yml"
check "CI menjalankan npm ci untuk ketiga tree" \
  bash -c "grep -q 'npm --prefix backend ci' '$CI' && grep -q 'npm --prefix frontend ci' '$CI'"

exit "$fail"
