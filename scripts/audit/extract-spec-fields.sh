#!/usr/bin/env bash
# extract-spec-fields.sh — Extract SCR spec fields from JSON catalog
# Usage: bash scripts/audit/extract-spec-fields.sh SCR-091
# Output: JSON to stdout
set -u

if [ $# -lt 1 ]; then
  echo '{"error":"Usage: extract-spec-fields.sh <SCR-ID>"}' >&2
  exit 1
fi

SCR_ID="$1"
CATALOG="docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json"

if [ ! -f "$CATALOG" ]; then
  echo "{\"error\":\"Catalog not found: $CATALOG\"}" >&2
  exit 2
fi

# Resolve node binary (cross-platform)
NODE_BIN=""
if command -v node >/dev/null 2>&1; then
  NODE_BIN="node"
elif [ -x "/c/Program Files/nodejs/node.exe" ]; then
  NODE_BIN="/c/Program Files/nodejs/node.exe"
elif [ -x "/c/Windows/node.exe" ]; then
  NODE_BIN="/c/Windows/node.exe"
fi

if [ -z "$NODE_BIN" ]; then
  echo "{\"error\":\"No node found; install Node.js\"}" >&2
  exit 3
fi

# Build node script as a temp file to avoid quoting hell
TMP_SCRIPT="/tmp/extract-spec-$$.js"
cat > "$TMP_SCRIPT" <<'EOF'
const fs = require('fs');
const catPath = process.argv[2];
const scrId = process.argv[3];
const data = JSON.parse(fs.readFileSync(catPath, 'utf8'));
const screen = (data.screens || []).find(s => s.screenId === scrId);
if (!screen) {
  console.log(JSON.stringify({error: 'Screen not found', screenId: scrId}));
  process.exit(0);
}
const out = {
  screenId: screen.screenId || null,
  area: screen.area || null,
  menu: screen.menu || null,
  page: screen.page || null,
  legacyUrl: screen.legacyUrl || null,
  nexerpRoute: screen.nexerpRoute || null,
  type: screen.type || null,
  moduleId: screen.moduleId || null,
  moduleName: screen.moduleName || null,
  cards: screen.cards || [],
  tableColumns: screen.tableColumns || [],
  formInputs: screen.formInputs || [],
  actions: screen.actions || [],
  viewDetailModal: screen.viewDetailModal || null,
  specialRequirementsNotes: screen.specialRequirementsNotes || null,
  liveStatus: screen.liveStatus || null,
  apiEndpoint: screen.apiEndpoint || null
};
console.log(JSON.stringify(out));
EOF

"$NODE_BIN" "$TMP_SCRIPT" "$CATALOG" "$SCR_ID"
RC=$?
rm -f "$TMP_SCRIPT"
exit $RC