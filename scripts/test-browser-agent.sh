#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  P22 UAT Pre-Flight — Browser Agent (Playwright, headless)
#
#  Walks the app the way the client will: real browser, real login,
#  every page under (dashboard), then the pilot modules (Gudang &
#  Pembelian) checked for real rendered content.
#
#  Run this BEFORE asking a human to test manually. A red run is a
#  list of pages that should not be shown to anyone yet.
#
#  Fail-closed (see memory residue-gates-silent-swallow): a missing
#  backend, a missing frontend build or a failed browser run all exit
#  non-zero. A suite that reports green without a browser is worse
#  than no suite.
#
#  Usage:
#    bash scripts/test-browser-agent.sh            # headless
#    HEADED=1 bash scripts/test-browser-agent.sh   # watch it click
#    bash scripts/test-browser-agent.sh -g login   # extra args go to Playwright
#
#  Environment:
#    BACKEND_URL   backend base URL (default: probe 3002, then 3001)
#    UAT_EMAIL     login for the sweep (default: admin@dreamlab.com)
#    UAT_PASSWORD  password for that user (default: password123)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
REPORT_DIR="$ROOT_DIR/evidence/uat-preflight"
TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$REPORT_DIR"

printf '═══════════════════════════════════════════════════════════════\n'
printf '  🤖 P22 UAT PRE-FLIGHT — BROWSER AGENT\n'
printf '═══════════════════════════════════════════════════════════════\n'

# ── 1. Backend must be up: the suite asserts on real API traffic ──
printf '\n── 1. Probing backend\n'
BACKEND_URL="${BACKEND_URL:-}"
if [ -z "$BACKEND_URL" ]; then
  for candidate in http://127.0.0.1:3002 http://127.0.0.1:3001; do
    if curl -sf -o /dev/null --max-time 5 "$candidate/v1/health"; then BACKEND_URL="$candidate"; break; fi
  done
fi
if [ -z "$BACKEND_URL" ]; then
  printf '   ❌ no backend on :3002 or :3001 — start it first (cd backend && npm run start:dev)\n'
  printf '\nVERDICT: FAILED — browser agent did NOT run\n'
  exit 1
fi
printf '   ✅ backend: %s\n' "$BACKEND_URL"

# The frontend talks to it through the Next.js /api rewrite, which reads this
# from frontend/.env.local — a stale value here makes every page fail while the
# backend looks perfectly healthy, so check the pairing before blaming the UI.
printf '\n── 2. Checking the /api rewrite target\n'
REWRITE_TARGET="$(node -e '
const fs = require("fs");
const p = process.argv[1] + "/.env.local";
if (!fs.existsSync(p)) { console.log(""); process.exit(0); }
const m = fs.readFileSync(p, "utf8").match(/^NEXT_PUBLIC_API_URL=(.+)$/m);
console.log(m ? m[1].trim() : "");
' "$FRONTEND_DIR")"
if [ -z "$REWRITE_TARGET" ]; then
  printf '   ⚠️  frontend/.env.local has no NEXT_PUBLIC_API_URL — rewrite falls back to :3001\n'
else
  printf '   ✅ frontend proxies /api -> %s\n' "$REWRITE_TARGET"
  # 127.0.0.1 and localhost are the same interface — compare normalized origins.
  normalize_origin() { printf '%s' "$1" | sed -E 's#^https?://##; s#/.*$##; s#^127\.0\.0\.1:#localhost:#'; }
  if [ "$(normalize_origin "$REWRITE_TARGET")" != "$(normalize_origin "$BACKEND_URL")" ]; then
    printf '   ❌ mismatch: backend is on %s but the frontend proxies to %s\n' "$BACKEND_URL" "$REWRITE_TARGET"
    printf '\nVERDICT: FAILED — every page would fail for the wrong reason\n'
    exit 1
  fi
fi

# ── 3. Serve a production build on :3003 ──
# The dev server compiles each route on first request, one at a time: a 264-route
# sweep over it takes ~10 minutes and can only ever time out. The standalone
# build is also what the client actually sees in UAT, minus dev error overlays.
printf '\n── 3. Preparing production build (port 3003)\n'
# The sweep is only evidence about the build this script serves. A leftover
# `next start` from an earlier run holds :3003, the start below dies on
# EADDRINUSE, and the readiness loop cheerfully probes the OTHER server — a
# green run about someone else's build. Refuse instead.
#
# Asked of the socket table, not of HTTP: a half-dead server that no longer
# answers still owns the port, and `curl` would call that port free. Windows also
# lets a second process bind a port that is already listening, so "the readiness
# probe answered" is not the same as "we are the server answering it".
port_owner() {
  powershell -NoProfile -Command \
    "(Get-NetTCPConnection -State Listen -LocalPort 3003 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)" \
    2>/dev/null | tr -d '\r ' || true
}
EXISTING_PID="$(port_owner)"
if [ -n "$EXISTING_PID" ]; then
  printf '   ❌ :3003 is already held by pid %s — it would be tested instead of this build\n' "$EXISTING_PID"
  printf '      stop it first:  powershell -NoProfile -Command "Stop-Process -Id %s -Force"\n' "$EXISTING_PID"
  printf '\nVERDICT: FAILED — browser agent did NOT run\n'
  exit 1
fi
cd "$FRONTEND_DIR"
# Readiness marker, not the standalone server.js: Next nests standalone output
# under a workspace-root folder when it finds a lockfile one level up.
STANDALONE="$FRONTEND_DIR/.next/BUILD_ID"
if [ ! -f "$STANDALONE" ]; then
  printf '   building (first run, ~1-2 min)\n'
  npm run build >"$REPORT_DIR/build-$TS.log" 2>&1 || {
    printf '   ❌ frontend build failed — see %s\n' "$REPORT_DIR/build-$TS.log"
    printf '\nVERDICT: FAILED — no build to test\n'
    exit 1
  }
