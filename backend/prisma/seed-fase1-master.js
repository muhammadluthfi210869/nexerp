const fs = require('fs');
const path = require('path');

const rootDir = 'c:/GAWE/Web Dev/Porto Aureon/ERP FROM ZERO';
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

const { Pool } = require(path.join(rootDir, 'backend/node_modules/pg'));
const { PrismaPg } = require(path.join(rootDir, 'backend/node_modules/@prisma/adapter-pg'));
const { PrismaClient } = require(path.join(rootDir, 'backend/node_modules/@prisma/client'));

const CSV_DIR = path.join(rootDir, 'docs', 'legacy-erp', 'MASTER_DATA');

function readCsv(filename) {
  const filePath = path.join(CSV_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn('CSV not found:', filePath);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

async function main() {
  console.log('🚀 Starting FASE 1 MASTER DATA SEEDER...');
  console.log('Target DB:', env.DATABASE_URL);

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
  }
  console.log(`✅ ${catRows.length} Categories seeded.`);

  // 3. GUDANG (16 rows)
  console.log('\n--- 3. Seeding Warehouses from GUDANG.csv ---');
  const whRows = readCsv('GUDANG.csv');
  for (const r of whRows) {
    if (!r.gudang) continue;
    const existing = await prisma.warehouse.findFirst({ where: { name: r.gudang } });
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
  console.log(`✅ ${whRows.length} Warehouses seeded.`);

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

  const defaultPasswordHash = await bcrypt.hash('160487', 10);
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
    const custCode = `CUST-${String(i + 1).padStart(4, '0')}`;
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

  // 10. MATERIAL ITEMS (2,795 rows from BARANG.csv)
  console.log('\n--- 10. Seeding 2,795 Material Items from BARANG.csv ---');
  const itemRows = readCsv('BARANG.csv');
  let itemCount = 0;

  // Process in chunks of 100 for maximum performance
  const chunkSize = 100;
  for (let i = 0; i < itemRows.length; i += chunkSize) {
    const chunk = itemRows.slice(i, i + chunkSize);
    for (const r of chunk) {
      if (!r.kode || !r.barang) continue;
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
        // Skip occasional malformed line
      }
    }
    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= itemRows.length) {
      console.log(`  Processed ${Math.min(i + chunkSize, itemRows.length)} / ${itemRows.length} items...`);
    }
  }
  console.log(`✅ ${itemCount} Material Items seeded successfully!`);

  console.log('\n🎉 ALL FASE 1 MASTER DATA SEEDING COMPLETE!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error('❌ Seeder Failed:', err);
  process.exit(1);
});
