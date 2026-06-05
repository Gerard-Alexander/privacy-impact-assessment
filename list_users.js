const prisma = require('./store/prisma');

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in database:', users);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
