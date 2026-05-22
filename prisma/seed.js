 //Seeds 

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const seedUsers = require('./seeds/users.js');
const seedProcessingBasis = require('./seeds/processingBasis.js');

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
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting Database Seed');
    await seedUsers(prisma);
    await seedProcessingBasis(prisma);
  console.log('Seeds Completed Successfully');
}

main()
    .catch((error) => {
        console.error('Error Seeding The Database');
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    })
