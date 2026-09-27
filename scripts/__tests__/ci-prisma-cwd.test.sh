#!/bin/bash
# Guards the CI prisma invocation against the CWD trap that kept main's CI red
# from 2026-09-20 to 2026-09-26 and therefore blocked every GHCR image push.
#
# `npx --prefix backend prisma validate`, run from the repo root, changes npm's
# install prefix but NOT the process working directory. `backend/prisma.config.ts`
# resolves `schema: "prisma/schema"` relative to the CWD, so prisma searched the
# repo root and died with "Could not find Prisma Schema that is required for this
# command". Nothing local noticed: every developer runs prisma from inside
# backend/, and only CI ran it from the root.
#
# `npm --prefix backend run <script>` DOES set the CWD to backend/ before running
# (verified: `prisma generate` exits 0 from the repo root), so routing both
# commands through backend npm scripts is correct by construction.
#
# Red first: on the pre-fix tree this reports the `npx --prefix backend prisma`
# occurrences and the two missing scripts, exit 1. After the fix it exits 0.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CI="$ROOT/.github/workflows/ci.yml"
PKG="$ROOT/backend/package.json"

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

echo "CI prisma CWD guard"

# 1. No CI step may invoke prisma through the form that keeps the repo-root CWD.
check "CI tidak memakai 'npx --prefix backend prisma'" \
  bash -c "! grep -q 'npx --prefix backend prisma' '$CI'"

# 2. Both commands must be reachable as backend npm scripts (npm run sets the CWD).
check "backend/package.json punya skrip prisma:validate" \
  grep -q '"prisma:validate"' "$PKG"
check "backend/package.json punya skrip prisma:migrate:deploy" \
  grep -q '"prisma:migrate:deploy"' "$PKG"

# 3. Both CI migration-gate steps must use the safe form.
check "kedua gerbang migrasi CI memakai npm --prefix backend run prisma:validate" \
  bash -c "[ \"\$(grep -c 'npm --prefix backend run prisma:validate' '$CI')\" -ge 2 ]"
check "kedua gerbang migrasi CI memakai npm --prefix backend run prisma:migrate:deploy" \
  bash -c "[ \"\$(grep -c 'npm --prefix backend run prisma:migrate:deploy' '$CI')\" -ge 2 ]"

# 4. Dynamic proof: from the repo root — the CWD CI actually uses — the script
#    must resolve the schema. This is the check that would have caught the
#    original defect; it needs node_modules, so it is skipped rather than failed
#    when prisma is not installed.
if [ -d "$ROOT/backend/node_modules/prisma" ]; then
  if ( cd "$ROOT" && npm --prefix backend run prisma:validate >/dev/null 2>&1 ); then
    echo "  ✅ prisma:validate menemukan skema saat dijalankan dari root repo"
  else
    echo "  ❌ prisma:validate gagal saat dijalankan dari root repo"
    fail=1
  fi
else
  echo "  ⚠️  backend/node_modules/prisma tidak ada — cek dinamis dilewati"
  echo "      (jalankan 'npm --prefix backend ci' lalu ulangi)"
fi

exit "$fail"
