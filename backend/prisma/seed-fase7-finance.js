const fs = require('fs');
const path = require('path');

const rootDir = 'c:/GAWE/Web Dev/Porto Aureon/ERP FROM ZERO';
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

async function main() {
  console.log('🌱 Seeding Fase 7 Finance Core Data...');
  console.log('Target DB:', env.DATABASE_URL);

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Ensure Standard Chart of Accounts (CoA)
    const coaList = [
      { code: '11100', name: 'Kas Operasional Pabrik', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
      { code: '11200', name: 'Rekening Bank BCA Maklon', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
      { code: '11210', name: 'Rekening Bank Mandiri Payroll', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
      { code: '11300', name: 'Piutang Usaha Maklon', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
      { code: '11400', name: 'Persediaan Bahan Baku & Kemasan', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
      { code: '11500', name: 'Persediaan Produk Jadi (BJD)', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'CURRENT_ASSET' },
      { code: '12100', name: 'Aset Tetap - Mesin & Peralatan Pabrik', type: 'ASSET', normalBalance: 'DEBIT', reportGroup: 'FIXED_ASSET' },
      { code: '12200', name: 'Akumulasi Penyusutan Mesin', type: 'ASSET', normalBalance: 'CREDIT', reportGroup: 'FIXED_ASSET' },
      { code: '21100', name: 'Hutang Usaha Supplier', type: 'LIABILITY', normalBalance: 'CREDIT', reportGroup: 'CURRENT_LIABILITY' },
      { code: '21200', name: 'Beban Akrual & Gaji Karyawan', type: 'LIABILITY', normalBalance: 'CREDIT', reportGroup: 'CURRENT_LIABILITY' },
      { code: '31100', name: 'Modal Disetor Pemegang Saham', type: 'EQUITY', normalBalance: 'CREDIT', reportGroup: 'EQUITY' },
      { code: '32100', name: 'Laba Ditahan', type: 'EQUITY', normalBalance: 'CREDIT', reportGroup: 'EQUITY' },
      { code: '41100', name: 'Pendapatan Jasa Maklon Kosmetik', type: 'REVENUE', normalBalance: 'CREDIT', reportGroup: 'OPERATING_REVENUE' },
      { code: '41200', name: 'Pendapatan Penjualan Putus Skincare', type: 'REVENUE', normalBalance: 'CREDIT', reportGroup: 'OPERATING_REVENUE' },
      { code: '51100', name: 'Beban Pokok Penjualan - Bahan Baku', type: 'EXPENSE', normalBalance: 'DEBIT', reportGroup: 'COGS' },
      { code: '51200', name: 'Beban Pokok Penjualan - Kemasan & Packing', type: 'EXPENSE', normalBalance: 'DEBIT', reportGroup: 'COGS' },
      { code: '51300', name: 'Beban Upah Langsung Produksi', type: 'EXPENSE', normalBalance: 'DEBIT', reportGroup: 'COGS' },
      { code: '61100', name: 'Beban Operasional Kantor & Pabrik', type: 'EXPENSE', normalBalance: 'DEBIT', reportGroup: 'OPEX' },
      { code: '61200', name: 'Beban Penyusutan Aset Tetap', type: 'EXPENSE', normalBalance: 'DEBIT', reportGroup: 'OPEX' },
    ];

    const coaMap = {};
    for (const c of coaList) {
      const acc = await prisma.account.upsert({
        where: { code: c.code },
        update: {
          name: c.name,
          type: c.type,
          normalBalance: c.normalBalance,
          reportGroup: c.reportGroup,
          isActive: true
        },
        create: {
          code: c.code,
          name: c.name,
          type: c.type,
          normalBalance: c.normalBalance,
          reportGroup: c.reportGroup,
          isActive: true
        }
      });
      coaMap[c.code] = acc;
    }
    console.log(`✅ Seeded ${Object.keys(coaMap).length} Chart of Accounts`);

    // 2. Seed Bank Accounts
    const bankAccountsData = [
      {
        accountCode: 'BA-BCA-01',
        bankName: 'Bank Central Asia (BCA)',
        accountNumber: '8830-192-881',
        accountType: 'BANK',
        currencyCode: 'IDR',
        currentBalance: 450000000.00,
        glAccountId: coaMap['11200'].id,
        notes: 'Rekening Operasional Penerimaan Klien Maklon'
      },
      {
        accountCode: 'BA-MDR-01',
        bankName: 'Bank Mandiri',
        accountNumber: '132-00-88192-1',
        accountType: 'BANK',
        currencyCode: 'IDR',
        currentBalance: 185000000.00,
        glAccountId: coaMap['11210'].id,
        notes: 'Rekening Payroll & Pembayaran Vendor SCM'
      },
      {
        accountCode: 'BA-CSH-01',
        bankName: 'Kas Kecil Pabrik',
        accountNumber: 'KAS-KECIL-PABRIK',
        accountType: 'PETTY_CASH',
        currencyCode: 'IDR',
        currentBalance: 15000000.00,
        glAccountId: coaMap['11100'].id,
        notes: 'Petty cash harian pabrik untuk operasional'
      }
    ];

    const bankMap = {};
    for (const b of bankAccountsData) {
      const bank = await prisma.bankAccount.upsert({
        where: { accountCode: b.accountCode },
        update: {
          bankName: b.bankName,
          accountNumber: b.accountNumber,
          accountType: b.accountType,
          currentBalance: b.currentBalance,
          glAccountId: b.glAccountId,
          notes: b.notes,
          isActive: true
        },
        create: {
          accountCode: b.accountCode,
          bankName: b.bankName,
          accountNumber: b.accountNumber,
          accountType: b.accountType,
          currentBalance: b.currentBalance,
          glAccountId: b.glAccountId,
          notes: b.notes,
          isActive: true
        }
      });
      bankMap[b.accountCode] = bank;
    }
    console.log(`✅ Seeded ${Object.keys(bankMap).length} Bank Accounts`);

    // 3. Seed Bank Transactions (Kas Masuk & Kas Keluar)
    const bcaAccount = bankMap['BA-BCA-01'];
    const mdrAccount = bankMap['BA-MDR-01'];

    // Clear previous seeded test transactions if needed
    const bankTransactions = [
      {
        bankAccountId: bcaAccount.id,
        date: new Date('2026-09-18T09:30:00Z'),
        transactionType: 'DEPOSIT',
        amount: 45000000.00,
        sourceType: 'MANUAL',
        description: 'Penerimaan Pembayaran Maklon - Farah Derma Clinic',
        reconciled: true,
        reconciledAt: new Date('2026-09-18T17:00:00Z')
      },
      {
        bankAccountId: bcaAccount.id,
        date: new Date('2026-09-19T14:15:00Z'),
        transactionType: 'DEPOSIT',
        amount: 60000000.00,
        sourceType: 'MANUAL',
        description: 'Penerimaan Pelunasan Faktur - Glow Skin Official',
        reconciled: true,
        reconciledAt: new Date('2026-09-19T17:00:00Z')
      },
      {
        bankAccountId: mdrAccount.id,
        date: new Date('2026-09-20T10:00:00Z'),
        transactionType: 'WITHDRAWAL',
        amount: 25000000.00,
        sourceType: 'MANUAL',
        description: 'Pembayaran Bahan Baku Active - PT Chemindo Prima',
        reconciled: false
      },
      {
        bankAccountId: mdrAccount.id,
        date: new Date('2026-09-21T11:30:00Z'),
        transactionType: 'WITHDRAWAL',
        amount: 12500000.00,
        sourceType: 'MANUAL',
        description: 'Pembayaran Kemasan Botol Dropper 30ml - PT Kemasan Nusantara',
        reconciled: false
      }
    ];

    for (const bt of bankTransactions) {
      await prisma.bankTransaction.create({
        data: bt
      });
    }
    console.log(`✅ Seeded ${bankTransactions.length} Bank Transactions`);

    // 4. Seed Journal Entries (Jurnal Umum)
    await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-18T10:00:00Z'),
        reference: 'JRN-2026-0001',
        description: 'Pencatatan Penerimaan Kas Penjualan Maklon Farah Derma',
        lines: {
          create: [
            { accountId: coaMap['11200'].id, debit: 45000000.00, credit: 0 },
            { accountId: coaMap['41100'].id, debit: 0, credit: 45000000.00 }
          ]
        }
      }
    });

    await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-20T11:00:00Z'),
        reference: 'JRN-2026-0002',
        description: 'Pencatatan Beban Pokok Pembelian Bahan Baku Chemindo',
        lines: {
          create: [
            { accountId: coaMap['51100'].id, debit: 25000000.00, credit: 0 },
            { accountId: coaMap['11210'].id, debit: 0, credit: 25000000.00 }
          ]
        }
      }
    });
    console.log('✅ Seeded 2 Journal Entries with balanced debits & credits');

    // 5. Seed Bank Reconciliation
    await prisma.bankReconciliation.create({
      data: {
        bankAccountId: bcaAccount.id,
        periodStart: new Date('2026-09-01T00:00:00Z'),
        periodEnd: new Date('2026-09-30T23:59:59Z'),
        statementBalance: 450000000.00,
        bookBalance: 450000000.00,
        difference: 0.00,
        status: 'RECONCILED',
        notes: 'Rekonsiliasi rekening BCA Maklon periode September 2026 klop tanpa selisih'
      }
    });
    console.log('✅ Seeded 1 Bank Reconciliation session');

    // 6. Seed Fund Request
    const anyUser = await prisma.user.findFirst();
    if (anyUser) {
      await prisma.fundRequest.create({
        data: {
          requesterId: anyUser.id,
          departmentId: 'PRODUKSI',
          amount: 8500000.00,
          reason: 'Penggantian sparepart seal & valve bejana homogenizer MIX-01',
          status: 'APPROVED_BY_DIR',
          attachmentUrls: []
        }
      });
      console.log('✅ Seeded 1 Fund Request');
    }

    console.log('🎉 FASE 7 FINANCE SEEDING COMPLETED SUCCESSFULLY!');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('Error seeding Fase 7 Finance:', e);
  process.exit(1);
});
