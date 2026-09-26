#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  P21 Disaster Recovery & Rollback Rehearsal (AC-P21-02/03)
#
#  What this rehearses, for real, on whatever PostgreSQL target
#  DATABASE_URL points at:
#    1. Take a snapshot exactly like scripts/db-snapshot.sh does.
#    2. Restore that snapshot into a THROWAWAY database
#       (erp_dr_rehearsal_<ts>) — the source database is only read.
#    3. Compare row counts for every table in `public` between
#       source and restored copy: any mismatch is data loss (RPO > 0).
#    4. Time the restore window and refuse anything over the 15 min RTO.
#    5. Drop the throwaway database.
#    6. Statically verify the image-tag rollback contract of
#       scripts/rollback.sh (live tag switching needs the VPS + GHCR).
#
#  Fail-closed rules (learned from the 12 residue gates that reported
#  a clean server they never read — see memory residue-gates-silent-swallow):
#    * `set -euo pipefail` everywhere, ON_ERROR_STOP=1 on every psql call.
#    * No `|| true` on any step that proves something.
#    * A missing toolchain, an unreachable server, a failed dump, a failed
#      restore or a single diverging table count all exit non-zero.
#
#  Usage:
#    bash scripts/test-rollback-rehearsal.sh
#
#  Environment:
#    DATABASE_URL  source PostgreSQL URL (default: read from backend/.env)
#    PGBIN         directory holding psql/pg_dump (default: autodetect)
#    RTO_LIMIT_S   recovery-time budget in seconds (default: 900)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RTO_LIMIT_S="${RTO_LIMIT_S:-900}"
TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
BACKUP_FILE="$BACKUP_DIR/dr-rehearsal-$TS.sql.gz"
SCRATCH_DB="erp_dr_rehearsal_$TS"
EVIDENCE_DIR="$ROOT_DIR/evidence/dr-rehearsal"
EVIDENCE_FILE="$EVIDENCE_DIR/rehearsal-$TS.txt"

PASS=0
FAIL=0
step() { printf '\n── %s\n' "$1"; }
ok()   { printf '   ✅ %s\n' "$1"; PASS=$((PASS + 1)); }
bad()  { printf '   ❌ %s\n' "$1"; FAIL=$((FAIL + 1)); }

trace() { printf '%s\n' "$1" >> "$EVIDENCE_FILE"; }

printf '═══════════════════════════════════════════════════════════════\n'
printf '  🛟 P21 DISASTER RECOVERY & ROLLBACK REHEARSAL — %s\n' "$TS"
printf '═══════════════════════════════════════════════════════════════\n'

mkdir -p "$BACKUP_DIR" "$EVIDENCE_DIR"
trace "P21 DR rehearsal $TS"

# ── Toolchain detection: absent tools are a failure, never a skip ──
step "1. Locating PostgreSQL client toolchain"
find_pgbin() {
  local d
  if [ -n "${PGBIN:-}" ]; then
    if [ -x "$PGBIN/psql" ] || [ -x "$PGBIN/psql.exe" ]; then printf '%s\n' "$PGBIN"; return 0; fi
    return 1
  fi
  if command -v psql >/dev/null 2>&1; then dirname "$(command -v psql)"; return 0; fi
  for d in "/c/Program Files/PostgreSQL"/*/bin /usr/lib/postgresql/*/bin /usr/local/pgsql/bin; do
    if [ -x "$d/psql" ] || [ -x "$d/psql.exe" ]; then printf '%s\n' "$d"; return 0; fi
  done
  return 1
}

if ! PGBIN_RESOLVED="$(find_pgbin)"; then
  bad "psql/pg_dump not found (install postgresql-client or set PGBIN)"
  printf '\nVERDICT: FAILED — no PostgreSQL toolchain, rehearsal did not run\n'
  exit 1
