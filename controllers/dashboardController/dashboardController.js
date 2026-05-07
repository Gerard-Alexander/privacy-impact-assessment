const prisma = require('../../store/prisma');

const dashboard = async (req, res) => {
	try {
		const totalAssessments = await prisma.piaAssessment.count();
		const draftAssessments = await prisma.piaAssessment.count({ where: { status: 'DRAFT' } });
		const completedAssessments = await prisma.piaAssessment.count({ where: { status: 'COMPLETED' } });
		
		const recentAssessments = await prisma.piaAssessment.findMany({
			include: { authorizedParties: true },
			orderBy: { updatedAt: 'desc' },
			take: 5
		});

		return res.render('dashboard', {
			title: 'Dashboard',
			activePage: 'dashboard',
			user: req.session.user,
			totalAssessments,
			draftAssessments,
			completedAssessments,
			recentAssessments
		});
	} catch (error) {
		console.error('Error loading dashboard data:', error);
		return res.render('dashboard', {
			title: 'Dashboard',
			activePage: 'dashboard',
			user: req.session.user,
			totalAssessments: 0,
			draftAssessments: 0,
			completedAssessments: 0,
			recentAssessments: []
		});
	}
};

module.exports = {
	dashboard
};
