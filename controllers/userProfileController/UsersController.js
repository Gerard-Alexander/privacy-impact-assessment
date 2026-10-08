const prisma = require('../../store/prisma');
const bcrypt = require('bcrypt');
const { listUserUnits } = require('./userProfileController');

const renderChangePasswordPage = async (req, res) => {
    try {
        const userId = Number.parseInt(req.params.id, 10);
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, firstName: true, lastName: true, userName: true, emailAddress: true }
        });

        if (!targetUser) {
            return res.redirect('/user-profile/manage-users?error=notfound');
        }

        return res.render('users/admin-change-password-page', {
            title: 'Change User Password',
            activePage: 'manage-users',
            user: req.session.user,
            targetUser,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (error) {
        console.error('Error fetching user for password change:', error);
        return res.redirect('/user-profile/manage-users?error=server');
    }
};

const changePasswordByAdmin = async (req, res) => {
    const userId = Number.parseInt(req.params.id, 10);
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');
    const passwordPage = `/user-profile/manage-users/password/${req.params.id}`;

    if (password.length < 6) {
        return res.redirect(`${passwordPage}?error=password`);
    }

    if (password !== confirmPassword) {
        return res.redirect(`${passwordPage}?error=confirm`);
    }

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!targetUser) {
            return res.redirect('/user-profile/manage-users?error=notfound');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return res.redirect(`${passwordPage}?success=1`);
    } catch (error) {
        console.error('Error changing user password by admin:', error);
        return res.redirect(`${passwordPage}?error=server`);
    }
};

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
            targetUser: userToEdit, // The user being edited
            units: await listUserUnits()
        });
    } catch (error) {
        console.error('Error fetching user for admin edit:', error);
        return res.redirect('/user-profile/manage-users');
    }
};

const updateUserByAdminSubmit = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, userName, emailAddress, role, password, units } = req.body;

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
            role: role,
            units: String(units || 'n/a').trim()
        };

        if (updateData.units !== 'n/a' && !await prisma.unit.findUnique({ where: { name: updateData.units } })) {
            return res.redirect(`/user-profile/manage-users/edit/${id}?error=unit`);
        }

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
    deactivateUser,
    renderChangePasswordPage,
    changePasswordByAdmin
};