fi
PSQL="$PGBIN_RESOLVED/psql"
PGDUMP="$PGBIN_RESOLVED/pg_dump"
ok "toolchain: $PGBIN_RESOLVED"
trace "toolchain: $PGBIN_RESOLVED"

# ── Source URL resolution (read from backend/.env, never printed) ──
step "2. Resolving source DATABASE_URL"
URLS="$(node -e '
const fs = require("fs");
const path = require("path");
const root = process.argv[1];
let raw = process.env.DATABASE_URL;
if (!raw) {
  const envPath = path.join(root, "backend", ".env");
  if (!fs.existsSync(envPath)) { console.error("MISSING_ENV_FILE: " + envPath); process.exit(1); }
  const m = fs.readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.+)$/m);
  if (!m) { console.error("MISSING_DATABASE_URL in backend/.env"); process.exit(1); }
  const Q1 = String.fromCharCode(39);
  const Q2 = String.fromCharCode(34);
  let v = m[1].trim();
  if (v.startsWith(Q1) || v.startsWith(Q2)) v = v.slice(1);
  if (v.endsWith(Q1) || v.endsWith(Q2)) v = v.slice(0, -1);
  raw = v;
}
let url;
try { url = new URL(raw); } catch (e) { console.error("INVALID_DATABASE_URL"); process.exit(1); }
const srcDb = url.pathname.replace(/^\//, "");
if (!srcDb) { console.error("DATABASE_URL has no database name"); process.exit(1); }
// libpq rejects Prisma-only query params such as ?schema=public, and it must
// never inherit them: connecting with a URI psql refuses would look like an
// unreachable server.
url.search = "";
const admin = new URL(url.toString()); admin.pathname = "/postgres";
process.stdout.write(url.toString() + "\n" + admin.toString());
' "$ROOT_DIR")"
SRC_URL="$(printf '%s' "$URLS" | sed -n '1p')"
ADMIN_URL="$(printf '%s' "$URLS" | sed -n '2p')"

SRC_DB="$(node -e 'process.stdout.write(new URL(process.argv[1]).pathname.replace(/^\//,""))' "$SRC_URL")"
ok "source database: $SRC_DB (credentials not printed)"
trace "source database: $SRC_DB"

if [ "$SRC_DB" = "$SCRATCH_DB" ]; then
  bad "scratch name collides with source database"
  exit 1
fi

scratch_url() {
  node -e '
const u = new URL(process.argv[1]);
u.pathname = "/" + process.argv[2];
process.stdout.write(u.toString());
' "$SRC_URL" "$1"
}
SCRATCH_URL="$(scratch_url "$SCRATCH_DB")"

cleanup_scratch() {
  "${PSQL:-psql}" -w --dbname="$ADMIN_URL" -v ON_ERROR_STOP=1 -q \
    -c "DROP DATABASE IF EXISTS \"$SCRATCH_DB\" WITH (FORCE);" >/dev/null 2>&1 || true
}
trap cleanup_scratch EXIT

# ── Reachability, before anything is written ──
step "3. Probing PostgreSQL reachability"
if ! "$PSQL" -w --dbname="$SRC_URL" -v ON_ERROR_STOP=1 -At -c 'SELECT 1' >/dev/null 2>&1; then
  bad "cannot reach source database — rehearsal did NOT run (not a pass)"
  printf '\nVERDICT: FAILED — server unreachable\n'
  exit 1
fi
ok "source database reachable"

# ── Snapshot ──
step "4. Taking snapshot (same shape as scripts/db-snapshot.sh)"
RTO_START=$(date +%s)
if "$PGDUMP" -w --dbname="$SRC_URL" --no-owner --no-privileges --format=plain 2>"$EVIDENCE_DIR/pgdump-$TS.err" | gzip > "$BACKUP_FILE"; then
  if [ ! -s "$BACKUP_FILE" ]; then
    bad "snapshot file is empty"
    exit 1
  fi
  ok "snapshot: $(basename "$BACKUP_FILE") ($(wc -c < "$BACKUP_FILE" | tr -d ' ') bytes)"
  trace "snapshot: $BACKUP_FILE"
else
  bad "pg_dump failed: $(head -3 "$EVIDENCE_DIR/pgdump-$TS.err" | tr '\n' ' ')"
  exit 1
fi

# ── Baseline row counts for every table in `public` ──
counts_sql() {
  local q
  q="$("$PSQL" -w --dbname="$1" -v ON_ERROR_STOP=1 -At -c "
    SELECT string_agg(
             format('SELECT %L AS t, count(*)::text AS c FROM %I.%I', tablename, schemaname, tablename),
             ' UNION ALL ')
    FROM pg_tables WHERE schemaname = 'public';")"
  if [ -z "$q" ]; then
    bad "could not enumerate public tables on $2"
    exit 1
  fi
  printf '%s\n' "$q"
}

step "5. Recording source row counts"
SRC_COUNTS_FILE="$EVIDENCE_DIR/src-counts-$TS.txt"
"$PSQL" -w --dbname="$SRC_URL" -v ON_ERROR_STOP=1 -At -c "$(counts_sql "$SRC_URL" "source")" \
  | LC_ALL=C sort > "$SRC_COUNTS_FILE"
SRC_TABLE_COUNT="$(wc -l < "$SRC_COUNTS_FILE" | tr -d ' ')"
SRC_ROW_TOTAL="$(awk -F'|' '{s += $2} END {print s + 0}' "$SRC_COUNTS_FILE")"
ok "baseline: $SRC_TABLE_COUNT tables, $SRC_ROW_TOTAL rows"
trace "baseline: $SRC_TABLE_COUNT tables, $SRC_ROW_TOTAL rows"

# ── Throwaway database ──
step "6. Creating throwaway database $SCRATCH_DB"
"$PSQL" -w --dbname="$ADMIN_URL" -v ON_ERROR_STOP=1 -q \
  -c "DROP DATABASE IF EXISTS \"$SCRATCH_DB\" WITH (FORCE);" \
  -c "CREATE DATABASE \"$SCRATCH_DB\";"
ok "throwaway database created (source untouched)"

# ── Restore (this window is the RTO) ──
step "7. Restoring snapshot into throwaway database"
RESTORE_START=$(date +%s)
if gunzip -c "$BACKUP_FILE" | "$PSQL" -w --dbname="$SCRATCH_URL" -v ON_ERROR_STOP=1 -q \
     >"$EVIDENCE_DIR/restore-$TS.log" 2>&1; then
  RESTORE_END=$(date +%s)
  RESTORE_S=$((RESTORE_END - RESTORE_START))
  ok "restore completed in ${RESTORE_S}s"
  trace "restore seconds: $RESTORE_S"
else
  bad "restore failed: $(grep -iE 'error|fatal' "$EVIDENCE_DIR/restore-$TS.log" | head -3 | tr '\n' ' ')"
  exit 1
fi

# ── RPO: every committed row must exist in the restored copy ──
step "8. Comparing row counts (RPO = 0 data loss)"
RESTORED_COUNTS_FILE="$EVIDENCE_DIR/restored-counts-$TS.txt"
"$PSQL" -w --dbname="$SCRATCH_URL" -v ON_ERROR_STOP=1 -At -c "$(counts_sql "$SCRATCH_URL" "restored")" \
  | LC_ALL=C sort > "$RESTORED_COUNTS_FILE"

if diff -u "$SRC_COUNTS_FILE" "$RESTORED_COUNTS_FILE" > "$EVIDENCE_DIR/counts-diff-$TS.txt"; then
  ok "all $SRC_TABLE_COUNT table counts identical after restore"
  trace "row-count comparison: identical"
else
  DIVERGED="$(grep -cE '^[+-][^+-]' "$EVIDENCE_DIR/counts-diff-$TS.txt" || true)"
  bad "$DIVERGED table count(s) diverged — see $EVIDENCE_DIR/counts-diff-$TS.txt"
  grep -E '^[+-][^+-]' "$EVIDENCE_DIR/counts-diff-$TS.txt" | head -10
  trace "row-count comparison: DIVERGED ($DIVERGED lines)"
  exit 1
fi

# ── RTO ──
step "9. Checking recovery time budget (RTO < ${RTO_LIMIT_S}s)"
RTO_END=$(date +%s)
RTO_S=$((RTO_END - RTO_START))
if [ "$RTO_S" -le "$RTO_LIMIT_S" ]; then
  ok "recovery window ${RTO_S}s <= ${RTO_LIMIT_S}s"
  trace "recovery window: ${RTO_S}s"
else
  bad "recovery window ${RTO_S}s exceeds budget ${RTO_LIMIT_S}s"
  trace "recovery window: ${RTO_S}s EXCEEDED"
  exit 1
fi

# ── Drop throwaway database ──
step "10. Dropping throwaway database"
cleanup_scratch
if "$PSQL" -w --dbname="$ADMIN_URL" -v ON_ERROR_STOP=1 -At \
     -c "SELECT count(*) FROM pg_database WHERE datname = '$SCRATCH_DB';" | grep -q '^0$'; then
  ok "throwaway database dropped"
else
  bad "throwaway database still present"
fi
trap - EXIT

# ── Rollback contract (live tag switching needs the VPS + GHCR) ──
step "11. Verifying rollback.sh contract"
ROLLBACK="$ROOT_DIR/scripts/rollback.sh"
ROLLBACK_OK=1
[ -f "$ROLLBACK" ] || { bad "scripts/rollback.sh missing"; ROLLBACK_OK=0; }
if [ "$ROLLBACK_OK" -eq 1 ]; then
  [ -x "$ROLLBACK" ] || { bad "scripts/rollback.sh not executable"; ROLLBACK_OK=0; }
  grep -q 'IMAGE_TAG' "$ROLLBACK" || { bad "rollback.sh does not switch IMAGE_TAG"; ROLLBACK_OK=0; }
  grep -q 'health' "$ROLLBACK" || { bad "rollback.sh has no health gate"; ROLLBACK_OK=0; }
  grep -qE 'TARGET|sha' "$ROLLBACK" || { bad "rollback.sh has no SHA target argument"; ROLLBACK_OK=0; }
  if grep -vE '^\s*#|^\s*$' "$ROLLBACK" | grep -qE '\bgit revert\b|\bgit reset\b'; then
    bad "rollback.sh uses git revert/reset — must be image-tag only"
    ROLLBACK_OK=0
  fi
fi
if [ "$ROLLBACK_OK" -eq 1 ]; then
  ok "rollback.sh: image-tag switch + health gate + SHA target, no git revert"
  trace "rollback contract: verified"
else
  trace "rollback contract: FAILED"
fi

printf '\n═══════════════════════════════════════════════════════════════\n'
printf '  RPO: %s tables compared, 0 divergent\n' "$SRC_TABLE_COUNT"
printf '  RTO: %ss (budget %ss)\n' "$RTO_S" "$RTO_LIMIT_S"
printf '  Snapshot: %s\n' "$BACKUP_FILE"
printf '  Evidence: %s\n' "$EVIDENCE_DIR"
printf '═══════════════════════════════════════════════════════════════\n'

if [ "$FAIL" -gt 0 ]; then
  printf '❌ [P21] ROLLBACK REHEARSAL FAILED (%s check(s) failed)\n' "$FAIL"
  exit 1
fi

printf '✅ [P21] ROLLBACK REHEARSAL PASSED (Exit Code: 0) — %s check(s) passed\n' "$PASS"
printf 'NOTE: this rehearses snapshot/restore on the database DATABASE_URL points at.\n'
printf '      The live VPS drill (scripts/dr-drill.sh) still has to run on the server.\n'
exit 0
