
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

try {
    console.log("Attempting new PrismaClient()...");
    const p1 = new PrismaClient();
    console.log("p1 created");
} catch (e) {
    console.log("p1 failed:", e.message);
}

try {
    console.log("Attempting new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })...");
    const p2 = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });
    console.log("p2 created");
} catch (e) {
    console.log("p2 failed:", e.message);
}

try {
    console.log("Attempting new PrismaClient({})...");
    const p3 = new PrismaClient({});
    console.log("p3 created");
} catch (e) {
    console.log("p3 failed:", e.message);
}
