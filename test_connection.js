const prisma = require('./store/prisma');

async function test() {
  try {
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('Connected successfully!');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
