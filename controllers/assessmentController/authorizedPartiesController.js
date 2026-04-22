const prisma = require('../../store/prisma');

const authorizedParties = (req, res) => {
  res.locals.authParties = 'Authorized Parties';
  
  const piaAssessmentId = req.query.id || req.session.currentAssessmentId;
  const success = req.query.saved === '1' ? 'Authorized parties saved successfully!' : null;
  
  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }
  return res.render('assessment/authorizedparties-page', {
    title: res.locals.authParties,
    activePage: 'authorizedparties-page',
    user: req.session.user,
    piaAssessmentId,
    error: null,
    success
  });
};

const saveAuthorizedParties = async (req, res) => {
  try {
    const body = req.body || {};
    const getFieldValue = (value) => (Array.isArray(value) ? value[0] : value || '');
    const piaAssessment_id = Number.parseInt(body.piaAssessment_id, 10);

    if (!Number.isInteger(piaAssessment_id)) {
      return res.render('assessment/authorizedparties-page', {
        title: 'Authorized Parties',
        piaAssessmentId: req.session.currentAssessmentId,
        activePage: 'authorizedparties-page',
        user: req.session.user,
        error: 'Assessment ID is required.',
        success: null
      });
    }

    const partyDefinitions = [
      {
        firstNameField: 'headFirstName',
        lastNameField: 'headLastName',
        positionField: 'headPosition',
        officeField: 'headOfficeUnit',
        emailField: '',
        signatureField: 'headSignature',
        userType: 'HEAD_OFFICE'
      },
      {
        firstNameField: 'compName',
        lastNameField: 'compLastName',
        positionField: 'compPosition',
        officeField: '',
        emailField: 'compEmail',
        signatureField: 'compSignature',
        userType: 'COMPLIANCE_OFFICER'
      },
      {
        firstNameField: 'reviewFirstName',
        lastNameField: 'reviewLastName',
        positionField: 'reviewPosition',
        officeField: '',
        emailField: '',
        signatureField: 'reviewSignature',
        userType: 'REVIEWER'
      },
      {
        firstNameField: 'approveFirstName',
        lastNameField: 'approveLastName',
        positionField: 'approvePosition',
        officeField: '',
        emailField: '',
        signatureField: 'approveSignature',
        userType: 'APPROVED_BY'
      }
    ];

    const partyData = partyDefinitions
      .filter(({ firstNameField, positionField }) => body[firstNameField] || body[positionField])
      .map(({ firstNameField, lastNameField, positionField, officeField, emailField, signatureField, userType }) => ({
        piaAssessment_id,
        name: `${getFieldValue(body[firstNameField])} ${getFieldValue(body[lastNameField])}`.replace(/\s+/g, ' ').trim(),
        position: getFieldValue(body[positionField]),
        officeUnit: getFieldValue(body[officeField]),
        email: getFieldValue(body[emailField]),
        userType,
        signature: getFieldValue(body[signatureField])
      }));

    if (!partyData.length) {
      return res.render('assessment/authorizedparties-page', {
        title: 'Authorized Parties',
        piaAssessmentId: body.piaAssessment_id,
        activePage: 'authorizedparties-page',
        user: req.session.user,
        error: 'Please complete at least one authorized party section.',
        success: null
      });
    }

    await prisma.$transaction([
      prisma.authorizedParties.deleteMany({ where: { piaAssessment_id } }),
      ...partyData.map((data) => prisma.authorizedParties.create({ data }))
    ]);

    req.session.currentAssessmentId = piaAssessment_id;
    return res.redirect(`/assessment/authorizedparties?id=${piaAssessment_id}&saved=1`);
  } catch (error) {
    console.error('Error saving authorized parties:', error);
    return res.render('assessment/authorizedparties-page', {
      title: 'Authorized Parties',
      piaAssessmentId: req.body?.piaAssessment_id || req.session.currentAssessmentId,
      activePage: 'authorizedparties-page',
      user: req.session.user,
      error: 'Failed to save authorized parties.',
      success: null
    });
  }
};

module.exports = {
  authorizedParties,
	saveAuthorizedParties
};
