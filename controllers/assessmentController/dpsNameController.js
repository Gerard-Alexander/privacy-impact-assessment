const prisma = require('../../store/prisma');

const formatAssessmentForForm = (assessment) => {
  if (!assessment) {
    return null;
  }

  return {
    ...assessment,
    piaStartDate: assessment.piaStartDate ? assessment.piaStartDate.toISOString().slice(0, 10) : '',
    piaEndDate: assessment.piaEndDate ? assessment.piaEndDate.toISOString().slice(0, 10) : '',
    isOutsourced: assessment.isOutsourced ? '1' : '0'
  };
};

const dpsName = async (req, res) => {
  try {
    res.locals.dpsTitle = 'Data Processing System';
    res.locals.authParties = 'Authorized Parties';

    const piaAssessmentId = Number.parseInt(req.query.id || req.session.currentAssessmentId, 10);
    const assessment = Number.isInteger(piaAssessmentId)
      ? await prisma.piaAssessment.findUnique({ where: { id: piaAssessmentId } })
      : null;

    return res.render('assessment/dpsname-page', {
      title: res.locals.dpsTitle,
      activePage: 'dpsname',
      piaAssessmentId: assessment?.id || req.session.currentAssessmentId || '',

      user: req.session.user,
      assessment: formatAssessmentForForm(assessment),
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
      error: 'Failed to load assessment data.',
      success: null
    });
  }
};

const saveDpsName = async (req, res) => {
  try {
    const { 
      systemName, mandate,
      dpsModality, processingRole, isOutsourced, 
      piaStartDate, piaEndDate,
      piaAssessmentId
    } = req.body;
    const parsedAssessmentId = Number.parseInt(piaAssessmentId || req.session.currentAssessmentId, 10);
    const normalizedAssessmentId = Number.isInteger(parsedAssessmentId) ? parsedAssessmentId : null;

    // Validation for essential required fields
    if (!systemName || !mandate || !dpsModality || !processingRole || !piaStartDate || !piaEndDate) {
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
        error: 'Please fill in all required fields.',
        success: null
      });
    }

    if (normalizedAssessmentId) {
      const duplicateAssessment = await prisma.piaAssessment.findFirst({
        where: {
          dpsName: systemName,
          NOT: { id: normalizedAssessmentId }
        }
      });

      if (duplicateAssessment) {
        return res.render('assessment/dpsname-page', {
          title: 'Data Processing System',
          activePage: 'dpsname-page',
          piaAssessmentId: normalizedAssessmentId,
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
          error: 'An assessment with this DPS name already exists.',
          success: null
        });
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
      where: {
        dpsName: systemName
      }
    });

    if (existingAssessment) {
      return res.render('assessment/dpsname-page', {
        title: 'Data Processing System',
        activePage: 'dpsname-page',
        piaAssessmentId: req.session.currentAssessmentId || '',
        user: req.session.user,
        assessment: formatAssessmentForForm({
          id: existingAssessment.id,
          dpsName: systemName,
          mandate,
          dpsModality,
          processingRole,
          isOutsourced: isOutsourced === '1',
          piaStartDate,
          piaEndDate
        }),
        error: 'An assessment with this DPS name already exists.',
        success: null
      });
    }


    const newAssessment = await prisma.piaAssessment.create({
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

    // Save ID in session so further steps know which assessment is active
    req.session.currentAssessmentId = newAssessment.id;

    // Redirect to step 2 with assessment ID
    return res.redirect(`/assessment/authorizedparties?id=${newAssessment.id}`);


  } catch (error) {
    console.error('Error saving assessment:', error);
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
        error: 'Failed to save assessment. Please make sure all dates and fields are valid.',
        success: null
    });
  }
};

module.exports = {
  dpsName,
  saveDpsName
};
