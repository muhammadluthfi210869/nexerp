
import { PrismaClient, UserRole, AccountType, NormalBalance, ReportGroup, FundRequestStatus, PaymentStatus, PeriodStatus, InvoiceStatus, InvoiceType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 SEEDING ULTIMATE FINANCE DATA...');

  console.log('🌱 FASE 0: Syncing Executive Users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const users = [
    { email: 'admin@dreamlab.com', fullName: 'Super Admin', roles: [UserRole.SUPER_ADMIN] },
    { email: 'finance@dreamlab.com', fullName: 'Finance Controller', roles: [UserRole.FINANCE] },
    { email: 'scm@dreamlab.com', fullName: 'SCM Manager', roles: [UserRole.SCM, UserRole.PURCHASING] },
    { email: 'bd@dreamlab.com', fullName: 'Business Development', roles: [UserRole.COMMERCIAL] },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { roles: u.roles },
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash: hashedPassword,
        roles: u.roles,
        status: 'ACTIVE',
      },
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@dreamlab.com' } });
  const finance = await prisma.user.findUnique({ where: { email: 'finance@dreamlab.com' } });
  const scm = await prisma.user.findUnique({ where: { email: 'scm@dreamlab.com' } });
  const bd = await prisma.user.findUnique({ where: { email: 'bd@dreamlab.com' } });

  if (!admin || !finance || !scm || !bd) {
    throw new Error('❌ Users could not be synchronized.');
  }

  // Ensure BussdevStaff exists for BD user
  await prisma.bussdevStaff.upsert({
    where: { userId: bd!.id },
    update: {},
    create: {
      name: bd!.fullName || 'Business Development',
      userId: bd!.id,
      targetRevenue: 1000000000,
    }
  });

  const bds = await prisma.bussdevStaff.findUnique({ where: { userId: bd.id } });
  if (!bds) throw new Error('BussdevStaff not found');

  // 2. Clear Existing Finance Data (Careful with dependencies)
  console.log('🧹 Cleaning up finance tables...');
  
  // Use raw SQL to truncate to avoid FK issues if possible, or delete in order
  try {
    await prisma.journalLine.deleteMany();
    await prisma.journalEntry.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.finalInvoice.deleteMany();
    await prisma.bill.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.fundRequest.deleteMany();
    await prisma.financialPeriod.deleteMany();
  } catch (e: any) {
    console.log('⚠️ Cleanup warning (likely FKs):', e.message);
  }
  // We don't delete accounts to avoid breaking other seeds, we'll upsert them.

  // 3. Ensure COA is present (Upserting from seed-pnl-granular logic)
  console.log('📊 Ensuring COA is robust...');
  const accounts = [
    { code: '1110', name: 'Bank BCA (Operasional)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1111', name: 'Bank Mandiri (Penerimaan)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1201', name: 'Piutang Usaha', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1301', name: 'Persediaan Bahan Baku', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '2101', name: 'Hutang Usaha / Supplier', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY },
    { code: '2301', name: 'DP Produksi Klien', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY },
    { code: '3100', name: 'Modal Disetor', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.EQUITY },
    { code: '4101', name: 'Pendapatan Penjualan Maklon', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE },
    { code: '4102', name: 'Pendapatan Sampel', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE },
    { code: '5100', name: 'HPP Produksi', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS },
    { code: '6201', name: 'Beban Gaji', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX },
    { code: '6220', name: 'Beban Listrik & Air', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX },
    { code: '8100', name: 'Beban Admin Bank', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OTHER_EXPENSE },
  ];

  const accountMap: Record<string, string> = {};
  for (const acc of accounts) {
    const created = await prisma.account.upsert({
      where: { code: acc.code },
      update: acc,
      create: acc,
    });
    accountMap[acc.code] = created.id;
  }

  // 4. Create Financial Period
  console.log('📅 Creating Financial Periods...');
  await prisma.financialPeriod.create({
    data: {
      name: 'FY2026-APR',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      status: PeriodStatus.OPEN,
    }
  });

  // 5. Create Journal Entries
  console.log('📝 Creating Journal Entries...');
  
  // A. Initial Balance / Capital
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-04-01'),
      reference: 'JV-2026-001',
      description: 'Saldo Awal - Suntikan Modal April',
      lines: {
        create: [
          { accountId: accountMap['1110'], debit: 1000000000, credit: 0 },
          { accountId: accountMap['3100'], debit: 0, credit: 1000000000 },
        ]
      }
    }
  });

  // B. Monthly Rent & Utilities
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-04-05'),
      reference: 'JV-2026-002',
      description: 'Pembayaran Listrik & Air Kantor',
      lines: {
        create: [
          { accountId: accountMap['6220'], debit: 12500000, credit: 0 },
          { accountId: accountMap['1110'], debit: 0, credit: 12500000 },
        ]
      }
    }
  });

  // C. Sample Revenue
  await prisma.journalEntry.create({
    data: {
      date: new Date('2026-04-10'),
      reference: 'JV-2026-003',
      description: 'Pendapatan Sampel - PT Cantik Selamanya',
      lines: {
        create: [
          { accountId: accountMap['1111'], debit: 1500000, credit: 0 },
          { accountId: accountMap['4102'], debit: 0, credit: 1500000 },
        ]
      }
    }
  });

  // 6. Fund Requests
  console.log('💸 Creating Fund Requests...');
  const fundReqs = [
    { requesterId: bd!.id, departmentId: 'BUSINESS_DEV', amount: 5000000, reason: 'Biaya Meeting Client & Transportasi', status: FundRequestStatus.PENDING_APPROVAL_MGR },
    { requesterId: scm!.id, departmentId: 'SCM', amount: 2500000, reason: 'Beli ATK & Perlengkapan Gudang', status: FundRequestStatus.APPROVED_BY_MGR, approvedById: admin!.id },
    { requesterId: finance!.id, departmentId: 'FINANCE', amount: 1200000, reason: 'Biaya Materai & Pos', status: FundRequestStatus.PAID, approvedById: admin!.id, disbursedById: finance!.id },
  ];

  for (const fr of fundReqs) {
    await prisma.fundRequest.create({ data: fr });
  }

  // 7. AR Invoices
  console.log('🧾 Creating AR Invoices...');
  await prisma.invoice.createMany({
    data: [
      { invoiceNumber: 'INV-2026-001', customerName: 'PT Beauty Global', totalAmount: 150000000, outstandingAmount: 50000000, dueDate: new Date('2026-05-15'), status: PaymentStatus.PARTIAL },
      { invoiceNumber: 'INV-2026-002', customerName: 'Glow Up Corp', totalAmount: 75000000, outstandingAmount: 75000000, dueDate: new Date('2026-04-20'), status: PaymentStatus.OVERDUE },
      { invoiceNumber: 'INV-2026-003', customerName: 'Skin Care Solutions', totalAmount: 200000000, outstandingAmount: 0, dueDate: new Date('2026-04-25'), status: PaymentStatus.PAID },
    ]
  });

  // 8. AP Bills
  console.log('💳 Creating AP Bills...');
  await prisma.bill.createMany({
    data: [
      { billNumber: 'BILL-SCM-001', supplierName: 'Global Chemical Corp', totalAmount: 45000000, outstandingAmount: 45000000, dueDate: new Date('2026-05-01'), status: PaymentStatus.PENDING },
      { billNumber: 'BILL-SCM-002', supplierName: 'Indo Packaging', totalAmount: 12000000, outstandingAmount: 0, dueDate: new Date('2026-04-15'), status: PaymentStatus.PAID },
    ]
  });

  // 9. Operational Invoices (SalesInvoice) linked to WorkOrder/SalesOrder
  console.log('🚛 Creating Operational Invoices...');
  
  // Ensure we have a Sample and a SalesOrder
  const existingSO = await prisma.salesOrder.findFirst();
  let so = existingSO;

  if (!so) {
     console.log('📦 No SalesOrder found, creating dummy for dependencies...');
     const lead = await prisma.salesLead.create({
       data: {
         clientName: 'Dummy Client',
         contactInfo: 'dummy@example.com',
         source: 'OFFLINE',
         productInterest: 'Cream',
         picId: bds!.id,
       }
     });

     const sample = await prisma.sampleRequest.create({
       data: {
         leadId: lead.id,
         productName: 'Dummy Cream',
         targetFunction: 'Moisturizing',
         textureReq: 'Creamy',
         colorReq: 'White',
         aromaReq: 'Rose',
         stage: 'APPROVED',
       } as any
     });

     so = await prisma.salesOrder.create({
       data: {
         id: 'SO-DUMMY-001',
         leadId: lead.id,
         sampleId: sample.id,
         totalAmount: 100000000,
         quantity: 1000,
         status: 'ACTIVE',
       }
     });
  }

  if (so) {
    const amountDue = Number(so.totalAmount) * 0.5;
    await prisma.salesInvoice.upsert({
      where: { id: 'OP-INV-001' },
      update: {},
      create: {
        id: 'OP-INV-001',
        soId: so.id,
        type: InvoiceType.DP,
        amountDue: amountDue,
        status: InvoiceStatus.PAID,
      }
    });

    await prisma.payment.create({
      data: {
        invoiceId: 'OP-INV-001',
        verifiedBy: finance!.id,
        amountPaid: amountDue,
        receivingAccountId: accountMap['1111'],
        attachmentUrls: ['https://placehold.co/600x400?text=Bukti+Transfer'],
      }
    });
  }

  // 10. Final Invoices (Linked to WorkOrder)
  const existingWO = await prisma.workOrder.findFirst();
  let wo = existingWO;
  
  if (!wo && so) {
    wo = await prisma.workOrder.create({
      data: {
        leadId: so.leadId,
        woNumber: 'WO-DUMMY-001',
        targetQty: 1000,
        targetCompletion: new Date('2026-12-31'),
        stage: 'WAITING_MATERIAL',
      } as any
    });
  }

  if (wo) {
    await prisma.finalInvoice.create({
      data: {
        workOrderId: wo.id,
        totalAmount: 125000000,
        remainingAmount: 125000000,
        status: 'UNPAID',
      }
    });
  }

  console.log('✅ ULTIMATE FINANCE SEED COMPLETED.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
