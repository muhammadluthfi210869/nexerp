#!/bin/bash
# Guards the master-data seeder against the failure it already had: it pointed at a CSV
# directory that does not exist, warned "CSV not found" once per file, wrote nothing, and
# still finished with "ALL FASE 1 MASTER DATA SEEDING COMPLETE". The QA doc then recorded
# master_categories 0, customers 0 and called the seed a missing *execution* — the script
# could not have seeded anything. A gate that reports success without reading its input is
# worth less than no gate, so these are static checks on the shapes that made it lie.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SEEDER="$ROOT/backend/prisma/seed-fase1-master.js"
CSV_DIR="$ROOT/docs/legacy-erp/data/master/MASTER_DATA"

fail=0
check() { # check <label> <command...>
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "  ✅ $label"
  else
    echo "  ❌ $label"
    fail=1
  fi
}

[ -f "$SEEDER" ] || { echo "  ❌ seeder tidak ada: $SEEDER"; exit 1; }

echo "Master seed guard"

# 1. The CSV directory the seeder names must be the one that exists, and must be found from
#    the script's own location rather than the caller's cwd.
check "CSV_DIR menunjuk data/master/MASTER_DATA" \
  grep -q "path.join(rootDir, 'docs', 'legacy-erp', 'data', 'master', 'MASTER_DATA')" "$SEEDER"
check "rootDir diturunkan dari __dirname (bukan path absolut satu mesin)" \
  grep -q "path.resolve(__dirname" "$SEEDER"
check "tidak ada path absolut c:/GAWE" bash -c "! grep -q \"'c:/GAWE\" '$SEEDER'"

# 2. Every CSV the run depends on is actually there. A missing one must be a hard failure.
for f in KATEGORI-BARANG BARANG SUPPLIER PELANGGAN USERS GUDANG; do
  check "sumber ada: $f.csv" test -f "$CSV_DIR/$f.csv"
done
check "readCsv melempar saat file hilang (fail closed)" \
  grep -q "throw new Error(\`CSV tidak ditemukan" "$SEEDER"
# Matches the call, not the phrase: the seeder's comment quotes the old warning on purpose.
check "readCsv tidak lagi mengembalikan array kosong saat file hilang" \
  bash -c "! grep -q \"console.warn('CSV not found'\" '$SEEDER'"

# 3. No silent per-row swallow, and no "COMPLETE" over an empty run.
check "error baris BARANG dihitung, bukan ditelan" \
  bash -c "grep -q 'itemErrors++' '$SEEDER' && ! grep -q 'Skip occasional malformed line' '$SEEDER'"
check "jumlah tersimpan vs baris CSV dicocokkan" \
  grep -q "Jumlah tidak cocok" "$SEEDER"
check "seed berhenti kalau ada entitas yang nol baris" \
  grep -q "Seed tidak menulis apa pun untuk" "$SEEDER"

# 4. The connection string must never be echoed (it carries the DB password).
check "DATABASE_URL tidak dicetak utuh" \
  bash -c "! grep -q \"console.log('Target DB:', env.DATABASE_URL)\" '$SEEDER'"

# 5. The password the operator sets must actually reach the seeded users.
check "SEED_DEFAULT_PASSWORD dari .env diteruskan ke process.env" \
  grep -q "process.env.SEED_DEFAULT_PASSWORD = env.SEED_DEFAULT_PASSWORD" "$SEEDER"

# 6. Customer codes must derive from the row, not from its index in the CSV.
check "kode customer tidak lagi dari nomor urut" \
  bash -c "! grep -q 'padStart(4' '$SEEDER'"

# 7. Runnable and discoverable.
check "npm run seed:master terdaftar" \
  grep -q '"seed:master": "node prisma/seed-fase1-master.js"' "$ROOT/backend/package.json"

# 8. The second, broken seeder is gone rather than left as a trap.
check "seed-master-data.ts (duplikat rusak) sudah dihapus" \
  test ! -f "$ROOT/backend/prisma/seed-master-data.ts"

# 9. PELANGGAN must reach `salesLead`, not only `customer`. Master → Customers and
#    CustomerSelect read sales_leads — SampleRequest.leadId points at it, so the select must
#    hand back a SalesLead id. Seeding only `customer` left every lead-facing screen empty
#    while finance showed 806 rows, which reads as "the seed did nothing".
check "PELANGGAN juga disemai ke salesLead" \
  grep -q "prisma.salesLead.upsert" "$SEEDER"
check "salesLead di-upsert pada brandCode (kunci stabil, bukan id acak)" \
  grep -q "where: { brandCode: leadCode }" "$SEEDER"
# NEW_LEAD is the column default. Writing it here would drop 806 customers the legacy system
# already sold to into the new-lead pipeline and misreport every funnel count.
check "lead legacy berstatus WON_DEAL, bukan NEW_LEAD" \
  bash -c "grep -q \"status: 'WON_DEAL'\" '$SEEDER' && ! grep -q \"status: 'NEW_LEAD'\" '$SEEDER'"
# picId is required and points at BussdevStaff. With none seeded there is no honest id to
# write, so the run must stop rather than pick a random uuid.
check "berhenti kalau BussdevStaff kosong (picId wajib)" \
  grep -q "BussdevStaff kosong" "$SEEDER"
check "sales_leads masuk ringkasan seed" \
  grep -q "\['sales_leads', leadCount" "$SEEDER"
# "400,299,500.00" uses commas as thousands separators; Number() on it is NaN, i.e. every
# legacy order value would silently become 0. Checked through the lead helper by name — a bare
# "replace(/,/g" also appears in the BARANG price line above, which passed this check while the
# lead block did not exist yet.
check "nilai rupiah legacy diparse lewat helper, bukan Number() mentah" \
  bash -c "grep -q 'const parseRupiah' '$SEEDER' && grep -q 'estimatedValue: parseRupiah(' '$SEEDER'"
# 16 legacy PIC names against a handful of bussdev_staff rows means most rows cannot match.
# Parking them all on the default PIC without saying so looks identical to a working mapping.
check "PIC yang tak cocok dilaporkan, tidak dipetakan diam-diam" \
  grep -q "lead tanpa PIC yang cocok di bussdev_staff" "$SEEDER"

exit "$fail"
