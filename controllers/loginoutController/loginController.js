const bcrypt = require('bcrypt');
const prisma = require('../../store/prisma');
const { recordLoginFailure, resetLoginAttempts } = require('../../middleware/loginRateLimit');

const loginSubmit = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    recordLoginFailure(req);
    return res.redirect('/login-page?error=invalid');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { userName: username }
    });

    if (!user) {
      recordLoginFailure(req);
      return res.redirect('/login-page?error=invalid');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      recordLoginFailure(req);
      return res.redirect('/login-page?error=invalid');
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regenerate error:', err);
        return res.redirect('/login-page?error=server');
      }

      req.session.user = {
        id: user.id,
        username: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        emailAddress: user.emailAddress
      };

      resetLoginAttempts(req);

      return res.redirect('/user-profile');
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.redirect('/login-page?error=server');
  }
};

module.exports = {
  loginSubmit
};