
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedWebsite(prisma: PrismaClient) {
  console.log('🌱 Seeding Website Data...');

  // 1. Articles
  for (let i = 0; i < 10; i++) {
    const title = faker.lorem.sentence();
    await prisma.article.create({
      data: {
        title,
        slug: faker.helpers.slugify(title).toLowerCase() + '-' + faker.string.alphanumeric(5),
        content: faker.lorem.paragraphs(3),
        metaDescription: faker.lorem.sentence(),
      }
    });
  }

  // 2. Website Products
  for (let i = 0; i < 20; i++) {
    const title = faker.commerce.productName();
    await prisma.websiteProduct.create({
      data: {
        title,
        slug: faker.helpers.slugify(title).toLowerCase() + '-' + faker.string.alphanumeric(5),
        content: faker.lorem.paragraphs(2),
        category: faker.commerce.department(),
        metaDescription: faker.lorem.sentence(),
      }
    });
  }

  console.log('✅ Website Data Seeded.');
}
