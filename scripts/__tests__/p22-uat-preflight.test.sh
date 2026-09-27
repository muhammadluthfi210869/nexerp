#!/bin/bash
# Regression: the P22 browser-agent gate must never report on a build it did not serve,
# and must never silently pass a page whose data call was abandoned.
#
# Bugs found 2026-09-25 (`docs/qa-gate/2026-09-25-p22-uat-preflight-browser-agent.md`):
#   1. The runner only asked "does something answer on :3003?" — and Windows lets a second
#      process bind a port that is already listening, so a leftover server from an earlier
#      run could answer and make the whole sweep evidence about somebody else's build.
#   2. The cleanup killed "whoever owns :3003 at exit", so an orphaned run's trap shot a
#      later run's server out from under it.
#   3. A fetch that is never answered was invisible: no 5xx, no console error, no error
#      surface, content present. Login POSTs aborted at axios's 15s timeout
#      (`frontend/src/lib/api.ts`) while the page rendered "Login failed — check your
#      credentials", and the suite called that page healthy.
#
# The occupancy guard is tested by holding the port for real, not by grepping for the
# function name: the defect was in behaviour, so the test must be behavioural.
set -euo pipefail
cd "$(dirname "$0")/../.."

FAIL=0
bad() { echo "❌ $1"; FAIL=1; }

RUNNER="scripts/test-browser-agent.sh"
UAT="frontend/tests/e2e/uat-preflight/uat.ts"
SPEC="frontend/tests/e2e/uat-preflight/pilot-uat.spec.ts"
CONFIG="frontend/playwright.config.ts"

for f in "$RUNNER" "$UAT" "$SPEC" "$CONFIG"; do
  [ -f "$f" ] || bad "$f missing"
done
[ -x "$RUNNER" ] || bad "$RUNNER not executable"

port_owner() {
  powershell -NoProfile -Command \
    "(Get-NetTCPConnection -State Listen -LocalPort 3003 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)" \
    2>/dev/null | tr -d '\r ' || true
}

# ── Runner: the port guard is socket-table based, and cleanup is per-run ──
grep -q 'Get-NetTCPConnection' "$RUNNER" || bad "$RUNNER does not ask the socket table who owns :3003"
grep -q 'EADDRINUSE' "$RUNNER" || bad "$RUNNER does not detect that its own server never bound"
grep -q 'SERVER_PORT_PID' "$RUNNER" || bad "$RUNNER does not remember which pid owns the port it started"
if grep -qE 'kill .*port_owner|Stop-Process -Id \$\(port_owner' "$RUNNER"; then
  bad "$RUNNER kills whoever holds :3003 at exit instead of the pid it started"
fi

# ── Harness: the abandoned-call collector and the hydration-safe submit ──
grep -q "includes('/api/')" "$UAT" || bad "$UAT ignores failed API calls"
grep -q '10_000' "$UAT" || bad "$UAT has no age threshold — navigation aborts would read as failures"
grep -q 'API call unanswered' "$UAT" || bad "$UAT does not report an abandoned API call as a problem"
grep -q "dispatchEvent(new Event('submit'" "$UAT" || bad "$UAT does not dispatch submit (a click never settles)"
if grep -q 'click(' "$UAT"; then
  bad "$UAT clicks again — the submit button disables itself and the click never settles"
fi
grep -q '__reactProps' "$UAT" || bad "$UAT does not wait for React to hydrate the form"

# ── Spec: the sweep cannot pass vacuously ──
grep -q 'toBeGreaterThan(200)' "$SPEC" || bad "$SPEC does not assert that route discovery found the app"
grep -q 'SHARDS' "$SPEC" || bad "$SPEC no longer shards the sweep"

# ── Config: a direct `npx playwright test` must not fall back to the dev server ──
if grep -q "command: 'npm run dev" "$CONFIG"; then
  bad "$CONFIG webServer starts the dev server — a 264-route sweep over it only ever times out"
fi

# ── Behaviour: a held :3003 must make the runner refuse, loudly ──
if [ -n "$(port_owner)" ]; then
  echo "⏭️  SKIP occupancy behaviour: :3003 is already held on this machine"
elif ! curl -sf -o /dev/null --max-time 5 http://127.0.0.1:3002/v1/health; then
  echo "⏭️  SKIP occupancy behaviour: no backend on :3002 (the runner would refuse for another reason)"
else
  PIDFILE="$(mktemp)"
  node -e "require('http').createServer((q,s)=>s.end('busy')).listen(3003,()=>console.log(process.pid))" \
    >"$PIDFILE" 2>/dev/null &
  for _ in $(seq 1 30); do [ -s "$PIDFILE" ] && break; sleep 0.5; done
  BUSY_PID="$(tr -d '\r\n ' <"$PIDFILE")"
  if [ -z "$BUSY_PID" ]; then
    bad "could not hold :3003 to test the guard"
  else
    set +e
    OUT="$(bash "$RUNNER" 2>&1)"
    RC=$?
    set -e
    if [ "$RC" -eq 0 ]; then
      bad "runner exited 0 while :3003 was held by pid $BUSY_PID — it tested the wrong server"
    fi
    printf '%s' "$OUT" | grep -q ":3003 is already held by pid" \
      || bad "runner refused, but not because of the held port (stderr: $(printf '%s' "$OUT" | tail -2 | tr '\n' ' '))"
    printf '%s' "$OUT" | grep -q 'browser agent did NOT run' \
      || bad "runner refused without saying the agent did not run"
    powershell -NoProfile -Command "Stop-Process -Id $BUSY_PID -Force -ErrorAction SilentlyContinue" >/dev/null 2>&1 || true
    rm -f "$PIDFILE"
  fi
fi

if [ "$FAIL" -eq 0 ]; then
  echo "✅ P22 browser-agent gate: fail-closed on a foreign :3003, and cannot pass a silent data failure"
fi
exit "$FAIL"
