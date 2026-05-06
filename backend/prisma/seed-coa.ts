import { PrismaClient, AccountType, NormalBalance } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Chart of Accounts (CoA)...');
  
  const accounts = [
    { code: '1100', name: 'Kas & Bank', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT },
    { code: '1200', name: 'Piutang Usaha', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT },
    { code: '2100', name: 'Hutang Usaha', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT },
    { code: '3100', name: 'Modal', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT },
    { code: '4100', name: 'Pendapatan Layanan', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT },
    { code: '5100', name: 'Beban Operasional', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: acc,
    });
  }

  console.log('CoA Seeding Completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
