require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

const prisma = globalThis.__prismaClient || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma;
}

module.exports = prisma;