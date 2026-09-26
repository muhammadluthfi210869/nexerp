#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  fabrication-guards — Fase 2 fabrication reproduction tests
# ═══════════════════════════════════════════════════════════════
#  CLAUDE.md QA GATE: every bug gets a failing reproduction test BEFORE
#  the fix. Two real production fabrications were removed in Fase 2 and
#  each has a vitest guard; this wrapper makes them run in the shell suite
#  so the whole regression surface stays one command.
#
#    finance/piutang  — AR Hub rendered STATIC_SALES_INVOICES /
#                       STATIC_SAMPLE_INVOICES (no fetch at all)
#    samples/npf      — MOCK_NPFS returned whenever the live query
#                       yielded nothing (including on request failure)
#    finance/jurnal   — Auto Journal labelled COA mappings from a
#                       hardcoded STATIC_COA literal, not the live COA
#    quality/
#    checklist-category — STATIC_CATEGORIES (8 invented rows) rendered on
#                       failure, on empty, and fabricated per-row defaults
#                       inside a successful mapping; KPIs were literals
#    quality/checklist — three seed literals (INITIAL_CHECKLISTS 4 SO rows,
#                       INITIAL_CATEGORIES 16 milestones, INITIAL_MANAGE_*)
#                       plus a bare `catch {}` and invented in-mapping SO
#                       identity; category writes had no backend route
#    master/suppliers, customers, goods, warehouses — write actions that only
#                       wrote to local React state and toasted "berhasil";
#                       a refresh lost the record, and the supplier Excel
#                       import toasted an invented count of 12 rows
#                       without ever reading a file
#
#  Every guard is a vitest file, so this script shells out to vitest.
# ═══════════════════════════════════════════════════════════════
set -uo pipefail

cd "$(dirname "$0")/../.."  # repo root

GUARDS=(
  "src/app/(dashboard)/finance/__tests__/piutang-ar-hub-fabrication.test.tsx"
  "src/app/(dashboard)/finance/__tests__/jurnal-static-coa-fabrication.test.tsx"
  "src/app/(dashboard)/samples/__tests__/npf-fabrication.test.tsx"
  "src/app/(dashboard)/quality/__tests__/checklist-category-fabrication.test.tsx"
  "src/app/(dashboard)/quality/__tests__/checklist-hub-fabrication.test.tsx"
  "src/app/(dashboard)/master/__tests__/master-crud-persistence.test.tsx"
)

for g in "${GUARDS[@]}"; do
  if [ ! -f "frontend/$g" ]; then
    echo "MISSING guard: frontend/$g"
    exit 1
  fi
done

cd frontend
npx vitest run "${GUARDS[@]}"
exit $?