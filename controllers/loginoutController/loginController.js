const bcrypt = require('bcrypt');
const prisma = require('../../store/prisma');

const loginSubmit = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.redirect('/login-page?error=invalid');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { userName: username }
    });

    if (!user) {
      return res.redirect('/login-page?error=invalid');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.redirect('/login-page?error=invalid');
    }

    req.session.user = {
      username: user.userName,
      role: user.role,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      emailAddress: user.emailAddress
    };

    return res.redirect('/user-profile');
  } catch (error) {
    console.error('Login error:', error);
    return res.redirect('/login-page?error=server');
  }
};

module.exports = {
  loginSubmit
};