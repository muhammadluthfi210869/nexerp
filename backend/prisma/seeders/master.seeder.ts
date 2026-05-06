
import { PrismaClient, UserRole, AccountType, NormalBalance, ReportGroup, MaterialType, MaterialStatus, OutboundMethod } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { randomInt, randomDecimal } from './utils';

export async function seedMaster(prisma: PrismaClient) {
  console.log('🌱 Seeding Master Data...');

  // 1. Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const roles = Object.values(UserRole);
  
  const users = await Promise.all(
    roles.map(async (role) => {
      const email = `${role.toLowerCase().replace('_', '.')}@dreamlab.com`;
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          fullName: faker.person.fullName(),
          passwordHash: hashedPassword,
          roles: [role],
          status: 'ACTIVE',
        },
      });
    })
  );

  // 2. Bussdev Staff
  const bdUsers = users.filter(u => u.roles.includes(UserRole.COMMERCIAL) || u.roles.includes(UserRole.SUPER_ADMIN));
  for (const user of bdUsers) {
    await prisma.bussdevStaff.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        name: user.fullName || faker.person.fullName(),
        userId: user.id,
        targetRevenue: 1000000000,
        isActive: true,
      }
    });
  }

  // 3. Chart of Accounts
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
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: acc,
      create: acc,
    });
  }

  // 4. Master Categories
  const categoryTypes = ['MATERIAL', 'CUSTOMER', 'SUPPLIER'];
  for (const type of categoryTypes) {
    await prisma.masterCategory.create({
      data: {
        name: faker.commerce.department(),
        type,
        description: faker.commerce.productDescription(),
      }
    });
  }
  const categories = await prisma.masterCategory.findMany();

  // 5. Suppliers
  for (let i = 0; i < 10; i++) {
    await prisma.supplier.create({
      data: {
        name: faker.company.name(),
        contact: faker.person.fullName(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        address: faker.location.streetAddress(),
        performanceScore: randomDecimal(3, 5, 1),
        categoryId: categories.find(c => c.type === 'SUPPLIER')?.id,
      }
    });
  }

  // 6. Materials
  const materialTypes = Object.values(MaterialType);
  for (let i = 0; i < 50; i++) {
    const type = materialTypes[randomInt(0, materialTypes.length - 1)];
    await prisma.materialItem.create({
      data: {
        name: faker.commerce.productName(),
        code: `MAT-${faker.string.alphanumeric(6).toUpperCase()}`,
        type,
        unit: type === MaterialType.RAW_MATERIAL ? 'KG' : 'PCS',
        unitPrice: randomDecimal(1000, 50000),
        minLevel: 100,
        maxLevel: 5000,
        reorderPoint: 500,
        status: MaterialStatus.ACTIVE,
        outMethod: OutboundMethod.FIFO,
        categoryId: categories.find(c => c.type === 'MATERIAL')?.id,
      }
    });
  }

  console.log('✅ Master Data Seeded.');
}
