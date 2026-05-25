const prisma = require('../../store/prisma');

const reportsMain = async (req, res) => {
  try {
    const currentUserId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'ADMIN';

    const accessFilter = isAdmin
      ? {}
      : {
          OR: [
            { creatorId: currentUserId },
            { sharedWith: { some: { user_id: currentUserId } } }
          ]
        };

    const [
      totalAssessments,
      draftAssessments,
      completedAssessments,
      piiCount,
      dataSubjectCount,
      pdlcCount,
      totalThreats,
      threatsWithControl,
      topRisks,
      recentAssessments
    ] = await Promise.all([
      prisma.piaAssessment.count({ where: accessFilter }),
      prisma.piaAssessment.count({ where: { ...accessFilter, status: 'DRAFT' } }),
      prisma.piaAssessment.count({ where: { ...accessFilter, status: 'COMPLETED' } }),
      prisma.pII.count({ where: { piaAssessment: accessFilter } }),
      prisma.piiDatasubject.count({ where: { pii: { piaAssessment: accessFilter } } }),
      prisma.pDLC.count({ where: { piaAssessment: accessFilter } }),
      prisma.threatsAndControl.count({ where: { piaAssessment: accessFilter } }),
      prisma.threatsAndControl.count({
        where: {
          piaAssessment: accessFilter,
          AND: [
            { proposedControl: { not: null } },
            { proposedControl: { not: '' } }
          ]
        }
      }),
      prisma.threatsAndControl.findMany({
        where: { piaAssessment: accessFilter },
        include: {
          piaAssessment: { select: { id: true, dpsName: true, status: true } },
          dataSubjects: {
            select: {
              name: true,
              dataSubjectType: { select: { dataSubjectType: true } }
            }
          },
          pdlc: { select: { stakeholderName: true } }
        },
        orderBy: [
          { currentRiskRating: 'desc' },
          { afterRiskRating: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: 5
      }),
      prisma.piaAssessment.findMany({
        where: accessFilter,
        orderBy: { updatedAt: 'desc' },
        take: 6
      })
    ]);

    const coveragePercent = totalThreats > 0
      ? Math.round((threatsWithControl / totalThreats) * 100)
      : 0;

    return res.render('reports/reports-main-page', {
      title: 'Reports',
      activePage: 'reports',
      user: req.session.user,
      totalAssessments,
      draftAssessments,
      completedAssessments,
      piiCount,
      dataSubjectCount,
      pdlcCount,
      totalThreats,
      threatsWithControl,
      coveragePercent,
      topRisks,
      recentAssessments
    });
  } catch (error) {
    console.error('Error loading reports data:', error);
    return res.render('reports/reports-main-page', {
      title: 'Reports',
      activePage: 'reports',
      user: req.session.user,
      totalAssessments: 0,
      draftAssessments: 0,
      completedAssessments: 0,
      piiCount: 0,
      dataSubjectCount: 0,
      pdlcCount: 0,
      totalThreats: 0,
      threatsWithControl: 0,
      coveragePercent: 0,
      topRisks: [],
      recentAssessments: []
    });
  }
};

module.exports = {
  reportsMain
};
