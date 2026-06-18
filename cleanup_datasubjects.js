const prisma = require('./store/prisma');

async function main() {
  try {
    console.log('Attempting to clean up orphaned DataSubjectTypes...');
    // Delete records where dataSubjectType is empty or not in the new enum list
    const deletedCount = await prisma.$executeRaw`
      DELETE FROM DataSubjectTypes 
      WHERE dataSubjectType = '' 
      OR dataSubjectType NOT IN ('EMPLOYEES', 'CLIENTS', 'SUPPLIERS')
    `;
    console.log('Cleanup successful. Deleted rows:', deletedCount);

    const types = await prisma.dataSubjectTypes.findMany();
    console.log('Current Data Subject Types:', types);
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
