const profile = (req, res) => {
  return res.render('users/user-profile-page', {
    title: 'User Profile',
    activePage: 'profile',
    user: req.session.user
  });
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to end session' });
    }

    res.clearCookie('connect.sid');
    return res.redirect('/');
  });
};

module.exports = {
  profile,
  logout
};