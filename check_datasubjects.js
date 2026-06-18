const prisma = require('./store/prisma');

async function main() {
  try {
    const types = await prisma.dataSubjectTypes.findMany();
    console.log('Current Data Subject Types:', types);
  } catch (error) {
    console.error('Error fetching data subject types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
