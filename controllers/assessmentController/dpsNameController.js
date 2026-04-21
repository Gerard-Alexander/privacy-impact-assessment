const prisma = require('../../store/prisma');

const dpsName = (req, res) => {
res.locals.dpsTitle = 'Data Processing System';
  res.locals.authParties = 'Authorized Parties';

  return res.render('assessment/dpsname-page', {
    title: res.locals.dpsTitle,
    activePage: 'dpsname-page',
    user: req.session.user,
    error: null,
    success: null
  });
};

const saveDpsName = async (req, res) => {
  try {
    const { 
      systemName, mandate,
      dpsModality, processingRole, isOutsourced, 
      piaStartDate, piaEndDate 
    } = req.body;

    // Validation for essential required fields
    if (!systemName || !mandate || !dpsModality || !processingRole || !piaStartDate || !piaEndDate) {
      return res.render('assessment/dpsname-page', {
        title: 'Data Processing System',
        activePage: 'dpsname-page',
        user: req.session.user,
        error: 'Please fill in all required fields.',
        success: null
      });
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
        user: req.session.user,
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

    // Let the user know it succeeded and would ideally direct to step 2 next.
    return res.render('assessment/authorizedparties-page', {
      title: res.locals.authParties,
      activePage: 'authorizedparties-page',
      user: req.session.user,
      error: null,
        success: 'Section A saved successfully! In the future, this will redirect to Step 2.'
    });

  } catch (error) {
    console.error('Error saving assessment:', error);
    return res.render('assessment/dpsname-page', {
        title: 'Data Processing System',
        activePage: 'dpsname-page',
        user: req.session.user,
        error: 'Failed to save assessment. Please make sure all dates and fields are valid.',
        success: null
    });
  }
};

module.exports = {
  dpsName,
  saveDpsName
};
