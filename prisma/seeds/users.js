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
                emailAddress: "admin@.slu.edu.ph",
                password: hashedAdminPassword,
                role: "ADMIN",
            },
            {
                firstName: "User",
                lastName: "User",
                userName: "user",
                emailAddress: "user@.slu.edu.ph",
                password: hashedUserPassword,
                role: "USER",
            }
        ],
        skipDuplicates: true
    });
    console.log('Successfully seeded Users');
}

module.exports = seedUsers;