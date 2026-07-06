const prisma = require('../../store/prisma');

const formatDateForInput = (value) => {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }
  return '';
};

const formatAssessmentForForm = (assessment) => {
  if (!assessment) {
    return null;
  }

  return {
    ...assessment,
    piaStartDate: formatDateForInput(assessment.piaStartDate),
    piaEndDate: formatDateForInput(assessment.piaEndDate),
    isOutsourced: assessment.isOutsourced ? '1' : '0'
  };
};

const dpsName = async (req, res) => {
  try {
    res.locals.dpsTitle = 'Data Processing System';
    res.locals.authParties = 'Authorized Parties';

  const piaAssessmentId = Number.parseInt(req.query.id || req.body?.piaAssessmentId || req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);
    const assessment = Number.isInteger(piaAssessmentId)
      ? await prisma.piaAssessment.findUnique({
          where: { id: piaAssessmentId },
          include: { sharedWith: { include: { user: true } } }
        })
      : null;

    // Fetch all users for the share modal (exclude current user)
    const currentUserId = req.session.user?.id;
    const allUsers = await prisma.user.findMany({
      where: currentUserId ? { id: { not: currentUserId } } : {},
      select: { id: true, firstName: true, lastName: true, emailAddress: true, userName: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
    });

    const sharedUserIds = assessment?.sharedWith?.map(s => s.user_id) || [];

    return res.render('assessment/dpsname-page', {
      title: res.locals.dpsTitle,
      activePage: 'dpsname',
      piaAssessmentId: assessment?.id || req.session.currentAssessmentId || '',
      user: req.session.user,
      assessment: formatAssessmentForForm(assessment),
      allUsers,
      sharedUserIds,
      sharedUsers: assessment?.sharedWith?.map(s => s.user) || [],
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Error loading assessment:', error);
    return res.render('assessment/dpsname-page', {
      title: 'Data Processing System',
      activePage: 'dpsname-page',
      piaAssessmentId: req.session.currentAssessmentId || '',
      user: req.session.user,
      assessment: null,
      allUsers: [],
      sharedUserIds: [],
      sharedUsers: [],
      error: 'Failed to load assessment data.',
      success: null
    });
  }
};

const saveDpsName = async (req, res) => {
  try {
    const {
      systemPurpose, systemScope,
      systemName, mandate,
      dpsModality, processingRole, isOutsourced, 
      piaStartDate, piaEndDate
    } = req.body;
    const piaAssessmentId = req.body?.piaAssessmentId || req.body?.piaAssessment_id;
    const parsedAssessmentId = Number.parseInt(piaAssessmentId || req.session.currentAssessmentId, 10);
    const normalizedAssessmentId = Number.isInteger(parsedAssessmentId) ? parsedAssessmentId : null;

    const renderWithError = async (errorMsg) => {
      const allUsers = await prisma.user.findMany({
        where: req.session.user?.id ? { id: { not: req.session.user.id } } : {},
        select: { id: true, firstName: true, lastName: true, emailAddress: true, userName: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
      }).catch(() => []);
      return res.render('assessment/dpsname-page', {
        title: 'Data Processing System',
        activePage: 'dpsname-page',
        piaAssessmentId: normalizedAssessmentId || '',
        user: req.session.user,
        assessment: formatAssessmentForForm({
          id: normalizedAssessmentId,
          dpsName: systemName,
          mandate,
          dpsModality,
          processingRole,
          isOutsourced: isOutsourced === '1',
          piaStartDate,
          piaEndDate
        }),
        allUsers,
        sharedUserIds: [],
        sharedUsers: [],
        error: errorMsg,
        success: null
      });
    };

    // Validation for essential required fields
    if (!systemName || !mandate || !dpsModality || !processingRole || !piaStartDate || !piaEndDate) {
      return renderWithError('Please fill in all required fields.');
    }

    if (normalizedAssessmentId) {
      const duplicateAssessment = await prisma.piaAssessment.findFirst({
        where: {
          dpsName: systemName,
          NOT: { id: normalizedAssessmentId }
        }
      });

      if (duplicateAssessment) {
        return renderWithError('An assessment with this DPS name already exists.');
      }

      const updatedAssessment = await prisma.piaAssessment.update({
        where: { id: normalizedAssessmentId },
        data: {
          dpsName: systemName,
          mandate,
          dpsModality,
          processingRole,
          isOutsourced: isOutsourced === '1',
          piaStartDate: new Date(piaStartDate),
          piaEndDate: new Date(piaEndDate)
        }
      });

      req.session.currentAssessmentId = updatedAssessment.id;
      return res.redirect(`/assessment/authorizedparties?id=${updatedAssessment.id}`);
    }

    const existingAssessment = await prisma.piaAssessment.findFirst({
      where: { dpsName: systemName }
    });

    if (existingAssessment) {
      return renderWithError('An assessment with this DPS name already exists.');
    }

    const currentUserId = req.session.user?.id || null;

    const newAssessment = await prisma.piaAssessment.create({
      data: {
        dpsName: systemName,
        mandate,
        dpsModality,
        processingRole,
        isOutsourced: isOutsourced === '1',
        piaStartDate: new Date(piaStartDate),
        piaEndDate: new Date(piaEndDate),
        creatorId: currentUserId
      }
    });

    // Save ID in session so further steps know which assessment is active
    req.session.currentAssessmentId = newAssessment.id;

    // Redirect to step 2 with assessment ID
    return res.redirect(`/assessment/authorizedparties?id=${newAssessment.id}`);

  } catch (error) {
    console.error('Error saving assessment:', error);
    const { systemName, mandate, dpsModality, processingRole, isOutsourced, piaStartDate, piaEndDate } = req.body;
    return res.render('assessment/dpsname-page', {
        title: 'Data Processing System',
        activePage: 'dpsname-page',
        piaAssessmentId: req.session.currentAssessmentId || '',
        user: req.session.user,
        assessment: formatAssessmentForForm({
          dpsName: systemName,
          mandate,
          dpsModality,
          processingRole,
          isOutsourced: isOutsourced === '1',
          piaStartDate,
          piaEndDate
        }),
        allUsers: [],
        sharedUserIds: [],
        sharedUsers: [],
        error: 'Failed to save assessment. Please make sure all dates and fields are valid.',
        success: null
    });
  }
};

module.exports = {
  dpsName,
  saveDpsName
};
