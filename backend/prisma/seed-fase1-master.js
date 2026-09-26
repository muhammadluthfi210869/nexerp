const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Derived from this file, not pinned to one machine's absolute path.
const rootDir = path.resolve(__dirname, '..', '..');
const { parse } = require(path.join(rootDir, 'backend/node_modules/csv-parse/dist/cjs/sync.cjs'));
const bcrypt = require(path.join(rootDir, 'backend/node_modules/bcrypt'));


const envText = fs.readFileSync(path.join(rootDir, 'backend/.env'), 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

// The parsed .env was never published to process.env, so SEED_DEFAULT_PASSWORD= in .env was
// silently ignored and each run hashed a fresh random password nobody could ever learn.
if (env.SEED_DEFAULT_PASSWORD && !process.env.SEED_DEFAULT_PASSWORD) {
  process.env.SEED_DEFAULT_PASSWORD = env.SEED_DEFAULT_PASSWORD;
}

const { Pool } = require(path.join(rootDir, 'backend/node_modules/pg'));
const { PrismaPg } = require(path.join(rootDir, 'backend/node_modules/@prisma/adapter-pg'));
const { PrismaClient } = require(path.join(rootDir, 'backend/node_modules/@prisma/client'));

// The real directory: docs/legacy-erp/data/master/MASTER_DATA. The old value omitted
// `data/master`, so every readCsv warned "CSV not found" and returned [] — and the run still
// finished with "ALL FASE 1 MASTER DATA SEEDING COMPLETE" and 0 rows written.
const CSV_DIR = path.join(rootDir, 'docs', 'legacy-erp', 'data', 'master', 'MASTER_DATA');

function readCsv(filename) {
  const filePath = path.join(CSV_DIR, filename);
  if (!fs.existsSync(filePath)) {
    // Fail closed: a missing source file must not look like a successful empty seed.
    throw new Error(`CSV tidak ditemukan: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  // Strip a leading BOM by code point. A literal BOM in a regex matches, but it is invisible
  // in the source and the next person to touch this line cannot see what it does.
  const content = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

async function main() {
  console.log('🚀 Starting FASE 1 MASTER DATA SEEDER...');
  // Never the connection string itself: this output lands in shell history and CI logs.
  const dbTarget = (env.DATABASE_URL || '').replace(/^(.*@)?([^@/]+)\/([^?]*).*$/, '$2/$3');
  console.log('Target DB:', dbTarget || '(tidak diketahui)');

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();
  console.log('✅ Connected to PostgreSQL!');

  // 1. MASTER UNITS
  console.log('\n--- 1. Seeding Master Units ---');
  const units = [
    { code: 'PCS', name: 'Pieces', symbol: 'pcs' },
    { code: 'KG', name: 'Kilogram', symbol: 'kg' },
    { code: 'GR', name: 'Gram', symbol: 'gr' },
    { code: 'ML', name: 'Milliliter', symbol: 'ml' },
    { code: 'L', name: 'Liter', symbol: 'L' },
    { code: 'BOX', name: 'Box', symbol: 'box' },
    { code: 'PACK', name: 'Pack', symbol: 'pack' },
  ];
  for (const u of units) {
    await prisma.masterUnit.upsert({
      where: { code: u.code },
      update: { name: u.name, symbol: u.symbol, isActive: true },
      create: { ...u, isActive: true }
    });
  }
  console.log(`✅ ${units.length} Master Units ready.`);

  // 2. KATEGORI BARANG (7 rows)
  console.log('\n--- 2. Seeding Categories from KATEGORI-BARANG.csv ---');
  const catRows = readCsv('KATEGORI-BARANG.csv');
  const categoryMap = new Map();
  let catCount = 0;
  for (const r of catRows) {
    if (!r.kode) continue;
    const cat = await prisma.masterCategory.upsert({
      where: { code: r.kode },
      update: { name: r.kategori, description: r.deskripsi || null, isActive: true },
      create: {
        code: r.kode,
        name: r.kategori,
        description: r.deskripsi || null,
        type: 'GOODS',
        isActive: true
      }
    });
    categoryMap.set(r.kode, cat.id);
    categoryMap.set(r.kategori.toLowerCase(), cat.id);
    catCount++;
  }
  console.log(`✅ ${catCount} Categories seeded (dari ${catRows.length} baris).`);

  // 3. GUDANG (16 rows)
  console.log('\n--- 3. Seeding Warehouses from GUDANG.csv ---');
  const whRows = readCsv('GUDANG.csv');
  let whCount = 0;
  for (const r of whRows) {
    if (!r.gudang) continue;
    const existing = await prisma.warehouse.findFirst({ where: { name: r.gudang } });
    whCount++;
    if (!existing) {
      await prisma.warehouse.create({
        data: {
          name: r.gudang,
          phone: r.telepon || null,
          city: r.lokasi || null,
          province: 'Jawa Timur',
          status: 'ACTIVE'
        }
      });
    }
  }
  console.log(`✅ ${whCount} Warehouses seeded (dari ${whRows.length} baris).`);

  // 4. CHART OF ACCOUNTS (CoA)
  console.log('\n--- 4. Seeding Chart of Accounts (CoA) ---');
  const coaList = [
    { code: '1100', name: 'Kas & Bank (Aset Lancar)', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1101', name: 'Kas Kecil (Petty Cash) Pabrik', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1110', name: 'Bank BCA (Operasional)', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1111', name: 'Bank Mandiri (Penerimaan Klien)', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1200', name: 'Piutang Usaha / Klien Maklon', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1300', name: 'Persediaan Bahan Baku', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1301', name: 'Persediaan Bahan Kemas', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1302', name: 'Persediaan Barang Dalam Proses (WIP)', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1303', name: 'Persediaan Barang Jadi (FG)', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1400', name: 'PPN Masukan (Input Tax)', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1401', name: 'Uang Muka Pembelian (Advance)', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
    { code: '1500', name: 'Mesin & Peralatan Pabrik', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'FIXED_ASSET' },
    { code: '1501', name: 'Akumulasi Penyusutan Mesin', type: 'ASSET', normalBalance: 'CREDIT', reportGroup: 'FIXED_ASSET' },
    { code: '2100', name: 'Hutang Usaha / Supplier', type: 'LIABILITY', normalBalance: 'CREDIT', reportGroup: 'CURRENT_LIABILITY' },
    { code: '2101', name: 'Hutang Pembelian Belum Difakturkan', type: 'LIABILITY', normalBalance: 'CREDIT', reportGroup: 'CURRENT_LIABILITY' },
    { code: '2200', name: 'PPN Keluaran (Output Tax)', type: 'LIABILITY', normalBalance: 'CREDIT', reportGroup: 'CURRENT_LIABILITY' },
    { code: '2201', name: 'Hutang PPh 21 / PPh 23', type: 'LIABILITY', normalBalance: 'CREDIT', reportGroup: 'CURRENT_LIABILITY' },
    { code: '2300', name: 'DP Penjualan Klien (Uang Muka)', type: 'LIABILITY', normalBalance: 'CREDIT', reportGroup: 'CURRENT_LIABILITY' },
    { code: '3100', name: 'Modal Disetor', type: 'EQUITY', normalBalance: 'CREDIT', reportGroup: 'EQUITY' },
    { code: '3200', name: 'Laba Ditahan', type: 'EQUITY', normalBalance: 'CREDIT', reportGroup: 'EQUITY' },
    { code: '4100', name: 'Pendapatan Penjualan Maklon', type: 'REVENUE', normalBalance: 'CREDIT', reportGroup: 'OPERATING_REVENUE' },
    { code: '4101', name: 'Pendapatan Jasa Pembuatan Sample', type: 'REVENUE', normalBalance: 'CREDIT', reportGroup: 'OPERATING_REVENUE' },
    { code: '5100', name: 'Beban Pokok Penjualan (HPP)', type: 'EXPENSE', normalBalance: 'DEBIT', reportGroup: 'COGS' },
    { code: '6100', name: 'Beban Operasional & Kantor', type: 'EXPENSE', normalBalance: 'DEBIT', reportGroup: 'OPEX' }
  ];

  const glAccountMap = new Map();
  for (const c of coaList) {
    const acc = await prisma.account.upsert({
      where: { code: c.code },
      update: { name: c.name, type: c.type, normalBalance: c.normalBalance, reportGroup: c.reportGroup },
      create: { code: c.code, name: c.name, type: c.type, normalBalance: c.normalBalance, reportGroup: c.reportGroup }
    });
    glAccountMap.set(c.code, acc.id);
  }
  console.log(`✅ ${coaList.length} Accounts (CoA) seeded.`);

  // 5. TAX SETUP (Master Tax Rates)
  console.log('\n--- 5. Seeding Tax Rates (/tax-setup) ---');
  const taxes = [
    { name: 'PPN 11%', rate: 11.00, description: 'Pajak Pertambahan Nilai Standar' },
    { name: 'PPh 23 Jasa 2%', rate: 2.00, description: 'Pajak Penghasilan Pasal 23 Jasa Maklon' },
    { name: 'PPh 21', rate: 5.00, description: 'Pajak Penghasilan Tenaga Ahli / Karyawan' },
    { name: 'PPh 4(2) Final 0.5%', rate: 0.50, description: 'Pajak Final UMKM' },
    { name: 'Non-PPN (0%)', rate: 0.00, description: 'Bebas Pajak' },
  ];
  for (const t of taxes) {
    await prisma.taxRate.upsert({
      where: { name: t.name },
      update: { rate: t.rate, description: t.description, isActive: true },
      create: { name: t.name, rate: t.rate, description: t.description, isActive: true }
    });
  }
  console.log(`✅ ${taxes.length} Tax Rates ready.`);

  // 6. BANK ACCOUNTS (/bank-account-manage)
  console.log('\n--- 6. Seeding Bank Accounts (/bank-account-manage) ---');
  const banks = [
    {
      accountCode: 'BANK-BCA-01',
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '8290192831',
      accountType: 'BANK',
      currencyCode: 'IDR',
      glAccountId: glAccountMap.get('1110'),
      notes: 'Rekening Operasional Pabrik & SCM'
    },
    {
      accountCode: 'BANK-MANDIRI-01',
      bankName: 'Bank Mandiri',
      accountNumber: '1420019283712',
      accountType: 'BANK',
      currencyCode: 'IDR',
      glAccountId: glAccountMap.get('1111'),
      notes: 'Rekening Penerimaan DP & Pelunasan Klien'
    },
    {
      accountCode: 'CASH-PABRIK-01',
      bankName: 'Kas Kecil Pabrik',
      accountNumber: 'PETTY-01',
      accountType: 'PETTY_CASH',
      currencyCode: 'IDR',
      glAccountId: glAccountMap.get('1101'),
      notes: 'Kas Kecil Operasional Harian Workshop'
    }
  ];
  for (const b of banks) {
    await prisma.bankAccount.upsert({
      where: { accountCode: b.accountCode },
      update: { bankName: b.bankName, accountNumber: b.accountNumber, accountType: b.accountType, glAccountId: b.glAccountId, notes: b.notes },
      create: { ...b, isActive: true }
    });
  }
  console.log(`✅ ${banks.length} Bank Accounts ready.`);

  // 7. USERS & ROLES (45 rows from USERS.csv)
  console.log('\n--- 7. Seeding Users from USERS.csv ---');
  const userRows = readCsv('USERS.csv');
  const roleMap = {
    administrator: 'SUPER_ADMIN',
    admin: 'SUPER_ADMIN',
    finance: 'FINANCE',
    rnd: 'RND',
    warehouse: 'WAREHOUSE',
    ppic: 'PPIC',
    purchasing: 'PURCHASING',
    production: 'PRODUCTION_OP',
    qc: 'QC_LAB',
    legal: 'COMPLIANCE',
    legalitas: 'COMPLIANCE',
    marketing: 'DIGIMAR',
    busdev: 'COMMERCIAL'
  };

  const seedPassword = process.env.SEED_DEFAULT_PASSWORD || require('crypto').randomBytes(16).toString('hex');
  const defaultPasswordHash = await bcrypt.hash(seedPassword, 10);
  let userCount = 0;
  for (const r of userRows) {
    if (!r.email || !r.nama) continue;
    const roleKey = (r.hak_akses || '').toLowerCase().trim();
    const roleEnum = roleMap[roleKey] || 'SUPER_ADMIN';

    await prisma.user.upsert({
      where: { email: r.email },
      update: {
        fullName: r.nama,
        status: 'ACTIVE',
        roles: [roleEnum]
      },
      create: {
        fullName: r.nama,
        email: r.email,
        passwordHash: defaultPasswordHash,
        status: 'ACTIVE',
        roles: [roleEnum]
      }
    });
    userCount++;
  }
  console.log(`✅ ${userCount} Users seeded with encrypted credentials.`);

  // 8. SUPPLIERS (176 rows from SUPPLIER.csv)
  console.log('\n--- 8. Seeding Suppliers from SUPPLIER.csv ---');
  const suppRows = readCsv('SUPPLIER.csv');
  let suppCount = 0;
  for (const r of suppRows) {
    if (!r.supplier) continue;
    const catId = categoryMap.get(r.kategori?.toLowerCase()) || null;
    const existing = await prisma.supplier.findFirst({ where: { name: r.supplier } });
    const data = {
      name: r.supplier,
      contact: r.pic || null,
      phone: r.phone || null,
      city: r.kota || null,
      categoryId: catId,
      termOfPayment: 30
    };
    if (existing) {
      await prisma.supplier.update({ where: { id: existing.id }, data });
    } else {
      await prisma.supplier.create({ data });
    }
    suppCount++;
  }
  console.log(`✅ ${suppCount} Suppliers seeded.`);

  // 9. CUSTOMERS (816 rows from PELANGGAN.csv)
  console.log('\n--- 9. Seeding Customers from PELANGGAN.csv ---');
  const custRows = readCsv('PELANGGAN.csv');
  let custCount = 0;
  for (let i = 0; i < custRows.length; i++) {
    const r = custRows[i];
    if (!r.nama) continue;
    // Derived from the row itself, not from its position. The old `CUST-${i+1}` was stable only
    // as long as the CSV never changed: inserting one PELANGGAN row re-pointed every later code
    // at a different person, and the update branch then overwrote that person's record.
    const custCode = `CUST-${crypto
      .createHash('sha1')
      .update(`${r.nama}|${r.phone || ''}`)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase()}`;
    const existing = await prisma.customer.findUnique({ where: { code: custCode } });
    const data = {
      code: custCode,
      name: r.nama,
      phone: r.phone || null,
      address: r.kota || null,
      notes: `Kategori: ${r.kategori || '-'} | Penginput: ${r.penginput || '-'}`,
      isActive: true,
      creditLimit: 0,
      paymentTerms: 30
    };
    if (existing) {
      await prisma.customer.update({ where: { id: existing.id }, data });
    } else {
      await prisma.customer.create({ data });
    }
    custCount++;
  }
  console.log(`✅ ${custCount} Customers seeded.`);

  // 9b. SALES LEADS — the same PELANGGAN rows, into the table the lead-facing screens read.
  // `customer` (finance) and `salesLead` (bussdev) are two entities, not one table read twice:
  // SampleRequest.leadId, WorkOrder.leadId and NewProductForm.leadId all point at sales_leads,
  // so CustomerSelect — which fills `leadId` in samples/npf — must hand back a SalesLead id.
  // Seeding only `customer` left Master → Customers and that dropdown empty (0 rows) while
  // finance reported 806, which reads exactly like "the seed did nothing".
  console.log('\n--- 9b. Seeding Sales Leads from PELANGGAN.csv ---');
  const staff = await prisma.bussdevStaff.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  if (staff.length === 0) {
    // Fail closed: `picId` is required and points at BussdevStaff. With no staff there is no
    // honest id, and inventing one produces leads nobody owns.
    throw new Error('BussdevStaff kosong — seed bussdev dulu (picId wajib di SalesLead).');
  }
  const defaultPicId = staff[0].id;
  const picByName = new Map(staff.map((s) => [s.name.toLowerCase(), s.id]));
  // Returns null when nothing matches, so the caller can count it. The legacy CSV carries 16
  // PIC names and bussdev_staff holds a handful, so most rows cannot be matched — and silently
  // parking every one of them on the default PIC is the same defect class as a swallowed error.
  const resolvePicId = (penginput) => {
    if (!penginput) return null;
    const name = String(penginput).trim().toLowerCase();
    if (picByName.has(name)) return picByName.get(name);
    // The CSV writes "Diaz Muhammad Irsyadi" for staff "Diaz"; match on the first token.
    const first = name.split(/\s+/)[0];
    for (const s of staff) if (s.name.toLowerCase().startsWith(first)) return s.id;
    return null;
  };

  const unmatchedPics = new Map();
  // "400,299,500.00" — commas are thousands separators here, so Number() gives NaN and every
  // legacy order value would quietly become 0.
  const parseRupiah = (v) => {
    const n = Number(String(v || '').replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  let leadCount = 0;
  for (const r of custRows) {
    if (!r.nama) continue;
    // Same stable code as the `customer` row above, so the AR record and the lead record for
    // one PELANGGAN line can be lined up by code instead of by name.
    const leadCode = `CUST-${crypto
      .createHash('sha1')
      .update(`${r.nama}|${r.phone || ''}`)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase()}`;
    const soSample = Number(r.so_sample) || 0;
    const soProduk = Number(r.so_produk) || 0;
    const matchedPicId = resolvePicId(r.penginput);
    if (!matchedPicId) {
      const label = r.penginput || '(kosong)';
      unmatchedPics.set(label, (unmatchedPics.get(label) || 0) + 1);
    }
    const leadData = {
      clientName: r.nama,
      contactInfo: r.phone || '-',
      city: r.kota || null,
      source: 'LEGACY_KIL_IMPORT',
      // No CSV column carries this. Empty rather than an invented category.
      productInterest: '',
      // WON_DEAL, not the NEW_LEAD column default: these are parties the legacy system already
      // sold to. NEW_LEAD would drop 806 existing customers into the new-lead pipeline and
      // misreport every funnel count built on it.
      status: 'WON_DEAL',
      picId: matchedPicId || defaultPicId,
      estimatedValue: parseRupiah(r.nominal_so_produk),
      orderCount: soSample + soProduk,
      // Master → Customers parses exactly this shape (page.tsx:159-160). It also holds the one
      // place the real legacy PIC name survives, which is why the fallback above is not a loss.
      notes: `Kategori: ${r.kategori || '-'} | Penginput: ${r.penginput || '-'}`,
    };
    await prisma.salesLead.upsert({
      where: { brandCode: leadCode },
      update: leadData,
      create: { brandCode: leadCode, ...leadData },
    });
    leadCount++;
  }
  console.log(`✅ ${leadCount} Sales Leads seeded.`);
  if (unmatchedPics.size > 0) {
    // Loud on purpose: an unmatched PIC is not an error, but 816 rows silently parked on one
    // person is indistinguishable from a working mapping unless the run says so.
    const rows = [...unmatchedPics.values()].reduce((a, b) => a + b, 0);
    console.log(
      `⚠️  ${rows} lead tanpa PIC yang cocok di bussdev_staff — dipetakan ke "${staff[0].name}".`,
    );
    console.log('   Nama PIC asli tetap tersimpan di notes (kolom Penginput di Master → Customers).');
    for (const [name, n] of [...unmatchedPics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`     - ${name}: ${n} baris`);
    }
  }

  // 10. MATERIAL ITEMS (2,795 rows from BARANG.csv)
  console.log('\n--- 10. Seeding 2,795 Material Items from BARANG.csv ---');
  const itemRows = readCsv('BARANG.csv');
  let itemCount = 0;
  let itemSkipped = 0;
  let itemErrors = 0;

  // Process in chunks of 100 for maximum performance
  const chunkSize = 100;
  for (let i = 0; i < itemRows.length; i += chunkSize) {
    const chunk = itemRows.slice(i, i + chunkSize);
    for (const r of chunk) {
      if (!r.kode || !r.barang) {
        itemSkipped++;
        continue;
      }
      const catId = categoryMap.get(r.kode.substring(0, 3)) || categoryMap.get(r.kategori?.toLowerCase()) || null;
      const price = parseFloat((r.harga_beli || '0').replace(/,/g, '')) || 0;
      const isPkg = (r.kategori || '').includes('Kemas') || (r.sub_kategori || '').includes('Kemasan');
      const matType = isPkg ? 'PACKAGING' : 'RAW_MATERIAL';

      try {
        await prisma.materialItem.upsert({
          where: { code: r.kode },
          update: {
            name: r.barang,
            unitPrice: price,
            unit: r.satuan || 'gr',
            imageUrl: r.barang2?.startsWith('http') ? r.barang2 : null,
            categoryId: catId,
            bahanType: r.sub_kategori || null,
            status: 'ACTIVE'
          },
          create: {
            code: r.kode,
            name: r.barang,
            type: matType,
            unit: r.satuan || 'gr',
            unitPrice: price,
            minLevel: 0,
            maxLevel: 100000,
            reorderPoint: 0,
            imageUrl: r.barang2?.startsWith('http') ? r.barang2 : null,
            categoryId: catId,
            bahanType: r.sub_kategori || null,
            status: 'ACTIVE'
          }
        });
        itemCount++;
      } catch (err) {
        // Counted and reported, not swallowed: a silent catch here is what let a partially
        // seeded catalog look like a complete one.
        itemErrors++;
        if (itemErrors <= 5) {
          console.error(`  ✗ ${r.kode}: ${String(err.message).split('\n')[0]}`);
        }
      }
    }
    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= itemRows.length) {
      console.log(`  Processed ${Math.min(i + chunkSize, itemRows.length)} / ${itemRows.length} items...`);
    }
  }
  console.log(`✅ ${itemCount} Material Items seeded successfully!`);
  if (itemSkipped > 0) {
    console.warn(`⚠️  ${itemSkipped} baris BARANG dilewati (kode/barang kosong).`);
  }
  if (itemErrors > 0) {
    throw new Error(
      `${itemErrors} baris BARANG gagal di-seed (${itemCount}/${itemRows.length} berhasil) — lihat log di atas.`,
    );
  }
  if (itemCount !== itemRows.length - itemSkipped) {
    throw new Error(
      `Jumlah tidak cocok: ${itemRows.length} baris CSV, ${itemCount} tersimpan, ${itemSkipped} dilewati.`,
    );
  }

  // Printed before the completion banner, and a hard stop if any entity came out empty:
  // "ALL ... COMPLETE" used to print over a run that had written nothing at all.
  const summary = [
    ['master_categories', catCount, catRows.length],
    ['warehouses', whCount, whRows.length],
    ['users', userCount, userRows.length],
    ['suppliers', suppCount, suppRows.length],
    ['customers', custCount, custRows.length],
    ['sales_leads', leadCount, custRows.length],
    ['material_items', itemCount, itemRows.length],
  ];
  console.log('\n--- Ringkasan seed (tersimpan / baris CSV) ---');
  for (const [name, got, total] of summary) {
    console.log(`  ${name.padEnd(20)} ${got} / ${total}`);
  }
  const emptyEntities = summary.filter(([, got]) => got === 0).map(([name]) => name);
  if (emptyEntities.length > 0) {
    throw new Error(`Seed tidak menulis apa pun untuk: ${emptyEntities.join(', ')}`);
  }

  console.log('\n🎉 ALL FASE 1 MASTER DATA SEEDING COMPLETE!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error('❌ Seeder Failed:', err);
  process.exit(1);
});
