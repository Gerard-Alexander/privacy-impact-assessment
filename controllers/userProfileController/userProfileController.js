const bcrypt = require('bcrypt');
const prisma = require('../../store/prisma');
const listUserUnits = async () => (await prisma.unit.findMany({
  where: { name: { not: 'n/a' } },
  orderBy: { name: 'asc' },
  select: { name: true }
})).map(unit => unit.name);

const requireAdmin = (req, res) => {
  // route middleware already enforces auth, but keep this guard for safety
  const role = req?.session?.user?.role;
  if (role !== 'ADMIN') {
    return res.redirect('/user-profile');
  }
  return null;
};

const profile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const fullUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    return res.render('users/user-profile-page', {
      title: 'Account Profile',
      activePage: 'profile',
      user: fullUser 
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.render('users/user-profile-page', {
      title: 'Account Profile',
      activePage: 'profile',
      user: req.session.user 
    });
  }
};

const editProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    return res.render('users/edit-profile-page', {
      title: 'Edit Profile',
      activePage: 'profile',
      user,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    res.redirect('/user-profile');
  }
};

const updateProfileSubmit = async (req, res) => {
  const userId = req.session.user.id;
  const { firstName, lastName, userName, emailAddress } = req.body;

  try {
    // Uniqueness check for username if it's being changed
    if (userName) {
        const existing = await prisma.user.findUnique({ where: { userName: userName.trim() } });
        if (existing && existing.id !== userId) {
            return res.redirect('/user-profile/edit?error=username-exists');
        }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userName: userName.trim(),
        emailAddress: emailAddress.trim().toLowerCase()
      }
    });

    // Update session data
    if (req.session.user) {
        req.session.user.username = updatedUser.userName;
        req.session.user.firstName = updatedUser.firstName;
        req.session.user.lastName = updatedUser.lastName;
        req.session.user.fullName = `${updatedUser.firstName} ${updatedUser.lastName}`.trim();
        req.session.user.emailAddress = updatedUser.emailAddress;
    }

    return res.redirect('/user-profile?updated=1');
  } catch (error) {
    console.error('Update profile error:', error);
    return res.redirect('/user-profile/edit?error=1');
  }
};

const manageUsers = async (req, res) => {
  const redirectResp = requireAdmin(req, res);
  if (redirectResp) return;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return res.render('users/manage-users-page', {
      title: 'Manage User Accounts',
      activePage: 'manage-users',
      user: req.session.user,
      users
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.redirect('/dashboard');
  }
};

const manageUnits = async (req, res) => {
  const redirectResp = requireAdmin(req, res);
  if (redirectResp) return;

  try {
    const units = await prisma.unit.findMany({
      where: { name: { not: 'n/a' } },
      orderBy: { name: 'asc' }
    });

    return res.render('users/manage-units-page', {
      title: 'Manage Units',
      activePage: 'manage-units',
      user: req.session.user,
      units,
      error: req.query.error || null,
      successMessage: req.query.created === '1'
        ? 'Unit created successfully.'
        : req.query.updated === '1'
          ? 'Unit updated successfully. Current user account assignments were updated.'
          : req.query.deleted === '1'
            ? 'Unit deleted. Assigned accounts were set to n/a; existing PIA records were unchanged.'
            : null
    });
  } catch (error) {
    console.error('List units error:', error);
    return res.redirect('/user-profile/manage-users?error=server');
  }
};

const createUnitSubmit = async (req, res) => {
  const redirectResp = requireAdmin(req, res);
  if (redirectResp) return;

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name || name.length > 255 || name.toLowerCase() === 'n/a') {
    return res.redirect('/user-profile/manage-units?error=invalid');
  }

  try {
    await prisma.unit.create({ data: { name } });
    return res.redirect('/user-profile/manage-units?created=1');
  } catch (error) {
    if (error.code === 'P2002') {
      return res.redirect('/user-profile/manage-units?error=exists');
    }
    console.error('Create unit error:', error);
    return res.redirect('/user-profile/manage-units?error=server');
  }
};

