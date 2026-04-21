const profile = (req, res) => {
  return res.render('users/user-profile-page', {
    title: 'User Profile',
    activePage: 'profile',
    user: req.session.user
  });
};

module.exports = {
  profile,

};