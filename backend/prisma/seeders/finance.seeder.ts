
import { PrismaClient, PeriodStatus, InvoiceCategory, InvoiceType, InvoiceStatus, SourceDocumentType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomElement, randomDecimal, generateSequence, randomAprilDate } from './utils';

export async function seedFinance(prisma: PrismaClient) {
  console.log('🌱 Seeding Finance Data...');

  const accounts = await prisma.account.findMany();
  const users = await prisma.user.findMany();
  const financeUser = users.find(u => u.roles.includes('FINANCE')) || users[0];

  // 1. Financial Periods
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
  for (let i = 0; i < months.length; i++) {
    await prisma.financialPeriod.create({
      data: {
        name: `FY2026-${months[i]}`,
        startDate: new Date(2026, i, 1),
        endDate: new Date(2026, i + 1, 0),
        status: i < 3 ? PeriodStatus.CLOSED : PeriodStatus.OPEN,
      }
    });
  }

  // 2. Invoices (Mixed Category)
  const workOrders = await prisma.workOrder.findMany({ take: 10 });
  for (const wo of workOrders) {
    const amount = randomDecimal(50000000, 200000000);
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${faker.string.alphanumeric(8).toUpperCase()}`,
        category: InvoiceCategory.RECEIVABLE,
        type: InvoiceType.FINAL_PAYMENT,
        status: randomElement([InvoiceStatus.PAID, InvoiceStatus.PARTIAL, InvoiceStatus.UNPAID]),
        amountDue: amount,
        outstandingAmount: amount * 0.5,
        dueDate: faker.date.future(),
        workOrderId: wo.id,
      }
    });
  }

  // 3. Journal Entries
  const invoices = await prisma.invoice.findMany({ take: 20 });
  for (const inv of invoices) {
    const journal = await prisma.journalEntry.create({
      data: {
        date: randomAprilDate(),
        reference: `JV-${faker.string.alphanumeric(6).toUpperCase()}`,
        description: `Journal for Invoice ${inv.invoiceNumber}`,
        sourceDocumentType: SourceDocumentType.SALES_ORDER,
        invoiceId: inv.id,
      }
    });

    // Debit AR, Credit Revenue
    const arAcc = accounts.find(a => a.code === '1201');
    const revAcc = accounts.find(a => a.code === '4101');

    if (arAcc && revAcc) {
      await prisma.journalLine.createMany({
        data: [
          { journalId: journal.id, accountId: arAcc.id, debit: inv.amountDue, credit: 0 },
          { journalId: journal.id, accountId: revAcc.id, debit: 0, credit: inv.amountDue },
        ]
      });
    }
  }

  console.log('✅ Finance Data Seeded.');
}