const updateUnitSubmit = async (req, res) => {
  const redirectResp = requireAdmin(req, res);
  if (redirectResp) return;

  const unitId = Number(req.params.id);
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!Number.isInteger(unitId) || unitId < 1) {
    return res.redirect('/user-profile/manage-units?error=notfound');
  }
  if (!name || name.length > 255 || name.toLowerCase() === 'n/a') {
    return res.redirect('/user-profile/manage-units?error=invalid');
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existingUnit = await tx.unit.findUnique({ where: { id: unitId } });
      if (!existingUnit) return false;

      await tx.unit.update({
        where: { id: unitId },
        data: { name }
      });

      if (existingUnit.name !== name) {
        await tx.user.updateMany({
          where: { units: existingUnit.name },
          data: { units: name }
        });
      }
      return true;
    });

    return res.redirect(`/user-profile/manage-units?${updated ? 'updated=1' : 'error=notfound'}`);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.redirect('/user-profile/manage-units?error=exists');
    }
    console.error('Update unit error:', error);
    return res.redirect('/user-profile/manage-units?error=server');
  }
};

const deleteUnitSubmit = async (req, res) => {
  const redirectResp = requireAdmin(req, res);
  if (redirectResp) return;

  const unitId = Number(req.params.id);
  if (!Number.isInteger(unitId) || unitId < 1) {
    return res.redirect('/user-profile/manage-units?error=notfound');
  }

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const unit = await tx.unit.findUnique({ where: { id: unitId } });
      if (!unit) return false;

      await tx.user.updateMany({
        where: { units: unit.name },
        data: { units: 'n/a' }
      });
      await tx.unit.delete({ where: { id: unitId } });
      return true;
    });

    return res.redirect(`/user-profile/manage-units?${deleted ? 'deleted=1' : 'error=notfound'}`);
  } catch (error) {
    console.error('Delete unit error:', error);
    return res.redirect('/user-profile/manage-units?error=server');
  }
};

const renderCreateUserPage = async (req, res) => {
  const redirectResp = requireAdmin(req, res);
  if (redirectResp) return;

  try {
    return res.render('users/create-user-page', {
      title: 'Add Account',
      activePage: 'create-user',
      user: req.session.user,
      units: await listUserUnits(),
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Create user page error:', error);
    return res.redirect('/user-profile/manage-users?error=server');
  }
};

const createUserSubmit = async (req, res) => {
  const redirectResp = requireAdmin(req, res);
  if (redirectResp) return;

  const {
    firstName,
    lastName,
    userName,
    emailAddress,
    role,
    units,
    password,
    confirmPassword
  } = req.body || {};

  if (!firstName || !lastName || !userName || !emailAddress || !role || !password || !confirmPassword) {
    return res.redirect('/user-profile/create-user?error=missing');
  }

  if (String(password).length < 6) {
    return res.redirect('/user-profile/create-user?error=password');
  }

  if (String(password) !== String(confirmPassword)) {
    return res.redirect('/user-profile/create-user?error=confirm');
  }

  const normalizedUsername = String(userName).trim();
  const normalizedEmail = String(emailAddress).trim().toLowerCase();
  const normalizedUnit = String(units || 'n/a').trim();

  try {
    if (normalizedUnit !== 'n/a' && !await prisma.unit.findUnique({ where: { name: normalizedUnit } })) {
      return res.redirect('/user-profile/create-user?error=unit');
    }

    const [existingUserByUsername, existingUserByEmail] = await Promise.all([
      prisma.user.findUnique({ where: { userName: normalizedUsername } }),
      prisma.user.findUnique({ where: { emailAddress: normalizedEmail } })
    ]);

    if (existingUserByUsername) return res.redirect('/user-profile/create-user?error=username');
    if (existingUserByEmail) return res.redirect('/user-profile/create-user?error=email');

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        userName: normalizedUsername,
        emailAddress: normalizedEmail,
        units: normalizedUnit,
        password: hashedPassword,
        role
      }
    });

    return res.redirect('/user-profile/manage-users?created=1');
  } catch (err) {
    console.error('Create user error:', err);
    return res.redirect('/user-profile/create-user?error=server');
  }
};

module.exports = {
  profile,
  editProfile,
  updateProfileSubmit,
  manageUsers,
  manageUnits,
  createUnitSubmit,
  updateUnitSubmit,
  deleteUnitSubmit,
  renderCreateUserPage,
  createUserSubmit,
  listUserUnits
};
