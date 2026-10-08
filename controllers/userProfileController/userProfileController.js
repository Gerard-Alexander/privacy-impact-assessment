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
  renderCreateUserPage,
  createUserSubmit,
  listUserUnits
};
