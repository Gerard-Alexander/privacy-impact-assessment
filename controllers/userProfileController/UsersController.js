const prisma = require('../../store/prisma');
const bcrypt = require('bcrypt');

const editUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const userToEdit = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!userToEdit) {
            return res.redirect('/user-profile/manage-users?error=notfound');
        }

        return res.render('users/admin-edit-user-page', {
            title: 'Edit User Account',
            activePage: 'manage-users',
            user: req.session.user, // The admin
            targetUser: userToEdit // The user being edited
        });
    } catch (error) {
        console.error('Error fetching user for admin edit:', error);
        return res.redirect('/user-profile/manage-users');
    }
};

const updateUserByAdminSubmit = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, userName, emailAddress, role, password } = req.body;

        const userId = parseInt(id);

        // Check uniqueness if username changed
        if (userName) {
            const existing = await prisma.user.findUnique({
                where: { userName: userName.trim() }
            });
            if (existing && existing.id !== userId) {
                return res.redirect(`/user-profile/manage-users/edit/${id}?error=username-exists`);
            }
        }

        const updateData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            userName: userName.trim(),
            emailAddress: emailAddress.trim().toLowerCase(),
            role: role
        };

        if (password && password.trim().length >= 6) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        return res.redirect('/user-profile/manage-users?updated=1');
    } catch (error) {
        console.error('Error updating user by admin:', error);
        return res.redirect(`/user-profile/manage-users/edit/${req.params.id}?error=1`);
    }
};

const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });
        return res.redirect('/user-profile/manage-users?deleted=1');
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.redirect('/user-profile/manage-users?error=delete');
    }
};

module.exports = {
    editUserByAdmin,
    updateUserByAdminSubmit,
    deactivateUser
};
