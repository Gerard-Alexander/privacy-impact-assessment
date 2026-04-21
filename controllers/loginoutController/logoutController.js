const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout session destroy error:', err);
      return res.status(500).json({ error: 'Failed to end session' });
    }

    console.log('Logout successful');
    res.clearCookie('connect.sid');
    return res.redirect('/');
  });
};

module.exports = {
  logout
};