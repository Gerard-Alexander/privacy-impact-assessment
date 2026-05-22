const bcrypt = require('bcrypt');
const prisma = require('../../store/prisma');

const requireAdmin = (req, res) => {
  // route middleware already enforces auth, but keep this guard for safety
  const role = req?.session?.user?.role;
  if (role !== 'ADMIN') {
    return res.redirect('/user-profile');
  }
  return null;
};

const profile = (req, res) => {
  return res.render('users/user-profile-page', {
    title: 'User Profile',
    activePage: 'profile',
    user: req.session.user
  });
};

const renderCreateUserPage = (req, res) => {
  const redirectResp = requireAdmin(req, res);
  if (redirectResp) return;

  return res.render('users/create-user-page', {
    title: 'Add Account',
    activePage: 'create-user',
    user: req.session.user,
    error: req.query.error || null
  });
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
    password
  } = req.body || {};

  if (!firstName || !lastName || !userName || !emailAddress || !role || !password) {
    return res.redirect('/user-profile/create-user?error=missing');
  }

  if (String(password).length < 6) {
    return res.redirect('/user-profile/create-user?error=password');
  }

  const normalizedUsername = String(userName).trim();
  const normalizedEmail = String(emailAddress).trim().toLowerCase();

  try {
    // uniqueness checks
    const [existingUserByUsername, existingUserByEmail] = await Promise.all([
      prisma.user.findUnique({ where: { userName: normalizedUsername } }),
      prisma.user.findUnique({ where: { emailAddress: normalizedEmail } })
    ]);

    if (existingUserByUsername) {
      return res.redirect('/user-profile/create-user?error=username');
    }

    if (existingUserByEmail) {
      return res.redirect('/user-profile/create-user?error=email');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        userName: normalizedUsername,
        emailAddress: normalizedEmail,
        password: hashedPassword,
        role
      }
    });

    return res.redirect('/user-profile?created=1');
  } catch (err) {
    console.error('Create user error:', err);
    return res.redirect('/user-profile/create-user?error=server');
  }
};

module.exports = {
  profile,
  renderCreateUserPage,
  createUserSubmit
};