elif [ -n "$(find src -newer "$STANDALONE" -print -quit 2>/dev/null)" ]; then
  printf '   source newer than build — rebuilding\n'
  npm run build >"$REPORT_DIR/build-$TS.log" 2>&1 || {
    printf '   ❌ frontend build failed — see %s\n' "$REPORT_DIR/build-$TS.log"
    printf '\nVERDICT: FAILED — no build to test\n'
    exit 1
  }
else
  printf '   ✅ existing build is current\n'
fi

# The /api rewrite target is baked into the build (routes-manifest), not read at
# server start: pointed at a logging proxy on :3010, the running build still sent
# /api requests to the backend named in frontend/.env.local at build time. The
# inline env below is therefore belt-and-braces for runtime readers — the gate
# that actually protects the pairing is the .env.local check in step 2.
printf '   starting server on :3003 -> %s\n' "$BACKEND_URL"
INTERNAL_BACKEND_URL="$BACKEND_URL" NEXT_PUBLIC_API_URL="$BACKEND_URL" \
  npx next start -p 3003 >"$REPORT_DIR/server-$TS.log" 2>&1 &
SERVER_PID=$!
# `npx next start` is a wrapper, and under Git Bash `$!` is an MSYS pid that
# Windows taskkill/kill cannot address — so signalling the parent leaves the real
# server holding :3003 forever. Remember the process that owns the port instead,
# and clean up exactly that one: killing "whoever owns :3003 at exit time" let an
# orphaned run's trap shoot a later run's server out from under it.
sleep 2
SERVER_PORT_PID="$(port_owner)"
cleanup_server() {
  kill "$SERVER_PID" 2>/dev/null || true
  if [ -n "${SERVER_PORT_PID:-}" ]; then
    powershell -NoProfile -Command \
      "Stop-Process -Id $SERVER_PORT_PID -Force -ErrorAction SilentlyContinue" \
      >/dev/null 2>&1 || true
  fi
}
trap cleanup_server EXIT

FRONTEND_UP=0
for _ in $(seq 1 40); do
  if curl -sf -o /dev/null --connect-timeout 2 --max-time 4 http://127.0.0.1:3003/login; then FRONTEND_UP=1; break; fi
  sleep 2
done
if [ "$FRONTEND_UP" -ne 1 ]; then
  printf '   ❌ frontend build never came up on :3003 — see %s\n' "$REPORT_DIR/server-$TS.log"
  printf '\nVERDICT: FAILED — browser agent did NOT run\n'
  exit 1
fi
# Readiness proves *a* server answers :3003. If ours died on EADDRINUSE, that
# server is somebody else's — the whole run would then be evidence about a build
# this script never served.
if grep -qi 'EADDRINUSE' "$REPORT_DIR/server-$TS.log"; then
  printf '   ❌ our server never bound :3003 (EADDRINUSE) — the answering server is not this build\n'
  printf '      see %s\n' "$REPORT_DIR/server-$TS.log"
  printf '\nVERDICT: FAILED — browser agent did NOT run\n'
  exit 1
fi
printf '   ✅ frontend serving on http://127.0.0.1:3003 (pid %s)\n' "${SERVER_PORT_PID:-?}"

# ── 4. Run the browser agent (Playwright reuses the server above) ──
printf '\n── 4. Running Playwright\n'
# Leftover headless browsers from an aborted earlier run slow the machine down, and
# have already produced one round of confusing reds: login POSTs that never came
# back, which read as a login bug. Counting them is safe; killing them is not — the
# same process name is the operator's own Chrome, so this only says so.
BROWSER_PROCS="$(powershell -NoProfile -Command \
  "(Get-Process -Name chrome,headless_shell,chromium -ErrorAction SilentlyContinue).Count" \
  2>/dev/null | tr -d '\r ' || true)"
case "${BROWSER_PROCS:-}" in
  ''|*[!0-9]*) ;;
  *) if [ "$BROWSER_PROCS" -gt 20 ]; then
       printf '   ⚠️  %s browser processes are already running. If login fails here, suspect\n' "$BROWSER_PROCS"
       printf '      machine load before the app: close stray headless browsers and re-run.\n'
     fi ;;
esac
mkdir -p "$REPORT_DIR"
HEADED_FLAG=""
[ -n "${HEADED:-}" ] && HEADED_FLAG="--headed"
set +e
npx playwright test tests/e2e/uat-preflight/pilot-uat.spec.ts \
  --reporter=list --output="$REPORT_DIR/artifacts" $HEADED_FLAG "$@"
EXIT_CODE=$?
set -e

printf '\n───────────────────────────────────────────────────────────────\n'
if [ "$EXIT_CODE" -eq 0 ]; then
  printf '✅ [P22] UAT PRE-FLIGHT PASSED (Exit Code: 0)\n'
  printf '   Report: %s/html-report/index.html\n' "$FRONTEND_DIR"
  printf '   NOTE: this proves the app renders and the API answers. It does not\n'
  printf '         prove business numbers are right — that is the dual-run.\n'
else
  printf '❌ [P22] UAT PRE-FLIGHT FAILED (Exit Code: %s)\n' "$EXIT_CODE"
  printf '   Failures above are pages/APIs a human should not be shown yet.\n'
  printf '   Screenshots + traces: %s/artifacts\n' "$REPORT_DIR"
fi
printf '───────────────────────────────────────────────────────────────\n'
exit "$EXIT_CODE"
