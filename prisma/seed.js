 //Seeds 

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const seedUsers = require('./seeds/users.js');
const seedProcessingBasis = require('./seeds/processingBasis.js');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
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
