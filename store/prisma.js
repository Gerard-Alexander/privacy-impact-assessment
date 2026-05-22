require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const buildDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const database = process.env.DB_DATABASE || '';
  const username = process.env.DB_USERNAME || '';
  const password = process.env.DB_PASSWORD ?? '';

  const auth = username
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}`
    : '';
  const authSegment = auth ? `${auth}@` : '';

  return `mysql://${authSegment}${host}:${port}/${encodeURIComponent(database)}`;
};

const adapter = new PrismaMariaDb(buildDatabaseUrl());

const prisma = globalThis.__prismaClient || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma;
}

module.exports = prisma;