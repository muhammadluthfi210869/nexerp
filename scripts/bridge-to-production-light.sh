#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Bridge commits from phase-3 → production-light safely
# ═══════════════════════════════════════════════════════════════
#  Usage: bash scripts/bridge-to-production-light.sh <source-branch> <commit-ish>
#  Example: bash scripts/bridge-to-production-light.sh phase-3 1b2c800
#
#  Pattern: surgical cherry-pick of ONE atomic commit group, never
#  wholesale merge. Mirrors the 20fb4e1 canonical-marketing bridge
#  (see docs/qa-gate/2026-09-14-canonical-bridge-prod-light.md).
#
#  This script enforces the pattern with:
#    1. Branch guard (must be on production-light)
#    2. Clean tree guard
#    3. Size limit (<=50 files, <=5000 lines)
#    4. Wholesale-merge detection (root-level files prompt for confirmation)
#    5. Prisma schema validation (prisma generate must succeed)
#    6. Jest test run on touched modules
#    7. TypeScript compilation check
#    8. Source-level regression guards (pg_advisory_xact_lock is BANNED)
#    9. Cherry-pick with --no-commit for review
#   10. Push + notification
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SRC="${1:?usage: $0 <source-branch> <commit-or-range>}"
PICK="${2:?usage: $0 <source-branch> <commit-or-range>}"

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "▶ Bridge: $PICK  from  $SRC  →  $(git branch --show-current)"
echo ""

# ─────────────────────────────────────────────────────────────
# Guard 1: must be on production-light
# ─────────────────────────────────────────────────────────────
CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "production-light" ]; then
  echo "❌ Must be on production-light branch (currently on: $CURRENT_BRANCH)"
  echo "   Run: git checkout production-light"
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# Guard 2: working tree must be clean
# ─────────────────────────────────────────────────────────────
if ! git diff-index --quiet HEAD --; then
  echo "❌ Working tree is dirty — commit or stash first"
  git status --short
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# Guard 3: ref must exist locally
# ─────────────────────────────────────────────────────────────
if ! git rev-parse --verify "$PICK" >/dev/null 2>&1; then
  echo "❌ $PICK not found locally. Try: git fetch origin $SRC"
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# Guard 4: size limit (matching canonical-bridge pattern)
# ─────────────────────────────────────────────────────────────
if [[ "$PICK" == *".."* ]]; then
  RANGE="$PICK"
else
  RANGE="$PICK^..$PICK"
fi
FILE_COUNT=$(git diff --name-only "$RANGE" | wc -l | tr -d ' ')
LINE_COUNT=$(git diff --shortstat "$RANGE" | awk '{print $4+$6}')
LINE_COUNT=${LINE_COUNT:-0}

echo "▶ Files to bridge: $FILE_COUNT  /  ~$LINE_COUNT lines"
git diff --stat "$RANGE" | head -20
echo ""

if [ "$FILE_COUNT" -gt 50 ]; then
  echo "❌ Too large: $FILE_COUNT files (limit: 50). Split into smaller bridges."
  exit 1
fi

if [ "$LINE_COUNT" -gt 5000 ]; then
  echo "❌ Too large: $LINE_COUNT lines (limit: 5000). Split into smaller bridges."
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# Guard 5: detect root-level files (wholesale merge red flag)
# ─────────────────────────────────────────────────────────────
if git diff "$RANGE" --name-only | grep -qE '^(package\.json|backend/src/app\.module\.ts|backend/prisma/schema\.base\.prisma|backend/prisma/schema\.prisma)$'; then
  echo "⚠️  Bridge touches root-level files:"
  git diff "$RANGE" --name-only | grep -E '^(package\.json|backend/src/app\.module\.ts|backend/prisma/schema\.base\.prisma|backend/prisma/schema\.prisma)$' || true
  echo ""
  echo "These are sensitive — verify intent, then press Enter to continue."
  echo "Press Ctrl-C to abort."
  read -r _
fi

# ─────────────────────────────────────────────────────────────
# Cherry-pick (no-commit so we can validate)
# ─────────────────────────────────────────────────────────────
echo "▶ Cherry-picking $PICK..."
git cherry-pick -n "$PICK"

# ─────────────────────────────────────────────────────────────
# Guard 6: prisma generate
# ─────────────────────────────────────────────────────────────
echo "▶ prisma generate..."
if ! (cd backend && npx prisma generate >/tmp/prisma-gen.log 2>&1); then
  echo "❌ prisma generate failed:"
  cat /tmp/prisma-gen.log | tail -10
  git cherry-pick --abort
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# Guard 7: jest on touched modules
# ─────────────────────────────────────────────────────────────
echo "▶ jest on touched modules..."
TOUCHED_SPECS=$(git diff --cached --name-only -- 'backend/src/**/*.spec.ts' | xargs -I{} dirname {} | sort -u | head -10)
if [ -n "$TOUCHED_SPECS" ]; then
  if ! (cd backend && npx jest $TOUCHED_SPECS --runInBand --bail >/tmp/jest.log 2>&1); then
    echo "❌ jest failed:"
    tail -20 /tmp/jest.log
    git cherry-pick --abort
    exit 1
  fi
  echo "✅ jest passed"
else
  echo "  (no test files touched — skipping jest)"
fi

# ─────────────────────────────────────────────────────────────
# Guard 8: tsc on backend
# ─────────────────────────────────────────────────────────────
echo "▶ tsc on backend..."
if ! (cd backend && npx tsc --noEmit >/tmp/tsc.log 2>&1); then
  echo "❌ tsc failed:"
  tail -10 /tmp/tsc.log
  git cherry-pick --abort
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# Guard 9: source-level regression guards
# ─────────────────────────────────────────────────────────────
echo "▶ source-level regression guards..."
if grep -rn 'pg_advisory_xact_lock' backend/src 2>/dev/null; then
  echo "❌ Bridge introduced pg_advisory_xact_lock (Driver Adapter incompatible)"
  git cherry-pick --abort
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# Show final diff + confirm
# ─────────────────────────────────────────────────────────────
echo ""
echo "▶ Final diff:"
git diff --cached --stat
echo ""
echo "Press Enter to commit + push, Ctrl-C to abort"
read -r _

# ─────────────────────────────────────────────────────────────
# Commit + push
# ─────────────────────────────────────────────────────────────
ORIGINAL_SUBJECT="$(git log -1 --format=%s $PICK)"
git commit -m "bridge: $ORIGINAL_SUBJECT"
git push origin production-light

echo ""
echo "✅ Bridge pushed to origin/production-light."
echo "   Next VPS user-action:"
echo "   ssh dreamlab@103.93.134.215 'cd /home/dreamlab/nexerp && git pull --ff-only origin production-light && docker compose -p production-light up -d --build backend frontend'"
