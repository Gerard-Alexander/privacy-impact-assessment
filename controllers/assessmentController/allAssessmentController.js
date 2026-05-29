const prisma = require('../../store/prisma');

const allAssessments = async (req, res) => {
  try {
    const currentUserId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'ADMIN';
    let status = req.query.status || 'ALL';

    // Validate status against Prisma enum to avoid validation errors
    const validStatuses = ['DRAFT', 'COMPLETED', 'ARCHIVED'];
    if (status !== 'ALL' && !validStatuses.includes(status)) {
        status = 'ALL';
    }

    // Build the WHERE filter based on role
    const accessFilter = isAdmin
      ? {}
      : {
          OR: [
            { creatorId: currentUserId },
            { sharedWith: { some: { user_id: currentUserId } } }
          ]
        };

    let whereClause = { ...accessFilter };
    if (status !== 'ALL') {
      whereClause.status = status;
    }

    const assessments = await prisma.piaAssessment.findMany({
      where: whereClause,
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
      orderBy: { updatedAt: 'desc' }
    });

    return res.render('assessment/all-assessments', {
      title: 'All Assessments',
      activePage: 'all-assessments',
      user: req.session.user,
      assessments,
      currentStatus: status
    });
  } catch (error) {
    console.error('Error fetching all assessments:', error);
    return res.render('assessment/all-assessments', {
      title: 'All Assessments',
      activePage: 'all-assessments',
      user: req.session.user,
      assessments: [],
      currentStatus: 'ALL'
    });
  }
};

const archiveAssessment = async (req, res) => {
  try {
    const { id } = req.body;
    const currentUserId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'ADMIN';

    if (!currentUserId && !isAdmin) {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
    }

    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ success: false, message: 'Valid Assessment ID is required.' });
    }

    const assessment = await prisma.piaAssessment.findUnique({
      where: { id: parsedId }
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    if (!isAdmin && assessment.creatorId != currentUserId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to archive this assessment.' });
    }

    await prisma.piaAssessment.update({
      where: { id: parsedId },
      data: { 
        status: 'ARCHIVED',
        statusBeforeArchive: assessment.status
      }
    });

    return res.json({ success: true, message: 'Assessment archived successfully.' });
  } catch (error) {
    console.error('Error archiving assessment:', error);
    return res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
  }
};

const restoreAssessment = async (req, res) => {
  try {
    const { id } = req.body;
    const currentUserId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'ADMIN';

    if (!currentUserId && !isAdmin) {
      return res.status(401).json({ success: false, message: 'Your session has expired.' });
    }

    const parsedId = parseInt(id);
    const assessment = await prisma.piaAssessment.findUnique({ where: { id: parsedId } });

    if (!assessment) return res.status(404).json({ success: false, message: 'Not found.' });
    if (!isAdmin && assessment.creatorId != currentUserId) return res.status(403).json({ success: false, message: 'Unauthorized.' });

    await prisma.piaAssessment.update({
      where: { id: parsedId },
      data: { 
        status: assessment.statusBeforeArchive || 'DRAFT',
        statusBeforeArchive: null
      }
    });

    return res.json({ success: true, message: `Assessment restored to ${assessment.statusBeforeArchive || 'DRAFT'}.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const permanentDeleteAssessment = async (req, res) => {
  try {
    const { id } = req.body;
    const currentUserId = req.session.user?.id;
    const isAdmin = req.session.user?.role === 'ADMIN';

    if (!currentUserId && !isAdmin) return res.status(401).json({ success: false, message: 'Your session has expired.' });

    const parsedId = parseInt(id);
    const assessment = await prisma.piaAssessment.findUnique({ 
        where: { id: parsedId }
    });

    if (!assessment) return res.status(404).json({ success: false, message: 'Not found.' });
    if (!isAdmin && assessment.creatorId != currentUserId) return res.status(403).json({ success: false, message: 'Unauthorized.' });

    // Delete ThreatsAndControl first — it references both PiiDatasubject and PDLC
    // without onDelete: Cascade, so it must be removed before those parent rows are deleted.
    await prisma.threatsAndControl.deleteMany({ where: { piaAssessment_id: parsedId } });

    // Now safe to permanently delete the assessment (all other children have Cascade defined)
    await prisma.piaAssessment.delete({ where: { id: parsedId } });

    return res.json({ success: true, message: 'Assessment permanently deleted.' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  allAssessments,
  archiveAssessment,
  restoreAssessment,
  permanentDeleteAssessment
};
