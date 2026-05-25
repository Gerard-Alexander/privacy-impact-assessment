const prisma = require('./store/prisma');

async function test() {
  try {
    const record = await prisma.piaAssessment.findFirst({
      include: { sharedWith: true, creator: { select: { id: true, userName: true } } }
    });
    console.log('✅ DB connection OK');
    if (record) {
      console.log('Sample assessment id:', record.id);
      console.log('creatorId:', record.creatorId);
      console.log('sharedWith count:', record.sharedWith.length);
    } else {
      console.log('(no assessments yet)');
    }

    // Test user fetch
    const users = await prisma.user.findMany({ select: { id: true, userName: true }, take: 3 });
    console.log('Users found:', users.map(u => `${u.id}:${u.userName}`).join(', '));

    // Test assessmentShare table
    const shareCount = await prisma.assessmentShare.count();
    console.log('AssessmentShare rows:', shareCount);

    console.log('\n✅ All checks passed. Schema is correct.');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
