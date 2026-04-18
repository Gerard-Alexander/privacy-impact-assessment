const bcrypt = require('bcrypt');

async function seedUsers(prisma) {
    const hashedAdminPassword = await bcrypt.hash('password', 10);
    const hashedUserPassword = await bcrypt.hash('password', 10);

    await prisma.user.createMany({
        data: [
            {
                firstName: "Admin",
                lastName: "Admin",
                userName: "admin",
                password: hashedAdminPassword,
                role: "ADMIN",
            },
            {
                firstName: "User",
                lastName: "User",
                userName: "user",
                password: hashedUserPassword,
                role: "USER",
            }
        ],
        skipDuplicates: true
    });
    console.log('Successfully seeded Users');
}

module.exports = seedUsers;