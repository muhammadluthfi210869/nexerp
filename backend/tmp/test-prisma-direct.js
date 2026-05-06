
const { PrismaClient } = require('./node_modules/.prisma/client');
require('dotenv').config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

try {
    console.log("Attempting new PrismaClient() from .prisma/client ...");
    const p1 = new PrismaClient();
    console.log("p1 created");
} catch (e) {
    console.log("p1 failed:", e.message);
    console.log("Error details:", e);
}

try {
    console.log("Attempting new PrismaClient({ datasourceUrl: process.env.DATABASE_URL }) ...");
    const p2 = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL
    });
    console.log("p2 created");
} catch (e) {
    console.log("p2 failed:", e.message);
}
