



const dpsName = (req, res) => {
	return res.render('assessment/dpsname-page', {
		title: 'Data Processing System',
		activePage: 'dpsname-page',
		user: req.session.user
	});
};