const bcrypt = require('bcrypt');
const prisma = require('../store/prisma');

const home = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/user-profile');
  }

  res.render('index', {
    title: 'PIA System | Welcome'
  });
};

const loginPage = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/user-profile');
  }

  const error = req.query.error || null;
  res.render('loginPage/login-page', {
    title: 'Sign In | PIA System',
    error
  });
};

const registerPage = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/user-profile');
  }

  const error = req.query.error || null;
  return res.render('registerPage/register-page', {
    title: 'Register | PIA System',
    error
  });
};

const registerSubmit = async (req, res) => {
  const { fullName, username, password } = req.body;

  if (!fullName || !username || !password) {
    return res.redirect('/register-page?error=missing');
  }

  if (password.length < 6) {
    return res.redirect('/register-page?error=password');
  }

  const normalizedUsername = username.trim();
  const normalizedFullName = fullName.trim().replace(/\s+/g, ' ');
  const [firstName, ...rest] = normalizedFullName.split(' ');
  const lastName = rest.join(' ') || '-';

  try {
    const existingUser = await prisma.user.findUnique({
      where: { userName: normalizedUsername }
    });

    if (existingUser) {
      return res.redirect('/register-page?error=exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        userName: normalizedUsername,
        password: hashedPassword
      }
    });

    req.session.user = {
      username: newUser.userName,
      role: newUser.role,
      fullName: `${newUser.firstName} ${newUser.lastName}`.trim()
    };

    return res.redirect('/user-profile');
  } catch (error) {
    console.error('Registration error:', error);
    return res.redirect('/register-page?error=server');
  }
};

module.exports = {
  home,
  loginPage,
  registerPage,
  registerSubmit
};
