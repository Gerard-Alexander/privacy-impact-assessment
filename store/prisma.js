require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = globalThis.__prismaClient || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma;
}

module.exports = prisma;