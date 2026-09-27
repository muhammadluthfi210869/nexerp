#!/bin/bash
# A screen that reads a field the endpoint never sends renders `NaN` — silently,
# with no error, and `NaN.toLocaleString()` prints "NaN" in a money column.
#
# `/finance/bills` and `/finance/invoices` are both answered by
# `FinanceService.getInvoices`, which spreads the Prisma `Invoice` row and adds an
# alias layer for the screens (`billNumber`, `vendorName`, `customerName`). The
# `Invoice` model carries `amountDue`/`outstandingAmount`; the vendor-bill screens
# were written against `totalAmount`/`paidAmount`/`remaining` instead. On
# 2026-09-26 the alias layer was missing all three, so `finance/bills` printed
# NaN in its amount column and `finance/bayar` printed NaN in three of them.
#
# This test pins the contract from both ends: the mapper must emit each alias, and
# each screen named below must still read it. When a screen stops reading an
# alias, the reader assertion fails and says the alias can be dropped — so the
# list cannot rot into a copy of the mapper.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Finance invoice alias contract (screens must not read fields the mapper omits)"

if [ ! -f "$ROOT/backend/src/modules/finance/finance.service.ts" ]; then
  echo "  ⚠️  finance.service.ts tidak ada — cek dilewati"
  exit 0
fi

node - "$ROOT" <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
const serviceFile = path.join(root, 'backend/src/modules/finance/finance.service.ts');
const service = fs.readFileSync(serviceFile, 'utf8');

// Alias emitted by getInvoices, and the screens that read it off the response.
const CONTRACT = [
  {
    alias: 'totalAmount',
    why: 'Invoice has amountDue, not totalAmount',
    readers: [
      'frontend/src/app/(dashboard)/finance/bills/page.tsx',
      'frontend/src/app/(dashboard)/finance/bayar/page.tsx',
    ],
  },
  {
    alias: 'paidAmount',
    why: 'Invoice has no paid figure at all; it is amountDue - outstandingAmount',
    readers: ['frontend/src/app/(dashboard)/finance/bayar/page.tsx'],
  },
  {
    alias: 'remaining',
    why: 'Invoice calls the outstanding balance outstandingAmount',
    readers: ['frontend/src/app/(dashboard)/finance/bayar/page.tsx'],
  },
];

// Isolate the getInvoices mapper so a key from another method cannot satisfy it.
const start = service.indexOf('async getInvoices(');
if (start === -1) {
  console.log('  ❌ getInvoices tidak ditemukan di finance.service.ts');
  process.exit(1);
}
const end = service.indexOf('\n  async ', start + 10);
const mapper = service.slice(start, end === -1 ? service.length : end);

const missing = [];
const rotted = [];

for (const { alias, why, readers } of CONTRACT) {
  const emitted = new RegExp(`\\b${alias}\\s*:`).test(mapper);
  if (!emitted) missing.push(`${alias} — ${why}`);

  for (const reader of readers) {
    const file = path.join(root, reader);
    if (!fs.existsSync(file)) {
      rotted.push(`${alias}: reader tidak ada — ${reader}`);
      continue;
    }
    if (!new RegExp(`\\b${alias}\\b`).test(fs.readFileSync(file, 'utf8'))) {
      rotted.push(`${alias}: sudah tidak dibaca oleh ${reader} — alias bisa dihapus`);
    }
  }
}

if (missing.length === 0 && rotted.length === 0) {
  console.log(`  ✅ ${CONTRACT.length} alias cocok antara getInvoices dan layar pembacanya`);
  process.exit(0);
}

if (missing.length) {
  console.log(`  ❌ getInvoices tidak mengirim ${missing.length} field yang dibaca layar:`);
  for (const m of missing) console.log(`     ${m}`);
  console.log('     Layar akan menampilkan NaN di kolom rupiah, tanpa error apa pun.');
}
if (rotted.length) {
  console.log(`  ⚠️  kontrak di sisi layar sudah berubah (${rotted.length}):`);
  for (const r of rotted) console.log(`     ${r}`);
}
process.exit(1);
NODE
