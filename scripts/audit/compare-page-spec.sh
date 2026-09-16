#!/usr/bin/env bash
# compare-page-spec.sh — Compare scanned page against spec, output conformance table
# Usage: bash scripts/audit/compare-page-spec.sh <page-path> <scr-id>
# Output: Markdown to stdout
set -u

if [ $# -lt 2 ]; then
  echo "## Error: Usage: compare-page-spec.sh <page-path> <scr-id>" >&2
  exit 1
fi

PAGE="$1"
SCR_ID="$2"
ROOT="$(pwd)"

SCAN_JSON=$(bash "$ROOT/scripts/audit/scan-page.sh" "$PAGE")
SPEC_JSON=$(bash "$ROOT/scripts/audit/extract-spec-fields.sh" "$SCR_ID")

ROUTE=$(echo "$SCAN_JSON" | jq -r '.route // empty')
SPEC_ROUTE=$(echo "$SPEC_JSON" | jq -r '.nexerpRoute // empty')
DNA_COUNT=$(echo "$SCAN_JSON" | jq '.dna_component_count // 0')
UI_BARREL=$(echo "$SCAN_JSON" | jq '.imports_ui_barrel_count // 0')
MOCK_COUNT=$(echo "$SCAN_JSON" | jq '.mock_array_count // 0')

TABLE_COLS=$(echo "$SPEC_JSON" | jq -r '.tableColumns[]? // empty')
FORM_INPUTS=$(echo "$SPEC_JSON" | jq -r '.formInputs[]? // empty')
CARDS=$(echo "$SPEC_JSON" | jq -r '.cards[]? // empty')
ACTIONS=$(echo "$SPEC_JSON" | jq -r '.actions[]? // empty')
SPEC_DETAIL=$(echo "$SPEC_JSON" | jq -r '.viewDetailModal // empty')

PAGE_CONTENT=$(cat "$PAGE" 2>/dev/null)

cat <<HEADER
## Page Audit — $SCR_ID
- **Path**: \`$PAGE\`
- **Route**: \`$ROUTE\`
- **Spec Route**: \`$SPEC_ROUTE\`
- **DNA Component Count**: $DNA_COUNT
- **Raw UI Barrel Imports**: $UI_BARREL (target: 0)
- **Mock Arrays**: $MOCK_COUNT

HEADER

# 1. Table Columns
echo "### 1. Table Columns"
if [ -z "$TABLE_COLS" ]; then
  echo "_No table columns specified in spec_"
else
  echo "| # | Spec Column | FE Present | Status |"
  echo "|---|---|---|---|"
  i=0
  while IFS= read -r col; do
    i=$((i+1))
    # Normalize: lowercase, strip non-alnum
    norm=$(echo "$col" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g')
    first_word=$(echo "$norm" | awk '{print $1}')
    if grep -qiE "$first_word" <<< "$PAGE_CONTENT"; then
      echo "| $i | $col | yes | ✅ |"
    else
      echo "| $i | $col | - | ❌ missing |"
    fi
  done <<< "$TABLE_COLS"
fi
echo ""

# 2. Form Inputs
echo "### 2. Form Inputs"
if [ -z "$FORM_INPUTS" ]; then
  echo "_No form inputs specified in spec_"
else
  echo "| # | Spec Field | FE Present | Status |"
  echo "|---|---|---|---|"
  i=0
  while IFS= read -r fld; do
    i=$((i+1))
    norm=$(echo "$fld" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g')
    first_word=$(echo "$norm" | awk '{print $1}')
    if grep -qiE "$first_word" <<< "$PAGE_CONTENT"; then
      echo "| $i | $fld | yes | ✅ |"
    else
      echo "| $i | $fld | - | ❌ missing |"
    fi
  done <<< "$FORM_INPUTS"
fi
echo ""

# 3. Cards
echo "### 3. Card Output"
if [ -z "$CARDS" ]; then
  echo "_No metric cards specified in spec_"
else
  echo "| # | Spec Card | FE Present | Status |"
  echo "|---|---|---|---|"
  i=0
  while IFS= read -r card; do
    i=$((i+1))
    norm=$(echo "$card" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g')
    first_word=$(echo "$norm" | awk '{print $1}')
    if grep -qiE "$first_word" <<< "$PAGE_CONTENT"; then
      echo "| $i | $card | yes | ✅ |"
    else
      echo "| $i | $card | - | ❌ missing |"
    fi
  done <<< "$CARDS"
fi
echo ""

# 4. Actions
echo "### 4. Actions"
if [ -z "$ACTIONS" ]; then
  echo "_No actions specified in spec_"
else
  echo "| # | Spec Action | FE Present | Status |"
  echo "|---|---|---|---|"
  i=0
  while IFS= read -r act; do
    i=$((i+1))
    norm=$(echo "$act" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g')
    first_word=$(echo "$norm" | awk '{print $1}')
    if grep -qiE "$first_word" <<< "$PAGE_CONTENT"; then
      echo "| $i | $act | yes | ✅ |"
    else
      echo "| $i | $act | - | ❌ missing |"
    fi
  done <<< "$ACTIONS"
fi
echo ""

# 5. Detail
echo "### 5. Detail Modal/Page"
HAS_DETAIL=$(echo "$SCAN_JSON" | jq '.has_detail_route')
DETAIL_STATUS="❌ missing"
[ "$HAS_DETAIL" = "true" ] && DETAIL_STATUS="✅ has [id]/page.tsx"
if grep -qiE "DnaModal|Modal" "$PAGE_CONTENT"; then
  DETAIL_STATUS="$DETAIL_STATUS + inline modal"
fi
echo "- Spec: \`$SPEC_DETAIL\`"
echo "- FE: $DETAIL_STATUS"
echo ""

# 6. Edit Route
HAS_UPDATE=$(echo "$SCAN_JSON" | jq '.has_update_route')
echo "### 6. Edit Route"
echo "- Status: $([ "$HAS_UPDATE" = "true" ] && echo "✅ has [id]/update or [id]/edit" || echo "⚠️  no [id]/update route (inline edit only)")"
echo ""

# 7. Print Template
HAS_PRINT=$(echo "$SCAN_JSON" | jq '.has_print_route')
echo "### 7. Print Template"
echo "- Status: $([ "$HAS_PRINT" = "true" ] && echo "✅ has [id]/print or print/page" || echo "❌ MISSING (Poin 4.3 Live Audit)")"
echo ""

# 8. Delete Flow
echo "### 8. Delete Flow"
if grep -qiE "DnaConfirmDialog|window\.confirm|confirm\(" "$PAGE_CONTENT"; then
  echo "- Confirmation: ✅"
else
  echo "- Confirmation: ⚠️  no dialog pattern detected"
fi
if grep -qiE "delete" "$PAGE_CONTENT"; then
  echo "- Delete handler: ✅"
else
  echo "- Delete handler: ❌ no delete handler"
fi
if grep -qiE "audit|log" "$PAGE_CONTENT"; then
  echo "- Audit log reference: ✅"
else
  echo "- Audit log reference: ⚠️  no audit log visible"
fi
echo ""