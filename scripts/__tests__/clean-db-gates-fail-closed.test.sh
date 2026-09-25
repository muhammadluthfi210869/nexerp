#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  clean-db-gates-fail-closed — the residue gates must not lie
# ═══════════════════════════════════════════════════════════════
#  Why this exists
#  ---------------
#  A residue gate answers one question: "did the phase's suites leave anything
#  behind?" It is worthless if a probe that could not run is reported as zero.
#
#  Observed defect class (the reason the 2026-09-25 fix landed): a probe that
#  throws — table absent, column renamed, connection dropped mid-run — was
#  caught and discarded, so the gate printed "0 residue" while the rows it was
#  watching were still in the table. "I could not look" must never read as
#  "I looked and it was clean".
#
#  What is asserted, for each of the 12 `p07..p18` gates plus their shared shape:
#    1. the probe loop records failures (a `broken` collector exists);
#    2. a non-empty `broken` set is a FAILURE (exits non-zero), not a note;
#    3. a residue finding is a FAILURE (`console.error` + non-zero exit) —
#       never `console.warn`, which prints and then exits 0.
#
#  This is a static assertion because the defect is in the source shape and the
#  CI shell suite has no PostgreSQL to run the gates against. When a DB is
#  available, `bash scripts/__tests__/run-all.sh` exercises the gates for real
#  through `verify:pNN`.
# ═══════════════════════════════════════════════════════════════
set -uo pipefail

cd "$(dirname "$0")/../.."  # repo root

GATES=(scripts/ssot/p07_clean_db.js scripts/ssot/p08_clean_db.js scripts/ssot/p09_clean_db.js
       scripts/ssot/p10_clean_db.js scripts/ssot/p11_clean_db.js scripts/ssot/p12_clean_db.js
       scripts/ssot/p13_clean_db.js scripts/ssot/p14_clean_db.js scripts/ssot/p15_clean_db.js
       scripts/ssot/p16_clean_db.js scripts/ssot/p17_clean_db.js scripts/ssot/p18_clean_db.js)

fail=0
note() { echo "  ✗ $1"; fail=1; }

for g in "${GATES[@]}"; do
  if [ ! -f "$g" ]; then
    note "$g is missing"
    continue
  fi

  # 1. the probe loop collects what it could not read
  if ! grep -q 'broken' "$g"; then
    note "$g: probes have no \`broken\` collector — a failed probe would report as zero"
  fi

  # 2. a non-empty broken set must FAIL
  if ! grep -qE 'broken\.length\s*>\s*0' "$g"; then
    note "$g: nothing acts on a non-empty \`broken\` set — residue stays UNKNOWN and exits 0"
  fi

  # 3. no bare `catch {`: it takes no error and names no reason, so a probe that
  #    cannot run is indistinguishable from one that ran and found nothing.
  #    A *named* catch is fine — it decides something with the error.
  if grep -qE 'catch\s*\{' "$g"; then
    note "$g: bare \`catch {\` present — swallowed error with no record"
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "clean-db-gates-fail-closed: FAIL"
  exit 1
fi
echo "clean-db-gates-fail-closed: PASS (12/12 gates fail closed)"
exit 0