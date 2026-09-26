#!/bin/bash
# Behavioural regression test for scripts/verify-pdf-live.sh.
#
# The bug it guards against: a PDF endpoint that answers 200 with a one-line placeholder while
# the real renderer is dead. A probe that only checks "HTTP 200" would call that a pass, which
# is exactly what /v1/health already did. So the probe is fed both shapes here, over a real
# socket, and must separate them.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROBE="$SCRIPT_DIR/../../scripts/verify-pdf-live.sh"
TMP_DIR="$(mktemp -d)"
SERVER_PID=""

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

command -v node >/dev/null 2>&1 || { echo "SKIP: node not available"; exit 0; }

# Serves a login token plus a PDF endpoint whose body depends on the mode we ask for.
start_server() {
  local mode="$1"
  MODE="$mode" node -e '
    const http = require("http");
    const mode = process.env.MODE;
    const srv = http.createServer((req, res) => {
      if (req.url.endsWith("/auth/login")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ access_token: "probe-token" }));
      }
      if (req.url.endsWith("/document-automation/pdf")) {
        if (mode === "placeholder") {
          const body = "%PDF-1.4\n1 0 obj (NEX ERP Fallback Document Snapshot) endobj\n%%EOF";
          res.writeHead(200, { "Content-Type": "application/pdf" });
          return res.end(body);
        }
        // A rendered document: right magic bytes, tens of KB, no placeholder text.
        const body = "%PDF-1.4\n" + "0 0 obj << >> endobj\n".repeat(900) + "%%EOF";
        res.writeHead(200, { "Content-Type": "application/pdf" });
        return res.end(body);
      }
      res.writeHead(404); res.end();
    });
    srv.listen(0, "127.0.0.1", () => {
      require("fs").writeFileSync(process.env.PORTFILE, String(srv.address().port));
    });
  ' &
  SERVER_PID=$!
  for _ in $(seq 1 40); do
    [ -s "$TMP_DIR/port" ] && break
    sleep 0.25
  done
  PORT="$(cat "$TMP_DIR/port" 2>/dev/null || true)"
  [ -n "$PORT" ] || { echo "SKIP: stub server did not start"; exit 0; }
}

run_probe() {
  BASE_URL="http://127.0.0.1:$1" PROBE_EMAIL="probe@example.com" PROBE_PASSWORD="probe-pass" \
    bash "$PROBE" 2>&1
}

fail=0

# ── Case 1: the endpoint answers 200 with the placeholder. The probe must reject it. ──
rm -f "$TMP_DIR/port"; PORTFILE="$TMP_DIR/port" start_server placeholder
OUT="$(run_probe "$PORT")"; RC=$?
if [ "$RC" -eq 0 ]; then
  echo "FAIL: probe lulus (exit 0) walau server hanya mengembalikan placeholder"
  echo "$OUT"
  fail=1
else
  if printf '%s' "$OUT" | grep -q "placeholder"; then
    echo "PASS: placeholder ditolak (exit $RC)"
  else
    echo "FAIL: probe gagal tapi tanpa menyebut placeholder"
    echo "$OUT"
    fail=1
  fi
fi
kill "$SERVER_PID" 2>/dev/null; SERVER_PID=""

# ── Case 2: a real document. The probe must accept it. ──
rm -f "$TMP_DIR/port"; PORTFILE="$TMP_DIR/port" start_server real
OUT="$(run_probe "$PORT")"; RC=$?
if [ "$RC" -ne 0 ]; then
  echo "FAIL: probe menolak dokumen sungguhan (exit $RC)"
  echo "$OUT"
  fail=1
else
  if printf '%s' "$OUT" | grep -q "^PASS"; then
    echo "PASS: dokumen sungguhan diterima"
  else
    echo "FAIL: probe exit 0 tapi tanpa laporan PASS"
    echo "$OUT"
    fail=1
  fi
fi
kill "$SERVER_PID" 2>/dev/null; SERVER_PID=""

# ── Case 3: credentials are required, not defaulted. ──
OUT="$(BASE_URL="http://127.0.0.1:1" bash "$PROBE" 2>&1)"; RC=$?
if [ "$RC" -eq 0 ]; then
  echo "FAIL: probe jalan tanpa PROBE_EMAIL/PROBE_PASSWORD"
  fail=1
else
  echo "PASS: kredensial wajib explicit (exit $RC)"
fi

exit "$fail"
