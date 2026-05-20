const prisma = require('../../store/prisma');

const formatDateForInput = (value) => (value ? value.toISOString().slice(0, 10) : '');

const authorizedParties = async (req, res) => {
  res.locals.authParties = 'Authorized Parties';
  
  const piaAssessmentId = req.query.id || req.session.currentAssessmentId;
  const success = req.query.saved === '1' ? 'Authorized parties saved successfully!' : null;
  
  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }
  const piaAssessment_id = Number.parseInt(piaAssessmentId, 10);
  const rawPartyData = await prisma.authorizedParties.findMany({ where: { piaAssessment_id } });
  const partyDefinitions = [
    {
      firstNameField: 'headFirstName',
      lastNameField: 'headLastName',
      positionField: 'headPosition',
      officeField: 'headOfficeUnit',
      emailField: '',
      dateField: 'headDateSigned',
      userType: 'HEAD_OFFICE'
    },
    {
      firstNameField: 'compName',
      lastNameField: 'compLastName',
      positionField: 'compPosition',
      officeField: '',
      emailField: 'compEmail',
      dateField: 'compDateSigned',
      userType: 'COMPLIANCE_OFFICER'
    },
    {
      firstNameField: 'reviewFirstName',
      lastNameField: 'reviewLastName',
      positionField: 'reviewPosition',
      officeField: '',
      emailField: '',
      dateField: 'reviewDateSigned',
      userType: 'REVIEWER'
    },
    {
      firstNameField: 'approveFirstName',
      lastNameField: 'approveLastName',
      positionField: 'approvePosition',
      officeField: '',
      emailField: '',
      dateField: 'approveDateSigned',
      userType: 'APPROVED_BY'
    }
  ];
  const formData = {};
  partyDefinitions.forEach(({userType, firstNameField, lastNameField, positionField, officeField, emailField, dateField}) => {
    const party = rawPartyData.find(p => p.userType === userType);
    if (party) {
      const nameParts = party.name.trim().split(/\s+/);
      formData[firstNameField] = nameParts[0] || '';
      formData[lastNameField] = nameParts.slice(1).join(' ') || '';
      formData[positionField] = party.position || '';
      if (officeField) formData[officeField] = party.officeUnit || '';
      if (emailField) formData[emailField] = party.email || '';
      formData[dateField] = formatDateForInput(party.dateSigned);
    }
  });
  return res.render('assessment/authorizedparties-page', {
    title: res.locals.authParties,
    activePage: 'authorizedparties-page',
    user: req.session.user,
    piaAssessmentId,
    authorizedPartiesData: formData,
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
        dateField: 'headDateSigned',
        userType: 'HEAD_OFFICE'
      },
      {
        firstNameField: 'compName',
        lastNameField: 'compLastName',
        positionField: 'compPosition',
        officeField: '',
        emailField: 'compEmail',
        dateField: 'compDateSigned',
        userType: 'COMPLIANCE_OFFICER'
      },
      {
        firstNameField: 'reviewFirstName',
        lastNameField: 'reviewLastName',
        positionField: 'reviewPosition',
        officeField: '',
        emailField: '',
        dateField: 'reviewDateSigned',
        userType: 'REVIEWER'
      },
      {
        firstNameField: 'approveFirstName',
        lastNameField: 'approveLastName',
        positionField: 'approvePosition',
        officeField: '',
        emailField: '',
        dateField: 'approveDateSigned',
        userType: 'APPROVED_BY'
      }
    ];

    const partyData = partyDefinitions
      .filter(({ firstNameField, positionField }) => body[firstNameField] || body[positionField])
      .map(({ firstNameField, lastNameField, positionField, officeField, emailField, dateField, userType }) => ({
        piaAssessment_id,
        name: `${getFieldValue(body[firstNameField])} ${getFieldValue(body[lastNameField])}`.replace(/\s+/g, ' ').trim(),
        position: getFieldValue(body[positionField]),
        officeUnit: getFieldValue(body[officeField]),
        email: getFieldValue(body[emailField]),
        userType,
        dateSigned: body[dateField] ? new Date(body[dateField]) : null
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
    return res.redirect(`/assessment/processdatalifecycle?id=${piaAssessment_id}`);
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
