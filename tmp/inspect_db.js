const prisma = require('../store/prisma');

async function main() {
  try {
    console.log('Attempting raw query...');
    const rawTypes = await prisma.$queryRaw`SELECT * FROM DataSubjectTypes`;
    console.log('Raw DataSubjectTypes:', rawTypes);
    const referencingSubjects = await prisma.$queryRaw`SELECT * FROM PiiDatasubject WHERE dataSubjectsType_id = 3`;
    console.log('PiiDatasubject referencing id 3:', referencingSubjects);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
