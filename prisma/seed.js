require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const seedUsers = require('./seeds/users.js');
const seedProcessingBasis = require('./seeds/processingBasis.js');

const prisma = new PrismaClient();

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
