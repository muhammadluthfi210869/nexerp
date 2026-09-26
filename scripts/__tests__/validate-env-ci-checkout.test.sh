#!/bin/bash
# Regression: P00 environment validation must pass in a clean CI checkout.
#
# Bug (introduced ff47ed36, 2026-09-18): `scripts/security/validate_env.js`
# required `.env` to EXIST while also requiring `.gitignore` to ignore it. A
# gitignored, untracked file can never be present in a CI checkout, so the
# "Security & Secret Gate (P00)" step exited 1 on every run — killing the
# pipeline 1m42s in, before the P03/P04 certifications and before any GHCR
# image push. No image has been built since.
#
# Behaviour locked here: with NO `.env` present (exactly the CI condition),
# validate_env.js exits 0. Local runs WITH a `.env` must keep validating its
# syntax.
set -uo pipefail
cd "$(dirname "$0")/../.."

FAIL=0
BACKUP=".env.__validate_env_regression_backup"

restore() {
  if [ -f "$BACKUP" ]; then
    mv -f "$BACKUP" .env
  fi
}
trap restore EXIT INT TERM

# ── 1. CI condition: no `.env` at all ────────────────────────────────────────
if [ -f .env ]; then
  mv .env "$BACKUP"
fi

if [ -f .env ]; then
  echo "❌ could not simulate a CI checkout: .env is still present"
  FAIL=1
else
  OUT="$(node scripts/security/validate_env.js 2>&1)"
  RC=$?
  if [ "$RC" -ne 0 ]; then
    echo "❌ validate_env.js exited $RC without .env (CI checkout):"
    echo "$OUT" | sed 's/^/    /'
    FAIL=1
  fi
fi

restore
[ -f "$BACKUP" ] && { echo "❌ .env was not restored"; exit 1; }

# ── 2. Syntax validation must still bite when `.env` IS present ──────────────
# A malformed line inside `.env` must be rejected, so fixing the absence check
# cannot have silently disabled the whole validator.
if [ -f .env ]; then
  cp .env "$BACKUP"
  printf '\nBROKEN LINE WITHOUT DELIMITER\n' >> .env
  OUT="$(node scripts/security/validate_env.js 2>&1)"
  RC=$?
  mv -f "$BACKUP" .env
  if [ "$RC" -eq 0 ]; then
    echo "❌ validate_env.js accepted a malformed .env line"
    FAIL=1
  fi
fi

[ "$FAIL" -eq 0 ] && echo "✅ validate_env.js is CI-checkout safe and still validates .env syntax" && exit 0
exit 1