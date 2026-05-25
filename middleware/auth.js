const prisma = require('../store/prisma');

const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/');
};

/**
 * Middleware: ensure the logged-in user is allowed to access the assessment
 * identified by req.query.id or req.body.piaAssessmentId or req.session.currentAssessmentId.
 * Allowed: ADMIN, the creator, or any shared user.
 *
 * Gracefully handles legacy sessions (no id) by looking up the user by username.
 * Also gracefully handles legacy assessments (no creatorId) for backward compat.
 */
const requireAssessmentAccess = async (req, res, next) => {
  try {
    const piaAssessmentId = Number.parseInt(
      req.query.id || req.body?.piaAssessmentId || req.session.currentAssessmentId,
      10
    );

    // If no assessment ID (new assessment flow) — pass through
    if (!Number.isInteger(piaAssessmentId)) {
      return next();
    }

    const isAdmin = req.session.user?.role === 'ADMIN';
    if (isAdmin) return next();

    // Resolve current user ID — use session id if present, else look up by username
    let currentUserId = req.session.user?.id;
    if (!currentUserId && req.session.user?.username) {
      const dbUser = await prisma.user.findUnique({
        where: { userName: req.session.user.username },
        select: { id: true }
      });
      if (dbUser) {
        currentUserId = dbUser.id;
        // Upgrade session silently so future requests don't need to look up
        req.session.user.id = dbUser.id;
      }
    }

    const assessment = await prisma.piaAssessment.findUnique({
      where: { id: piaAssessmentId },
      select: {
        creatorId: true,
        sharedWith: { select: { user_id: true } }
      }
    });

    if (!assessment) {
      return res.status(404).render('403', {
        title: 'Assessment Not Found',
        user: req.session.user,
        message: 'The assessment you are looking for does not exist.'
      });
    }

    // Legacy assessments (no creator assigned) — accessible to all authenticated users
    if (assessment.creatorId === null) {
      return next();
    }

    const isCreator = assessment.creatorId === currentUserId;
    const isShared = assessment.sharedWith.some(s => s.user_id === currentUserId);

    if (isCreator || isShared) {
      return next();
    }

    return res.status(403).render('403', {
      title: 'Access Denied',
      user: req.session.user,
      message: 'You do not have permission to access this assessment. Ask the owner to share it with you.'
    });
  } catch (error) {
    console.error('requireAssessmentAccess error:', error);
    return next(); // fail open to avoid breaking legacy flows
  }
};

module.exports = {
  requireAuth,
  requireAssessmentAccess
};