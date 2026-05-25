const prisma = require('../../store/prisma');

/**
 * POST /assessment/share  (JSON body: { piaAssessmentId, userIds[] })
 * Only the creator (or admin) of the assessment can share it.
 * Legacy assessments (creatorId = null) are shareable by anyone who can access them.
 */
const shareAssessment = async (req, res) => {
  try {
    const piaAssessmentId = Number.parseInt(req.body.piaAssessmentId, 10);
    if (!Number.isInteger(piaAssessmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment ID.' });
    }

    // Verify the assessment exists
    const assessment = await prisma.piaAssessment.findUnique({
      where: { id: piaAssessmentId }
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const currentUserId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'ADMIN';
    const isCreator = assessment.creatorId === currentUserId;
    const isLegacy = assessment.creatorId === null; // assessments created before sharing feature

    // Only creator, admin, or legacy-assessment owners can share
    if (!isAdmin && !isCreator && !isLegacy) {
      return res.status(403).json({ success: false, message: 'Only the creator can share this assessment.' });
    }

    // Parse userIds — may be an array or a single value from JSON body
    let userIds = req.body.userIds || [];
    if (!Array.isArray(userIds)) userIds = [userIds];
    userIds = userIds
      .map(id => Number.parseInt(id, 10))
      .filter(id => Number.isInteger(id) && id !== currentUserId); // don't share with yourself

    // Replace all existing shares atomically
    await prisma.assessmentShare.deleteMany({
      where: { piaAssessment_id: piaAssessmentId }
    });

    if (userIds.length > 0) {
      await prisma.assessmentShare.createMany({
        data: userIds.map(uid => ({
          piaAssessment_id: piaAssessmentId,
          user_id: uid
        })),
        skipDuplicates: true
      });
    }

    // Return the updated shared users
    const updatedShares = await prisma.assessmentShare.findMany({
      where: { piaAssessment_id: piaAssessmentId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, emailAddress: true }
        }
      }
    });

    return res.json({
      success: true,
      message: userIds.length > 0
        ? `Assessment shared with ${userIds.length} user(s).`
        : 'All shares removed.',
      sharedUsers: updatedShares.map(s => s.user)
    });

  } catch (error) {
    console.error('Error sharing assessment:', error);
    return res.status(500).json({ success: false, message: 'Server error while sharing assessment.' });
  }
};

/**
 * GET /assessment/share/users?piaAssessmentId=X
 * Returns all users and current shares for the modal (AJAX).
 */
const getShareUsers = async (req, res) => {
  try {
    const piaAssessmentId = Number.parseInt(req.query.piaAssessmentId, 10);
    if (!Number.isInteger(piaAssessmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment ID.' });
    }

    const currentUserId = req.session.user?.id;

    const [allUsers, currentShares] = await Promise.all([
      prisma.user.findMany({
        where: currentUserId ? { id: { not: currentUserId } } : {},
        select: { id: true, firstName: true, lastName: true, emailAddress: true, userName: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
      }),
      prisma.assessmentShare.findMany({
        where: { piaAssessment_id: piaAssessmentId },
        select: { user_id: true }
      })
    ]);

    const sharedUserIds = currentShares.map(s => s.user_id);

    return res.json({ success: true, allUsers, sharedUserIds });
  } catch (error) {
    console.error('Error fetching share users:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { shareAssessment, getShareUsers };
