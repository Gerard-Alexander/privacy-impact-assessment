const prisma = require('../../store/prisma');

const dashboard = async (req, res) => {
  try {
    const currentUserId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'ADMIN';

    // Build the WHERE filter based on role
    // Admins see all assessments; regular users only see what they created or were shared with
    const accessFilter = isAdmin
      ? {}
      : {
          OR: [
            { creatorId: currentUserId },
            { sharedWith: { some: { user_id: currentUserId } } }
          ]
        };

    const [totalAssessments, draftAssessments, completedAssessments, recentAssessments] = await Promise.all([
      prisma.piaAssessment.count({ where: accessFilter }),
      prisma.piaAssessment.count({ where: { ...accessFilter, status: 'DRAFT' } }),
      prisma.piaAssessment.count({ where: { ...accessFilter, status: 'COMPLETED' } }),
      prisma.piaAssessment.findMany({
        where: accessFilter,
        include: {
          authorizedParties: true,
          creator: {
            select: { id: true, firstName: true, lastName: true, userName: true }
          },
          sharedWith: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, emailAddress: true }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ]);

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
