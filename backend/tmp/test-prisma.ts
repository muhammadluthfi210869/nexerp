import * as Prisma from '@prisma/client';

async function main() {
    console.log('--- v10.0.1 DEBUG ---');
    console.log('Prisma keys:', Object.keys(Prisma));
    
    try {
        console.log('Attempting: new Prisma.PrismaClient()');
        const prisma = new Prisma.PrismaClient();
        console.log('SUCCESS: Client created.');
        await prisma.$connect();
        console.log('SUCCESS: Connected to DB.');
        const count = await prisma.user.count();
        console.log('RESULT: User count =', count);
        await prisma.$disconnect();
    } catch (err) {
        console.error('FAILED:', err);
    }
}

main();
