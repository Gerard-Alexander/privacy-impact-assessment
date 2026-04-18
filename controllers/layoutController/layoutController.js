const getUsername = async (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ username: req.session.user.username });
  }
    return res.status(401).json({ error: 'Unauthorized' });
};

module.exports = {
  getUsername
};