const bcrypt = require('bcrypt');
const prisma = require('../../store/prisma');
const { recordLoginFailure, resetLoginAttempts } = require('../../middleware/loginRateLimit');

const loginSubmit = async (req, res) => {
  console.log('Login route hit! Body:', req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    recordLoginFailure(req);
    return res.redirect('/login-page?error=invalid');
  }

  try {
    console.log(`Login attempt for username: ${username}`);
    const user = await prisma.user.findUnique({
      where: { userName: username }
    });

    if (!user) {
      console.log(`User not found: ${username}`);
      recordLoginFailure(req);
      return res.redirect('/login-page?error=invalid');
    }

    console.log(`User found, comparing password...`);
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      console.log(`Password mismatch for: ${username}`);
      recordLoginFailure(req);
      return res.redirect('/login-page?error=invalid');
    }

    console.log(`Password matched, regenerating session...`);
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regenerate error:', err);
        return res.redirect('/login-page?error=server');
      }

      console.log(`Session regenerated, setting user data...`);
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

      console.log(`Login successful, redirecting to /user-profile`);
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