#!/usr/bin/env bash
# scan-page.sh — Static analysis of a Next.js page.tsx file
# Usage: bash scripts/audit/scan-page.sh "frontend/src/app/(dashboard)/master/goods/page.tsx"
# Output: JSON to stdout
set -u

if [ $# -lt 1 ]; then
  echo '{"error":"Usage: scan-page.sh <page-path>"}' >&2
  exit 1
fi

PAGE="$1"
ROOT="${ROOT:-$(pwd)}"

if [ ! -f "$PAGE" ]; then
  echo "{\"error\":\"File not found: $PAGE\"}" >&2
  exit 2
fi

# File metrics
TOTAL_LINES=$(wc -l < "$PAGE" 2>/dev/null | tr -d ' \n' || echo 0)
TOTAL_BYTES=$(wc -c < "$PAGE" 2>/dev/null | tr -d ' \n' || echo 0)

# Import barrel counts
UI_BARREL=$(grep -cE 'from "@/components/ui/[a-z-]+"' "$PAGE" 2>/dev/null | head -1 || echo 0)
DNA_BARREL=$(grep -cE 'from "@/components/dna(/[a-z-]+)?"' "$PAGE" 2>/dev/null | head -1 || echo 0)

# Mock array detection (one match per line)
MOCK_ARRAYS=$(grep -nE '^(const|let|var)\s+(MOCK_|INITIAL_|STATIC_|SAMPLE_|DEFAULT_|SEED_)[A-Z0-9_]*\s*[:=]' "$PAGE" 2>/dev/null | \
  while IFS=: read -r ln line; do
    name=$(echo "$line" | sed -E 's/^(const|let|var)\s+([A-Z0-9_]+).*/\2/')
    echo "{\"name\":\"$name\",\"line\":$ln}"
  done | tr '\n' ',' | sed 's/,$//')

if [ -z "$MOCK_ARRAYS" ]; then
  MOCK_ARRAYS_JSON="[]"
else
  MOCK_ARRAYS_JSON="[$MOCK_ARRAYS]"
fi

# Count mock arrays (separate counter)
MOCK_COUNT=$(grep -cE '^(const|let|var)\s+(MOCK_|INITIAL_|STATIC_|SAMPLE_|DEFAULT_|SEED_)[A-Z0-9_]*\s*[:=]' "$PAGE" 2>/dev/null | head -1 || echo 0)

# Raw input element counts
INPUT_COUNT=$(grep -cE '<input' "$PAGE" 2>/dev/null | head -1 || echo 0)
SELECT_COUNT=$(grep -cE '<select' "$PAGE" 2>/dev/null | head -1 || echo 0)
TEXTAREA_COUNT=$(grep -cE '<textarea' "$PAGE" 2>/dev/null | head -1 || echo 0)
TABLE_COUNT=$(grep -cE '<table' "$PAGE" 2>/dev/null | head -1 || echo 0)
DATE_INPUT_COUNT=$(grep -cE 'type="date"' "$PAGE" 2>/dev/null | head -1 || echo 0)

# Hardcoded values detection
RP_COUNT=$(grep -cE 'Rp\s' "$PAGE" 2>/dev/null | head -1 || echo 0)
LOCALE_COUNT=$(grep -cE 'toLocaleString\(' "$PAGE" 2>/dev/null | head -1 || echo 0)
HEX_COLOR_COUNT=$(grep -cE '#[0-9a-fA-F]{6}' "$PAGE" 2>/dev/null | head -1 || echo 0)

# SPEC ref comment (extract // SPEC: SCR-NNN at top-of-file)
SPEC_REF=$(grep -oE 'SPEC:\s*SCR-[0-9]+' "$PAGE" 2>/dev/null | head -1 | sed 's/SPEC:\s*//')

# Sibling route detection
PAGE_DIR=$(dirname "$PAGE")
PAGE_BASE=$(basename "$PAGE" .tsx)
PARENT_DIR=$(dirname "$PAGE_DIR")

# Print route: sibling [id]/print or print/ folder
PRINT_PATH_1="$PAGE_DIR/[id]/print/page.tsx"
PRINT_PATH_2="$PAGE_DIR/print/page.tsx"
HAS_PRINT=false
[ -f "$PRINT_PATH_1" ] && HAS_PRINT=true
[ -f "$PRINT_PATH_2" ] && HAS_PRINT=true

# Detail route: sibling [id]/page.tsx (excluding own page.tsx)
DETAIL_PATH="$PAGE_DIR/[id]/page.tsx"
HAS_DETAIL=false
[ -f "$DETAIL_PATH" ] && HAS_DETAIL=true

# Update route: sibling [id]/update/page.tsx or /edit/page.tsx
UPDATE_PATH_1="$PAGE_DIR/[id]/update/page.tsx"
UPDATE_PATH_2="$PAGE_DIR/[id]/edit/page.tsx"
HAS_UPDATE=false
[ -f "$UPDATE_PATH_1" ] && HAS_UPDATE=true
[ -f "$UPDATE_PATH_2" ] && HAS_UPDATE=true

# Create route: sibling create/page.tsx
CREATE_PATH="$PAGE_DIR/create/page.tsx"
HAS_CREATE=false
[ -f "$CREATE_PATH" ] && HAS_CREATE=true

# Computed route from path: frontend/src/app/(dashboard)/<route>/page.tsx -> /<route>
COMPUTED_ROUTE=$(echo "$PAGE" | sed -E 's|^frontend/src/app/\(dashboard\)/||' | sed 's|/page\.tsx$||' | sed 's|^|/|')
[ "$COMPUTED_ROUTE" = "//page.tsx" ] && COMPUTED_ROUTE="/"
[ "$COMPUTED_ROUTE" = "/" ] && COMPUTED_ROUTE="/dashboard"

# Component usage
DNA_COMPONENT_USAGE=$(grep -oE 'Dna[A-Z][a-zA-Z]*' "$PAGE" 2>/dev/null | sort -u | tr '\n' ',' | sed 's/,$//')
DNA_COMPONENT_COUNT=$(echo "$DNA_COMPONENT_USAGE" | tr ',' '\n' | grep -c . 2>/dev/null | head -1 || echo 0)

# React Query usage
HAS_RQ=$(grep -cE 'use(Query|Mutation)' "$PAGE" 2>/dev/null | head -1 || echo 0)

# Print JSON
cat <<JSON
{
  "mock_arrays": $MOCK_ARRAYS_JSON,
  "path": "$PAGE",
  "mock_array_count": $MOCK_COUNT,
  "route": "$COMPUTED_ROUTE",
  "total_lines": $TOTAL_LINES,
  "total_bytes": $TOTAL_BYTES,
  "spec_ref": "$SPEC_REF",
  "imports_ui_barrel_count": $UI_BARREL,
  "imports_dna_barrel_count": $DNA_BARREL,
  "dna_components": "$DNA_COMPONENT_USAGE",
  "dna_component_count": $DNA_COMPONENT_COUNT,
  "mock_arrays": $MOCK_ARRAYS_JSON,
  "mock_array_count": $(echo "$MOCK_ARRAYS" | grep -c . 2>/dev/null || echo 0),
  "raw_inputs": {
    "input": $INPUT_COUNT,
    "select": $SELECT_COUNT,
    "textarea": $TEXTAREA_COUNT,
    "table": $TABLE_COUNT,
    "date_input": $DATE_INPUT_COUNT
  },
  "hardcoded_values": {
    "rp_prefix": $RP_COUNT,
    "toLocaleString": $LOCALE_COUNT,
    "hex_color": $HEX_COLOR_COUNT
  },
  "has_print_route": $HAS_PRINT,
  "has_detail_route": $HAS_DETAIL,
  "has_update_route": $HAS_UPDATE,
  "has_create_route": $HAS_CREATE,
  "react_query_hooks": $HAS_RQ
}
JSON