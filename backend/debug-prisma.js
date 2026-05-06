
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('PrismaClient keys:', Object.keys(new PrismaClient({})));
