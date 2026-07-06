const prisma = require('./store/prisma');

async function main() {
  try {
    console.log('Running robust database cleanup of DataSubjectTypes...');

    // 1. Ensure 'OTHERS' exists in DataSubjectTypes
    const othersRows = await prisma.$queryRaw`
      SELECT id FROM DataSubjectTypes WHERE dataSubjectType = 'OTHERS'
    `;

    let othersId;
    if (othersRows.length > 0) {
      othersId = othersRows[0].id;
      console.log(`Found existing 'OTHERS' with ID: ${othersId}`);
    } else {
      await prisma.$executeRaw`
        INSERT INTO DataSubjectTypes (dataSubjectType, createdAt, updatedAt)
        VALUES ('OTHERS', NOW(), NOW())
      `;
      const insertedRows = await prisma.$queryRaw`
        SELECT id FROM DataSubjectTypes WHERE dataSubjectType = 'OTHERS'
      `;
      othersId = insertedRows[0].id;
      console.log(`Created new 'OTHERS' with ID: ${othersId}`);
    }

    // 2. Find invalid DataSubjectTypes
    const invalidRows = await prisma.$queryRaw`
      SELECT id, dataSubjectType FROM DataSubjectTypes
      WHERE dataSubjectType = '' OR dataSubjectType NOT IN ('STUDENTS', 'PATIENTS', 'PARENTS', 'EMPLOYEES', 'SUPPLIERS', 'OTHERS')
    `;

    console.log('Found invalid DataSubjectTypes rows:', invalidRows);

    for (const row of invalidRows) {
      if (row.id === othersId) continue;

      console.log(`Migrating references pointing to invalid DataSubjectType ID: ${row.id} to ID: ${othersId}...`);

      // Update PiiDatasubject references
      const updatedRefs = await prisma.$executeRaw`
        UPDATE PiiDatasubject
        SET dataSubjectsType_id = ${othersId}
        WHERE dataSubjectsType_id = ${row.id}
      `;
      console.log(`Updated ${updatedRefs} rows in PiiDatasubject.`);

      // Delete the invalid DataSubjectType row
      const deleted = await prisma.$executeRaw`
        DELETE FROM DataSubjectTypes
        WHERE id = ${row.id}
      `;
      console.log(`Deleted invalid DataSubjectType row ID ${row.id}: ${deleted} rows deleted.`);
    }

    console.log('Database cleanup completed successfully!');

    // Now verify we can fetch using Prisma client
    const currentTypes = await prisma.dataSubjectTypes.findMany();
    console.log('Current verified DataSubjectTypes:', currentTypes);
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
