const dashboard = (req, res) => {
	return res.render('dashboard', {
		title: 'Dashboard',
		activePage: 'dashboard',
		user: req.session.user
	});
};

module.exports = {
	dashboard
};
